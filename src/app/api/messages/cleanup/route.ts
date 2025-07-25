import { NextRequest, NextResponse } from "next/server";
import { getCustomSession } from "@/lib/auth-server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Message from "@/models/Message";
import Conversation from "@/models/Conversation";

// POST: Cleanup old messages based on user's message history setting
export async function POST(request: NextRequest) {
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

    const messageHistoryDays = currentUser.settings?.chat?.messageHistory || 30;

    // If set to 0, never delete messages
    if (messageHistoryDays === 0) {
      return NextResponse.json({
        success: true,
        message: "Message history set to never delete",
        deletedCount: 0,
      });
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - messageHistoryDays);

    // Find conversations where user is a participant
    const userConversations = await Conversation.find({
      participants: currentUser._id,
    }).select("_id");

    const conversationIds = userConversations.map((conv) => conv._id);

    // Delete old messages from user's conversations
    const deleteResult = await Message.deleteMany({
      conversationId: { $in: conversationIds },
      createdAt: { $lt: cutoffDate },
    });

    // Update conversations that might have had their last message deleted
    for (const convId of conversationIds) {
      const lastMessage = await Message.findOne({
        conversationId: convId,
      }).sort({ createdAt: -1 });

      if (lastMessage) {
        await Conversation.findByIdAndUpdate(convId, {
          lastMessage: lastMessage._id,
          lastMessageAt: lastMessage.createdAt,
        });
      } else {
        // No messages left in conversation
        await Conversation.findByIdAndUpdate(convId, {
          lastMessage: null,
          lastMessageAt: null,
        });
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.deletedCount,
      messageHistoryDays,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    console.error("Error in message cleanup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Get cleanup status and statistics
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

    const messageHistoryDays = currentUser.settings?.chat?.messageHistory || 30;

    // Find conversations where user is a participant
    const userConversations = await Conversation.find({
      participants: currentUser._id,
    }).select("_id");

    const conversationIds = userConversations.map((conv) => conv._id);

    // Count total messages
    const totalMessages = await Message.countDocuments({
      conversationId: { $in: conversationIds },
    });

    let oldMessages = 0;
    let cutoffDate = null;

    if (messageHistoryDays > 0) {
      cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - messageHistoryDays);

      oldMessages = await Message.countDocuments({
        conversationId: { $in: conversationIds },
        createdAt: { $lt: cutoffDate },
      });
    }

    return NextResponse.json({
      messageHistoryDays,
      totalMessages,
      oldMessages,
      cutoffDate: cutoffDate?.toISOString() || null,
      autoDeleteEnabled: messageHistoryDays > 0,
    });
  } catch (error) {
    console.error("Error getting cleanup status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
