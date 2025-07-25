// Simple Express + Socket.io server for real-time chat
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("send_message", async (data) => {
    // Simply broadcast the message (database saving is handled by client)
    console.log(
      `[send_message] from ${socket.id} to room: ${data.recipientId}`,
      data
    );

    // Broadcast message to recipient
    io.to(data.recipientId).emit("receive_message", data);
  });

  socket.on("typing", (data) => {
    // Broadcast typing indicator to recipient
    if (data.recipientId) {
      console.log(
        `[typing] from ${socket.id} to room: ${data.recipientId}`,
        data
      );
      io.to(data.recipientId).emit("typing", data);
    }
  });

  socket.on("conversation_deleted", (data) => {
    // Broadcast conversation deletion to all participants
    console.log(`[conversation_deleted] from ${socket.id}:`, data);

    // Notify all participants about the deleted conversation
    if (data.participantEmails && Array.isArray(data.participantEmails)) {
      data.participantEmails.forEach((email) => {
        io.to(email).emit("conversation_deleted", {
          conversationId: data.conversationId,
          deletedBy: data.deletedBy,
        });
      });
    }
  });

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`[join] Socket ${socket.id} joined room: ${userId}`);
    console.log(`[rooms]`, socket.rooms);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
