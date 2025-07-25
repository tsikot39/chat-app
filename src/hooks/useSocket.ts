import { useEffect, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const userEmail = session?.user?.email;
    if (!userEmail) return;

    // Dynamically import socket.io-client to avoid SSR issues
    let socketInstance: Socket | null = null;
    import("socket.io-client").then(({ io }) => {
      socketInstance = io("http://localhost:4000", {
        transports: ["polling", "websocket"],
        autoConnect: true,
      });

      setSocket(socketInstance);

      socketInstance.on("connect", () => {
        setIsConnected(true);
        // Join user room for direct messaging using email
        socketInstance?.emit("join", userEmail);
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
      });
    });

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [session?.user]);

  const sendMessage = useCallback(
    (message: {
      conversationId: string;
      content: string;
      recipientEmail: string;
      _id?: string;
      createdAt?: string | Date;
      updatedAt?: string | Date;
      messageType?: "text" | "image" | "file";
      isRead?: boolean;
      sender?: { _id: string; name?: string; email?: string; image?: string };
    }) => {
      if (socket && isConnected) {
        const payload = {
          ...message,
          recipientId: message.recipientEmail, // ensure recipientId matches room name
        };
        console.log("Sending message via Socket.io:", payload);
        socket.emit("send_message", payload);
        return true;
      }
      console.log("Socket.io not connected, using REST API fallback");
      return false;
    },
    [socket, isConnected]
  );

  const joinConversation = useCallback(
    (conversationId: string) => {
      if (socket && isConnected) {
        socket.emit("join", conversationId);
      }
    },
    [socket, isConnected]
  );

  const leaveConversation = useCallback(
    (conversationId: string) => {
      if (socket && isConnected) {
        socket.emit("leave", conversationId);
      }
    },
    [socket, isConnected]
  );

  const sendTyping = useCallback(
    (conversationId: string, isTyping: boolean, recipientEmail?: string) => {
      if (socket && isConnected && recipientEmail) {
        socket.emit("typing", {
          conversationId,
          isTyping,
          recipientId: recipientEmail,
        });
      }
    },
    [socket, isConnected]
  );

  const broadcastConversationDeleted = useCallback(
    (
      conversationId: string,
      participantEmails: string[],
      deletedBy: string
    ) => {
      if (socket && isConnected) {
        socket.emit("conversation_deleted", {
          conversationId,
          participantEmails,
          deletedBy,
        });
      }
    },
    [socket, isConnected]
  );

  return {
    socket,
    isConnected,
    sendMessage,
    joinConversation,
    leaveConversation,
    sendTyping,
    broadcastConversationDeleted,
  };
};
