import { NextRequest, NextResponse } from "next/server";
import { getCustomSession } from "@/lib/auth-server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { z } from "zod";
import mongoose from "mongoose";

const markAsReadSchema = z.object({
  conversationId: z.string(),
  messageIds: z.array(z.string()).optional(), // If not provided, mark all unread messages
});

// PUT: Mark messages as read
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const validation = markAsReadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { conversationId, messageIds } = validation.data;

    // Check if user is participant in the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUser._id,
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Build query to mark messages as read
    const query: {
      conversationId: string;
      sender: { $ne: mongoose.Types.ObjectId };
      isRead: boolean;
      _id?: { $in: string[] };
    } = {
      conversationId,
      sender: { $ne: currentUser._id },
      isRead: false,
    };

    // If specific message IDs provided, use them
    if (messageIds && messageIds.length > 0) {
      query._id = { $in: messageIds };
    }

    // Update messages to mark as read
    const result = await Message.updateMany(query, {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Get both participants' read receipt settings
    const allParticipants = await User.find({
      _id: { $in: conversation.participants },
    });

    const senderUser = allParticipants.find(
      (user) => user._id.toString() !== currentUser._id.toString()
    );
    const receiverUser = allParticipants.find(
      (user) => user._id.toString() === currentUser._id.toString()
    );

    // Only return read receipt info if both users have read receipts enabled
    const senderAllowsReadReceipts =
      senderUser?.settings?.privacy?.readReceipts !== false;
    const receiverAllowsReadReceipts =
      receiverUser?.settings?.privacy?.readReceipts !== false;
    const shouldShowReadReceipt =
      senderAllowsReadReceipts && receiverAllowsReadReceipts;

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      showReadReceipt: shouldShowReadReceipt,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Get read status for messages in a conversation
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

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID required" },
        { status: 400 }
      );
    }

    // Check if user is participant in the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUser._id,
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Get read status for user's own messages (sent by current user)
    const readStatus = await Message.aggregate([
      {
        $match: {
          conversationId,
          sender: currentUser._id,
        },
      },
      {
        $group: {
          _id: "$_id",
          isRead: { $first: "$isRead" },
          readAt: { $first: "$readAt" },
          createdAt: { $first: "$createdAt" },
        },
      },
    ]);

    return NextResponse.json({
      readStatus: readStatus.reduce((acc, msg) => {
        acc[msg._id] = {
          isRead: msg.isRead,
          readAt: msg.readAt,
        };
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Error getting read status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
