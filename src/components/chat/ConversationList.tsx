"use client";

import { useState, useEffect } from "react";
import { Conversation } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authenticatedFetch } from "@/lib/fetch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MessageSquare, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getUserAvatar } from "@/lib/avatar";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";
import { useSession } from "next-auth/react";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  currentUserId?: string;
  selectedConversation?: Conversation | null;
  onDeleteConversation?: (conversationId: string) => void;
}

export function ConversationList({
  onSelectConversation,
  currentUserId,
  selectedConversation,
  onDeleteConversation,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingConversationId, setDeletingConversationId] = useState<
    string | null
  >(null);
  const [conversationToDelete, setConversationToDelete] =
    useState<Conversation | null>(null);
  const { socket, broadcastConversationDeleted } = useSocket();
  const { data: session } = useSession();
  const {
    unreadCounts,
    markConversationAsRead,
    fetchUnreadCounts,
    incrementUnreadCount,
  } = useUnreadCounts();

  const handleSelectConversation = (conversation: Conversation) => {
    onSelectConversation(conversation);
    // Mark conversation as read when selected
    if (unreadCounts[conversation._id] > 0) {
      markConversationAsRead(conversation._id);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchUnreadCounts();

    // Refresh conversations periodically to update user status
    const interval = setInterval(() => {
      fetchConversations();
      fetchUnreadCounts();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [fetchUnreadCounts]);

  // Listen for conversation deletions via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleConversationDeleted = (data: {
      conversationId: string;
      deletedBy: string;
    }) => {
      console.log("Received conversation deletion:", data);

      // Remove from local state
      setConversations((prev) =>
        prev.filter((conv) => conv._id !== data.conversationId)
      );

      // Notify parent component
      if (onDeleteConversation) {
        onDeleteConversation(data.conversationId);
      }

      // Show notification to user (except the one who deleted it)
      if (data.deletedBy !== session?.user?.email) {
        toast.info("A conversation has been deleted by the other participant");
      }
    };

    socket.on("conversation_deleted", handleConversationDeleted);

    return () => {
      socket.off("conversation_deleted", handleConversationDeleted);
    };
  }, [socket, onDeleteConversation, session?.user?.email]);

  // Listen for new messages to update unread counts
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message: {
      _id: string;
      conversationId: string;
      sender: { _id: string };
      content: string;
    }) => {
      // Only increment unread count if message is not from current user
      // and not in the currently active conversation
      if (
        message.sender?._id !== currentUserId &&
        message.conversationId !== selectedConversation?._id
      ) {
        incrementUnreadCount(message.conversationId);
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, currentUserId, selectedConversation?._id, incrementUnreadCount]);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch("/api/conversations");
      const data = await response.json();

      if (response.ok) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p._id !== currentUserId);
  };

  const formatTime = (date: Date | string) => {
    try {
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

  const handleDeleteConversation = async (
    conversationId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent conversation selection when clicking delete

    // Find and set the conversation to delete for the modal
    const conversation = conversations.find(
      (conv) => conv._id === conversationId
    );
    if (conversation) {
      setConversationToDelete(conversation);
    }
  };

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete) return;

    setDeletingConversationId(conversationToDelete._id);

    try {
      const response = await authenticatedFetch(
        `/api/conversations?id=${conversationToDelete._id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Remove from local state
        setConversations((prev) =>
          prev.filter((conv) => conv._id !== conversationToDelete._id)
        );

        // Notify parent component
        if (onDeleteConversation) {
          onDeleteConversation(conversationToDelete._id);
        }

        // Broadcast deletion via Socket.io to notify other participants
        if (session?.user?.email) {
          const participantEmails = conversationToDelete.participants
            .map((p) => p.email)
            .filter((email) => email !== session.user?.email); // Exclude current user

          if (participantEmails.length > 0) {
            broadcastConversationDeleted(
              conversationToDelete._id,
              participantEmails,
              session.user.email
            );
          }
        }

        toast.success("Conversation deleted successfully");
      } else {
        const errorData = await response.json();
        console.error("Failed to delete conversation:", errorData);
        toast.error(errorData.error || "Failed to delete conversation");
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation. Please try again.");
    } finally {
      setDeletingConversationId(null);
      setConversationToDelete(null);
    }
  };

  return (
    <Card className="h-full rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No conversations yet. Start a new chat!
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              const isActive = selectedConversation?._id === conversation._id;
              const isDeleting = deletingConversationId === conversation._id;
              const unreadCount = unreadCounts[conversation._id] || 0;

              return (
                <div
                  key={conversation._id}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors group ${
                    isActive
                      ? "bg-primary/10 border-l-4 border-l-primary"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={getUserAvatar(otherParticipant?.image)}
                        alt={otherParticipant?.name}
                      />
                      <AvatarFallback className="text-xs font-medium">
                        {otherParticipant?.name?.slice(0, 8) || "Unknown"}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online status indicator */}
                    {otherParticipant?.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                    )}
                    {/* Unread count indicator */}
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center border-2 border-white shadow-lg z-10">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex flex-col">
                      <p className="font-medium truncate">
                        {otherParticipant?.name || "Unknown User"}
                      </p>
                      <div className="flex flex-col gap-1">
                        {conversation.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                        {conversation.lastMessageAt && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Delete button - only visible on hover */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive delete-conversation-btn"
                        onClick={(e) =>
                          handleDeleteConversation(conversation._id, e)
                        }
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this conversation?
                          This will permanently delete all messages for both
                          users and cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={confirmDeleteConversation}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Delete Conversation"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
