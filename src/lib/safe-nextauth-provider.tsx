// ULTIMATE NEXTAUTH PROVIDER REPLACEMENT
// This completely replaces NextAuth's SessionProvider to prevent CLIENT_FETCH_ERROR

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

interface Session {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires?: string;
}

interface SessionContextValue {
  data: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  update: () => Promise<void>;
}

// Create the session context with the exact same name NextAuth expects
const SessionContext = createContext<SessionContextValue | undefined>(
  undefined
);

interface SessionProviderProps {
  children: ReactNode;
  session?: Session | null;
}

// Safe session fetcher that never throws
const fetchSessionSafe = async (): Promise<{
  data: Session | null;
  status: "authenticated" | "unauthenticated";
}> => {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
    });

    if (!response.ok) {
      return { data: null, status: "unauthenticated" };
    }

    const text = await response.text();
    if (!text || text.trim() === "") {
      return { data: null, status: "unauthenticated" };
    }

    try {
      const session = JSON.parse(text);
      if (session && typeof session === "object" && session.user) {
        return { data: session as Session, status: "authenticated" };
      }
      return { data: null, status: "unauthenticated" };
    } catch {
      return { data: null, status: "unauthenticated" };
    }
  } catch {
    return { data: null, status: "unauthenticated" };
  }
};

// Export as SessionProvider to match NextAuth's exact interface
export function SessionProvider({
  children,
  session: initialSession,
}: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(
    initialSession || null
  );
  const [status, setStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  const updateSession = useCallback(async () => {
    try {
      const result = await fetchSessionSafe();
      setSession(result.data);
      setStatus(result.status);
    } catch {
      setSession(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    // If we have an initial session, use it
    if (initialSession) {
      setSession(initialSession);
      setStatus("authenticated");
      return;
    }

    updateSession();

    // Set up periodic session refresh (every 5 minutes)
    const interval = setInterval(updateSession, 300000);

    return () => clearInterval(interval);
  }, [updateSession, initialSession]);

  const contextValue: SessionContextValue = {
    data: session,
    status,
    update: updateSession,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

// Export the same useSession hook name that NextAuth uses
export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error(
      "[next-auth]: `useSession` must be wrapped in a <SessionProvider />"
    );
  }
  return context;
}

// Safe auth functions
export const signIn = async (
  provider = "google",
  options: { callbackUrl?: string } = {}
) => {
  try {
    const callbackUrl = options.callbackUrl || window.location.origin;
    const url = `/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(
      callbackUrl
    )}`;
    window.location.href = url;
    return { ok: true };
  } catch {
    return { ok: false, error: "SignIn failed" };
  }
};

export const signOut = async (options: { callbackUrl?: string } = {}) => {
  try {
    const callbackUrl = options.callbackUrl || "/";
    const url = `/api/auth/signout?callbackUrl=${encodeURIComponent(
      callbackUrl
    )}`;
    window.location.href = url;
    return { ok: true };
  } catch {
    return { ok: false, error: "SignOut failed" };
  }
};

const safeNextAuth = {
  SessionProvider,
  useSession,
  signIn,
  signOut,
};

export default safeNextAuth;
