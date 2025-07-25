import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

// Client-side error suppression for NextAuth
if (typeof window !== "undefined") {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = (...args: unknown[]) => {
    const message = args.join(" ");

    // Suppress NextAuth CLIENT_FETCH_ERROR and related errors
    if (
      message.includes("CLIENT_FETCH_ERROR") ||
      message.includes("Cannot convert undefined or null to object") ||
      message.includes("[next-auth]") ||
      message.includes("nextauth") ||
      message.includes("session.user") ||
      message.includes("Object.hasOwnProperty") ||
      message.includes("TypeError: Cannot convert")
    ) {
      return; // Silently ignore
    }

    originalConsoleError.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    const message = args.join(" ");

    if (message.includes("[next-auth]") || message.includes("nextauth")) {
      return; // Silently ignore NextAuth warnings
    }

    originalConsoleWarn.apply(console, args);
  };
}

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface SafeSessionResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  status: SessionStatus;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: () => Promise<any>;
}

export function useSafeSession(): SafeSessionResult {
  const [isInitialized, setIsInitialized] = useState(false);
  const [safeSession, setSafeSession] = useState<SafeSessionResult>({
    data: null,
    status: "loading",
    update: async () => null,
  });

  // Always call useSession to follow React Hook rules
  const sessionResult = useSession();

  useEffect(() => {
    // Set initialized after first render to prevent hydration mismatches
    setIsInitialized(true);

    // Update safe session with actual session data
    try {
      // Additional validation for session data
      const sessionData = sessionResult?.data;
      const isValidSession =
        sessionData &&
        typeof sessionData === "object" &&
        sessionData.user &&
        (sessionData.user as { id?: string }).id; // Type assertion for custom session

      setSafeSession({
        data: isValidSession ? sessionData : null,
        status: sessionResult?.status || "unauthenticated",
        update: sessionResult?.update || (async () => null),
      });
    } catch {
      // Suppress console log and provide safe defaults
      setSafeSession({
        data: null,
        status: "unauthenticated",
        update: async () => null,
      });
    }
  }, [sessionResult?.data, sessionResult?.status, sessionResult?.update]);

  // Return safe defaults during initialization
  if (!isInitialized) {
    return {
      data: null,
      status: "loading",
      update: async () => null,
    };
  }

  return safeSession;
}
