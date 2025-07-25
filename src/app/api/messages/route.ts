import { NextRequest, NextResponse } from "next/server";
import { getCustomSession } from "@/lib/auth-server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { messageSchema, messagesPaginationSchema } from "@/schemas";

// GET: Fetch messages for a conversation with pagination
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
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Validate input
    const validation = messagesPaginationSchema.safeParse({
      conversationId,
      cursor,
      limit,
    });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid parameters" },
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

    // Get user's message history setting
    const messageHistoryDays = currentUser.settings?.chat?.messageHistory || 30;

    // Build query for pagination
    const query: {
      conversationId: string;
      createdAt?: { $lt: Date } | { $gte: Date; $lt?: Date };
    } = {
      conversationId: conversationId!,
    };

    // Apply message history filter if not set to "never delete" (0)
    if (messageHistoryDays > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - messageHistoryDays);

      if (cursor) {
        // If we have a cursor, combine both date filters
        query.createdAt = {
          $gte: cutoffDate,
          $lt: new Date(cursor),
        };
      } else {
        // Only apply history filter
        query.createdAt = { $gte: cutoffDate };
      }
    } else if (cursor) {
      // Only apply cursor filter if no history limit
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(query)
      .populate("sender", "_id name email image")
      .sort({ createdAt: -1 })
      .limit(limit);

    const hasMore = messages.length === limit;
    const nextCursor = hasMore
      ? messages[messages.length - 1].createdAt.toISOString()
      : null;

    return NextResponse.json({
      messages: messages.reverse(), // Reverse to show oldest first
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Send a new message
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

    const body = await request.json();
    const validation = messageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid message data" },
        { status: 400 }
      );
    }

    const { conversationId, content, messageType } = validation.data;

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

    // Check privacy settings - verify if recipients still allow messages from current user
    const otherParticipants = conversation.participants.filter(
      (participantId: string) =>
        participantId.toString() !== currentUser._id.toString()
    );

    for (const participantId of otherParticipants) {
      const recipient = await User.findById(participantId);
      if (recipient) {
        const whoCanMessage =
          recipient.settings?.privacy?.whoCanMessage || "everyone";

        if (whoCanMessage === "nobody") {
          return NextResponse.json(
            { error: `${recipient.name} is no longer accepting messages` },
            { status: 403 }
          );
        } else if (whoCanMessage === "contacts") {
          // Since conversation already exists, we could allow it, but you might want
          // to implement a more sophisticated contact system check here
          // For now, we'll allow existing conversations to continue
        }
      }
    }

    // Create message
    const message = await Message.create({
      conversationId,
      sender: currentUser._id,
      content,
      messageType,
    });

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    });

    // Populate sender info
    await message.populate("sender", "_id name email image");

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
