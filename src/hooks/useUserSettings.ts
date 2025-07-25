import { useState, useEffect, useCallback } from "react";
import { authenticatedFetch } from "@/lib/fetch";

interface UserSettings {
  notifications: {
    desktop: boolean;
    sound: boolean;
    messagePreview: boolean;
    newMessages: boolean;
    mentions: boolean;
  };
  privacy: {
    onlineStatus: boolean;
    readReceipts: boolean;
    whoCanMessage: string;
    typing: boolean;
  };
  chat: {
    enterToSend: boolean;
    fontSize: string;
    showTimestamps: boolean;
    messageHistory: number;
  };
}

interface UseUserSettingsReturn {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserSettings(): UseUserSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authenticatedFetch("/api/user/settings");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch settings");
      }

      const data = await response.json();
      setSettings(data.settings);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Error fetching user settings:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    refetch: fetchSettings,
  };
}
