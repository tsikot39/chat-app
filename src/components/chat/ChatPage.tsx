"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Conversation } from "@/types";
import { UserList } from "@/components/chat/UserList";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { authenticatedFetch } from "@/lib/fetch";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  Settings,
  User as UserIcon,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getCurrentUserAvatar } from "@/lib/avatar";
import { useUserStatus } from "@/hooks/useUserStatus";

export default function ChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "conversations">(
    "conversations"
  );
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(
    undefined
  );

  // Initialize user status tracking
  useUserStatus();

  // Cleanup inactive users periodically
  useEffect(() => {
    const cleanupInterval = setInterval(async () => {
      try {
        await fetch("/api/users/cleanup");
      } catch (error) {
        console.error("Error during user cleanup:", error);
      }
    }, 60000); // Run every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  // Cleanup old messages based on user's message history setting
  useEffect(() => {
    const messageCleanupInterval = setInterval(async () => {
      try {
        await fetch("/api/messages/cleanup", { method: "POST" });
      } catch (error) {
        console.error("Error during message cleanup:", error);
      }
    }, 3600000); // Run every hour (3600000ms)

    // Also run cleanup on initial load
    const initialCleanup = async () => {
      try {
        await fetch("/api/messages/cleanup", { method: "POST" });
      } catch (error) {
        console.error("Error during initial message cleanup:", error);
      }
    };

    initialCleanup();

    return () => clearInterval(messageCleanupInterval);
  }, []);

  // Get current user ID from session/database
  useEffect(() => {
    const getCurrentUserId = async () => {
      if (session?.user?.email) {
        try {
          const response = await authenticatedFetch(`/api/users/current`);
          if (response.ok) {
            const data = await response.json();
            setCurrentUserId(data.user._id);
          }
        } catch (error) {
          console.error("Error fetching current user:", error);
        }
      }
    };

    getCurrentUserId();
  }, [session?.user?.email]);

  const handleSelectUser = async (user: User) => {
    try {
      // Create or find existing conversation
      const response = await authenticatedFetch("/api/conversations", {
        method: "POST",
        body: JSON.stringify({
          participants: [user._id],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSelectedConversation(data.conversation);
        setActiveTab("conversations");
      } else {
        console.error("Conversation creation failed:", data);
        toast.error(data.error || "Failed to create conversation");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create conversation. Please try again.");
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  const handleDeleteConversation = (conversationId: string) => {
    // If the deleted conversation is currently selected, clear the selection
    if (selectedConversation?._id === conversationId) {
      setSelectedConversation(null);
    }
  };

  const handleSignOut = async () => {
    try {
      // Set user offline before signing out
      if (session?.user?.email) {
        try {
          await authenticatedFetch("/api/auth/signout-cleanup", {
            method: "POST",
            body: JSON.stringify({ email: session.user.email }),
          });
        } catch (error) {
          console.error("Error updating offline status:", error);
          // Continue with sign out even if this fails
        }
      }

      // Clear any local storage or state before signing out
      localStorage.removeItem("nexuschat-settings");

      await signOut({
        redirect: false,
      });

      // Manually redirect to landing page
      window.location.href = "/";

      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      // Even if there's an error, try to redirect to landing page
      window.location.href = "/";
      toast.error("Signed out with issues");
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please sign in to access the chat</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">NexusChat</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={
                      getCurrentUserAvatar() || session.user?.image || undefined
                    }
                    alt={session.user?.name || "User"}
                  />
                  <AvatarFallback>
                    {session.user?.name?.charAt(0) || (
                      <UserIcon className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center space-x-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={
                      getCurrentUserAvatar() || session.user?.image || undefined
                    }
                    alt={session.user?.name || "User"}
                  />
                  <AvatarFallback>
                    {session.user?.name?.charAt(0) || (
                      <UserIcon className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session.user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session.user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex pt-[73px]">
        {/* Sidebar */}
        <div className="w-80 border-r bg-background fixed left-0 top-[73px] h-[calc(100vh-73px)] flex flex-col">
          <div className="p-4 border-b flex-shrink-0 h-[73px]">
            <div className="flex gap-2">
              <Button
                variant={activeTab === "conversations" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("conversations")}
                className={`enhanced-tab-btn ${
                  activeTab === "conversations" ? "active" : ""
                }`}
              >
                Conversations
              </Button>
              <Button
                variant={activeTab === "users" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("users")}
                className={`enhanced-tab-btn ${
                  activeTab === "users" ? "active" : ""
                }`}
              >
                Users
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeTab === "conversations" ? (
              <ConversationList
                onSelectConversation={handleSelectConversation}
                currentUserId={currentUserId}
                selectedConversation={selectedConversation}
                onDeleteConversation={handleDeleteConversation}
              />
            ) : (
              <UserList onSelectUser={handleSelectUser} />
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-80 h-[calc(100vh-73px)]">
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              onBack={handleBack}
              currentUserId={currentUserId}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">NexusChat</h2>
                <p>Select a conversation or start a new chat</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
