import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Message from "@/models/Message";
import Conversation from "@/models/Conversation";

// GET: Global message cleanup for all users based on their individual settings
export async function GET() {
  try {
    await connectDB();

    let totalDeleted = 0;
    let usersProcessed = 0;

    // Get all users who have message history settings (not set to "never delete")
    const users = await User.find({
      "settings.chat.messageHistory": { $gt: 0 },
    }).select("_id email settings.chat.messageHistory");

    for (const user of users) {
      try {
        const messageHistoryDays = user.settings?.chat?.messageHistory || 30;

        // Calculate cutoff date for this user
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - messageHistoryDays);

        // Find conversations where user is a participant
        const userConversations = await Conversation.find({
          participants: user._id,
        }).select("_id");

        const conversationIds = userConversations.map((conv) => conv._id);

        if (conversationIds.length === 0) {
          continue; // Skip users with no conversations
        }

        // Delete old messages from user's conversations
        const deleteResult = await Message.deleteMany({
          conversationId: { $in: conversationIds },
          createdAt: { $lt: cutoffDate },
        });

        totalDeleted += deleteResult.deletedCount;
        usersProcessed++;

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

        console.log(
          `Cleaned up ${deleteResult.deletedCount} messages for user ${user.email} (${messageHistoryDays} day retention)`
        );
      } catch (userError) {
        console.error(
          `Error cleaning up messages for user ${user.email}:`,
          userError
        );
        // Continue with next user even if one fails
      }
    }

    const result = {
      success: true,
      totalDeleted,
      usersProcessed,
      timestamp: new Date().toISOString(),
    };

    console.log("Global message cleanup completed:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in global message cleanup:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        success: false,
        totalDeleted: 0,
        usersProcessed: 0,
      },
      { status: 500 }
    );
  }
}
