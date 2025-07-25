import { NextRequest, NextResponse } from "next/server";
import { getCustomSession } from "@/lib/auth-server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";

// GET: Get unread message counts for all conversations
export async function GET(request: NextRequest) {
  try {
    const session = await getCustomSession(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all conversations for the user
    const conversations = await Conversation.find({
      participants: currentUser._id,
    });

    // Get unread message counts for each conversation
    const unreadCounts = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conversation._id,
          sender: { $ne: currentUser._id }, // Messages not sent by current user
          isRead: false,
        });

        return {
          conversationId: conversation._id,
          unreadCount,
        };
      })
    );

    // Convert to a more usable format
    const unreadCountsMap = unreadCounts.reduce((acc, item) => {
      acc[item.conversationId.toString()] = item.unreadCount;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      unreadCounts: unreadCountsMap,
    });
  } catch (error) {
    console.error("Error getting unread counts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
