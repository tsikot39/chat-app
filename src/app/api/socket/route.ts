import { Server } from "socket.io";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

interface SessionData {
  user?: {
    email?: string;
  };
}

interface MessageData {
  conversationId: string;
  content: string;
  sender: string;
}

let io: Server;

const initSocket = () => {
  if (!io) {
    io = new Server({
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
      path: "/api/socket",
    });

    io.on("connection", async (socket) => {
      console.log("New client connected:", socket.id);

      // Store userId on socket for easier access
      let userId: string | null = null;

      // Handle user authentication
      socket.on("authenticate", async (sessionData: SessionData) => {
        try {
          await connectDB();

          if (sessionData?.user?.email) {
            const user = await User.findOne({ email: sessionData.user.email });
            if (user) {
              userId = user._id.toString();
              socket.join(`user:${user._id}`);

              // Check user's online status privacy setting
              const onlineStatusEnabled =
                user.settings?.privacy?.onlineStatus !== false;

              // Update user online status only if privacy setting allows
              await User.findByIdAndUpdate(user._id, {
                isOnline: onlineStatusEnabled,
              });

              // Notify other users about online status only if enabled
              if (onlineStatusEnabled) {
                socket.broadcast.emit("userOnline", user._id);
              }

              console.log(
                `User authenticated: ${user.email}, online status: ${onlineStatusEnabled}`
              );
            }
          }
        } catch (error) {
          console.error("Authentication error:", error);
        }
      });

      // Handle joining conversation rooms
      socket.on("joinConversation", (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
        console.log(`User joined conversation: ${conversationId}`);
      });

      // Handle leaving conversation rooms
      socket.on("leaveConversation", (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        console.log(`User left conversation: ${conversationId}`);
      });

      // Handle typing indicators
      socket.on(
        "typing",
        (data: { conversationId: string; isTyping: boolean }) => {
          socket.to(`conversation:${data.conversationId}`).emit("typing", {
            userId: userId,
            isTyping: data.isTyping,
          });
        }
      );

      // Handle new messages
      socket.on("sendMessage", (messageData: MessageData) => {
        console.log("Message received:", messageData);
        // Broadcast to all users in the conversation except sender
        socket
          .to(`conversation:${messageData.conversationId}`)
          .emit("newMessage", messageData);
      });

      // Handle disconnection
      socket.on("disconnect", async () => {
        console.log("Client disconnected:", socket.id);

        if (userId) {
          try {
            await connectDB();

            // Update user offline status
            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastSeen: new Date(),
            });

            // Notify other users about offline status
            socket.broadcast.emit("userOffline", userId);
          } catch (error) {
            console.error("Disconnect error:", error);
          }
        }
      });
    });
  }

  return io;
};

export async function GET() {
  try {
    initSocket();
    return new Response("Socket.io server initialized", { status: 200 });
  } catch (error) {
    console.error("Socket.io initialization error:", error);
    return new Response("Socket.io server error", { status: 500 });
  }
}

export { initSocket };
