import { NextRequest, NextResponse } from "next/server";
import { getCustomSession } from "@/lib/auth-server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { conversationSchema } from "@/schemas";

// GET: Fetch all conversations for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getCustomSession(request);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Ensure Message model is registered
    if (!Message) {
      console.log("Message model not registered");
    }

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      console.log("User not found for email:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const conversations = await Conversation.find({
      participants: currentUser._id,
    })
      .populate("participants", "_id name email image isOnline lastSeen")
      .sort({ lastMessageAt: -1 });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new conversation
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
    const validation = conversationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid conversation data" },
        { status: 400 }
      );
    }

    const { participants } = validation.data;

    // Ensure current user is not trying to create conversation with themselves
    if (participants.includes(currentUser._id.toString())) {
      return NextResponse.json(
        { error: "Cannot create conversation with yourself" },
        { status: 400 }
      );
    }

    // Check privacy settings for each recipient
    for (const participantId of participants) {
      const recipient = await User.findById(participantId);
      if (!recipient) {
        return NextResponse.json(
          { error: "One or more recipients not found" },
          { status: 404 }
        );
      }

      // Check if recipient allows messages from this user
      const whoCanMessage =
        recipient.settings?.privacy?.whoCanMessage || "everyone";

      if (whoCanMessage === "nobody") {
        return NextResponse.json(
          { error: `${recipient.name} is not accepting messages from anyone` },
          { status: 403 }
        );
      } else if (whoCanMessage === "contacts") {
        // Check if current user is in recipient's contacts
        // For now, we'll consider users as "contacts" if they already have a conversation
        // You can modify this logic based on your contact system requirements
        const existingContact = await Conversation.findOne({
          participants: { $all: [currentUser._id, recipient._id], $size: 2 },
        });

        if (!existingContact) {
          return NextResponse.json(
            { error: `${recipient.name} only accepts messages from contacts` },
            { status: 403 }
          );
        }
      }
      // "everyone" allows all users, so no additional check needed
    }

    // Add current user to participants
    const allParticipants = [currentUser._id.toString(), ...participants];

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: { $all: allParticipants, $size: allParticipants.length },
    });

    if (existingConversation) {
      return NextResponse.json({
        conversation: existingConversation,
        message: "Conversation already exists",
      });
    }

    // Create new conversation
    const conversation = await Conversation.create({
      participants: allParticipants,
      lastMessageAt: new Date(),
    });

    // Populate the conversation with user details
    await conversation.populate(
      "participants",
      "_id name email image isOnline lastSeen"
    );

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a conversation and all its messages
export async function DELETE(request: NextRequest) {
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
    const conversationId = searchParams.get("id");

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
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
        { error: "Conversation not found or access denied" },
        { status: 404 }
      );
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversationId });

    // Delete the conversation
    await Conversation.findByIdAndDelete(conversationId);

    return NextResponse.json(
      {
        message: "Conversation and all messages deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
