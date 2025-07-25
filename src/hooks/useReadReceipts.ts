import { useState, useCallback } from "react";

interface ReadReceiptStatus {
  [messageId: string]: {
    isRead: boolean;
    readAt?: Date;
  };
}

interface UseReadReceiptsReturn {
  readStatus: ReadReceiptStatus;
  markAsRead: (conversationId: string, messageIds?: string[]) => Promise<void>;
  getReadStatus: (conversationId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useReadReceipts(): UseReadReceiptsReturn {
  const [readStatus, setReadStatus] = useState<ReadReceiptStatus>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getReadStatus = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/messages/read?conversationId=${encodeURIComponent(
          conversationId
        )}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get read status");
      }

      const data = await response.json();
      setReadStatus((prev) => ({
        ...prev,
        ...data.readStatus,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Error getting read status:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(
    async (conversationId: string, messageIds?: string[]) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/messages/read", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId,
            messageIds,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to mark messages as read");
        }

        const result = await response.json();

        if (result.success) {
          // Refresh read status after marking as read
          await getReadStatus(conversationId);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        console.error("Error marking messages as read:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [getReadStatus]
  );

  return {
    readStatus,
    markAsRead,
    getReadStatus,
    isLoading,
    error,
  };
}
