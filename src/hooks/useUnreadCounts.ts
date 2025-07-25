import { useState, useCallback, useEffect } from "react";
import { authenticatedFetch } from "@/lib/fetch";

interface UnreadCounts {
  [conversationId: string]: number;
}

interface UseUnreadCountsReturn {
  unreadCounts: UnreadCounts;
  totalUnreadCount: number;
  fetchUnreadCounts: () => Promise<void>;
  markConversationAsRead: (conversationId: string) => void;
  incrementUnreadCount: (conversationId: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function useUnreadCounts(): UseUnreadCountsReturn {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authenticatedFetch("/api/messages/unread");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch unread counts");
      }

      const data = await response.json();
      setUnreadCounts(data.unreadCounts);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Error fetching unread counts:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markConversationAsRead = useCallback((conversationId: string) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [conversationId]: 0,
    }));
  }, []);

  const incrementUnreadCount = useCallback((conversationId: string) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || 0) + 1,
    }));
  }, []);

  const totalUnreadCount = Object.values(unreadCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  // Fetch unread counts on mount
  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  return {
    unreadCounts,
    totalUnreadCount,
    fetchUnreadCounts,
    markConversationAsRead,
    incrementUnreadCount,
    isLoading,
    error,
  };
}
