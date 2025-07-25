import { useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { authenticatedFetch } from "@/lib/fetch";

export function useUserStatus() {
  const { data: session } = useSession();

  const updateStatus = useCallback(
    async (isOnline: boolean) => {
      if (!session?.user?.email) return;

      try {
        await authenticatedFetch("/api/users/status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isOnline }),
        });
      } catch (error) {
        console.error("Error updating user status:", error);
      }
    },
    [session?.user?.email]
  );

  useEffect(() => {
    if (!session?.user?.email) return;

    // Set user as online when component mounts
    updateStatus(true);

    // Update status every 30 seconds to keep user active
    const interval = setInterval(() => {
      updateStatus(true);
    }, 30000);

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateStatus(true);
      } else {
        updateStatus(false);
      }
    };

    // Handle beforeunload to set user offline
    const handleBeforeUnload = () => {
      updateStatus(false);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Set user offline when component unmounts
      updateStatus(false);
    };
  }, [session?.user?.email, updateStatus]);

  return { updateStatus };
}
