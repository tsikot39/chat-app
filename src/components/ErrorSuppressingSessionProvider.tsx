"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect } from "react";

interface ErrorSuppressingSessionProviderProps {
  children: ReactNode;
  session?: unknown;
}

export default function ErrorSuppressingSessionProvider({
  children,
  session,
}: ErrorSuppressingSessionProviderProps) {
  useEffect(() => {
    // Catch any unhandled errors from NextAuth
    const handleError = (event: ErrorEvent) => {
      if (
        event.error?.message?.includes("CLIENT_FETCH_ERROR") ||
        event.error?.message?.includes(
          "Cannot convert undefined or null to object"
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason?.message || reason?.toString() || "";

      if (
        message.includes("CLIENT_FETCH_ERROR") ||
        message.includes("Cannot convert undefined or null to object")
      ) {
        event.preventDefault();
        return;
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  return (
    <SessionProvider
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session={session as any}
      refetchInterval={0}
      refetchOnWindowFocus={false}
      basePath="/api/auth"
    >
      {children}
    </SessionProvider>
  );
}
