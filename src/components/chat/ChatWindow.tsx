"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Message, Conversation, TypingIndicator, User } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { authenticatedFetch } from "@/lib/fetch";
import { useSocket } from "@/hooks/useSocket";
import { useSession } from "next-auth/react";
import { getUserAvatar } from "@/lib/avatar";
import { playMessageSound } from "@/lib/sounds";
import { showMessageNotification } from "@/lib/notifications";
import { ReadReceipt } from "./ReadReceipt";
import { useReadReceipts } from "@/hooks/useReadReceipts";
import { useUserSettings } from "@/hooks/useUserSettings";

interface ChatWindowProps {
  conversation: Conversation;
  onBack: () => void;
  currentUserId?: string;
}

export function ChatWindow({
  conversation,
  onBack,
  currentUserId,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherParticipantData, setOtherParticipantData] = useState<{
    _id: string;
    name: string;
    email: string;
    image?: string;
    isOnline: boolean;
    statusMessage?: string;
    lastSeen: Date;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: session } = useSession();
  const {
    sendMessage: socketSendMessage,
    joinConversation,
    leaveConversation,
    sendTyping,
    isConnected,
    socket,
  } = useSocket();

  const { readStatus, markAsRead, getReadStatus } = useReadReceipts();
  const { settings: userSettings } = useUserSettings();

  const fetchMessages = useCallback(async () => {
    try {
      const response = await authenticatedFetch(
        `/api/messages?conversationId=${conversation._id}`
      );
      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages);
      } else {
        console.error("Failed to fetch messages:", data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [conversation._id]);

  // Handle real-time Socket.io events
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (
      message: Partial<Message> & {
        conversationId: string;
        content: string;
        sender: User;
      }
    ) => {
      if (message.conversationId === conversation._id) {
        console.log("Received message via Socket.io:", {
          sender: message.sender,
        });

        // Ensure the message has the correct structure
        const formattedMessage: Message = {
          _id: message._id || "",
          conversationId: message.conversationId,
          content: message.content,
          sender: message.sender,
          messageType: message.messageType || "text",
          isRead: message.isRead || false,
          createdAt: message.createdAt
            ? typeof message.createdAt === "string"
              ? new Date(message.createdAt)
              : message.createdAt
            : new Date(),
          updatedAt: message.updatedAt
            ? typeof message.updatedAt === "string"
              ? new Date(message.updatedAt)
              : message.updatedAt
            : new Date(),
        };
        setMessages((prev) => [...prev, formattedMessage]);

        // Play notification sound for incoming messages
        playMessageSound().catch(console.error);

        // Show desktop notification for incoming messages
        if (message.sender && typeof message.sender === "object") {
          const senderName = message.sender.name || "Unknown User";
          const senderAvatar = getUserAvatar(message.sender.image);
          showMessageNotification(
            senderName,
            message.content,
            senderAvatar
          ).catch(console.error);
        }
      }
    };

    const handleTyping = (data: {
      userId: string;
      isTyping: boolean;
      conversationId: string;
    }) => {
      if (
        data.conversationId === conversation._id &&
        data.userId !== session?.user?.email
      ) {
        setTypingUsers((prev) => {
          const filtered = prev.filter((user) => user.userId !== data.userId);
          if (data.isTyping) {
            return [
              ...filtered,
              {
                userId: data.userId,
                isTyping: true,
                conversationId: data.conversationId,
              },
            ];
          }
          return filtered;
        });

        // Auto-remove typing indicator after 3 seconds
        if (data.isTyping) {
          setTimeout(() => {
            setTypingUsers((prev) =>
              prev.filter((user) => user.userId !== data.userId)
            );
          }, 3000);
        }
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("typing", handleTyping);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("typing", handleTyping);
    };
  }, [socket, conversation._id, session?.user?.email]);

  // Fetch other participant's data including status message
  useEffect(() => {
    const fetchOtherParticipantData = async () => {
      const otherParticipant = conversation.participants.find(
        (p) => p._id !== currentUserId
      );
      if (otherParticipant) {
        try {
          const response = await authenticatedFetch(
            `/api/users/${otherParticipant._id}`
          );
          if (response.ok) {
            const data = await response.json();
            setOtherParticipantData(data.user);
          } else {
            console.error("Failed to fetch participant data:", response.status);
          }
        } catch (error) {
          console.error("Error fetching participant data:", error);
        }
      }
    };

    fetchOtherParticipantData();
  }, [conversation.participants, currentUserId]);

  // Join conversation on mount
  // Fetch messages initially and join conversation
  useEffect(() => {
    setIsLoading(true);
    fetchMessages();

    // Load read status for the conversation
    getReadStatus(conversation._id);

    // Join the conversation for real-time updates
    if (isConnected) {
      joinConversation(conversation._id);
    }

    return () => {
      // Leave conversation when component unmounts or conversation changes
      if (isConnected) {
        leaveConversation(conversation._id);
      }
    };
  }, [
    conversation._id,
    fetchMessages,
    getReadStatus,
    isConnected,
    joinConversation,
    leaveConversation,
  ]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Mark unread messages as read when component is visible
  useEffect(() => {
    if (messages.length > 0 && currentUserId) {
      const unreadMessageIds = messages
        .filter(
          (message) =>
            message.sender?._id !== currentUserId && // Don't mark own messages
            !message.isRead // Only unread messages
        )
        .map((message) => message._id)
        .filter(Boolean);

      if (unreadMessageIds.length > 0) {
        markAsRead(conversation._id, unreadMessageIds);
      }
    }
  }, [messages, currentUserId, conversation._id, markAsRead]);

  const handleTyping = useCallback(() => {
    if (!isTyping && isConnected) {
      setIsTyping(true);
      // Find the other participant's email
      const otherParticipant = conversation.participants.find(
        (p) => p._id !== currentUserId
      );
      const recipientEmail = otherParticipant?.email || "";
      sendTyping(conversation._id, true, recipientEmail);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      const otherParticipant = conversation.participants.find(
        (p) => p._id !== currentUserId
      );
      const recipientEmail = otherParticipant?.email || "";
      sendTyping(conversation._id, false, recipientEmail);
    }, 1000);
  }, [
    conversation._id,
    isConnected,
    isTyping,
    sendTyping,
    conversation.participants,
    currentUserId,
  ]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);

    console.log("Sending message. Socket connected:", isConnected);
    console.log("Socket object:", socket);

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      sendTyping(conversation._id, false);
    }

    try {
      // Store the message content before clearing
      const messageContent = newMessage.trim();

      // Always save to database first (authenticated)
      console.log("Saving message to database");
      const response = await authenticatedFetch("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          conversationId: conversation._id,
          content: messageContent,
          messageType: "text",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to send message:", errorData);
        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await response.json();

      // Add message to local state immediately
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");

      // Then broadcast via Socket.io for real-time delivery
      if (isConnected && socket) {
        console.log("Broadcasting message via Socket.io");
        const otherParticipant = conversation.participants.find(
          (p) => p._id !== currentUserId
        );
        const recipientEmail = otherParticipant?.email || "";

        // Send the complete message data including database info
        console.log("Message data being sent via Socket.io:", {
          sender: data.message.sender,
        });
        socketSendMessage({
          conversationId: conversation._id,
          content: messageContent,
          recipientEmail,
          _id: data.message._id,
          createdAt: data.message.createdAt,
          sender: data.message.sender,
          messageType: "text",
          isRead: false,
          updatedAt: data.message.updatedAt,
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Show error to user
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getOtherParticipant = () => {
    return conversation.participants.find((p) => p._id !== currentUserId);
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatTime = (date: Date | string | undefined) => {
    try {
      if (!date) return "Unknown";
      const dateObj = typeof date === "string" ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return "Unknown";
      }
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Unknown";
    }
  };

  const otherParticipant = getOtherParticipant();

  return (
    <div className="h-full flex flex-col max-h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b bg-background">
        <div className="flex items-center gap-3 p-4 h-[73px]">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={getUserAvatar(otherParticipant?.image)}
                alt={otherParticipant?.name}
              />
              <AvatarFallback>
                {otherParticipant ? getInitials(otherParticipant.name) : "?"}
              </AvatarFallback>
            </Avatar>
            {(otherParticipantData?.isOnline ?? otherParticipant?.isOnline) && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
            )}
          </div>
          <div>
            <h3 className="font-medium">
              {otherParticipant?.name || "Unknown User"}
            </h3>
            {otherParticipantData?.statusMessage && (
              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                {otherParticipantData.statusMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Messages Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ScrollArea className="h-full p-4">
          {isLoading ? (
            <div className="text-center py-4">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isCurrentUser = message.sender?._id === currentUserId;

                return (
                  <div
                    key={message._id || `message-${index}`}
                    className={`flex gap-3 ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isCurrentUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={getUserAvatar(message.sender?.image)}
                          alt={message.sender?.name}
                        />
                        <AvatarFallback>
                          {getInitials(message.sender?.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-[70%] ${
                        isCurrentUser ? "text-right" : "text-left"
                      }`}
                    >
                      <div
                        className={`inline-block px-4 py-2 rounded-lg ${
                          isCurrentUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p
                          className={`${
                            userSettings?.chat?.fontSize === "small"
                              ? "text-sm"
                              : userSettings?.chat?.fontSize === "large"
                              ? "text-lg"
                              : "text-base"
                          }`}
                        >
                          {message.content}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-1 gap-2">
                        <p className="text-xs text-muted-foreground">
                          {formatTime(message.createdAt)}
                        </p>
                        {isCurrentUser && (
                          <ReadReceipt
                            isRead={
                              readStatus[message._id]?.isRead ||
                              message.isRead ||
                              false
                            }
                            isSent={true}
                            readAt={
                              readStatus[message._id]?.readAt || message.readAt
                            }
                            showReadReceipts={
                              userSettings?.privacy?.readReceipts !== false
                            }
                          />
                        )}
                      </div>
                    </div>

                    {isCurrentUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={getUserAvatar(message.sender?.image)}
                          alt={message.sender?.name}
                        />
                        <AvatarFallback>
                          {getInitials(message.sender?.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Typing indicators */}
          {typingUsers.length > 0 && (
            <div className="flex gap-3 justify-start">
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {typingUsers.length === 1
                    ? "Someone is typing..."
                    : `${typingUsers.length} people are typing...`}
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </div>

      {/* Fixed Footer */}
      <div className="flex-shrink-0 border-t bg-background p-4">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            className="flex-1"
            disabled={isSending}
          />
          <Button
            type="submit"
            size="sm"
            disabled={isSending || !newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
