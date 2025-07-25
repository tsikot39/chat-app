// NEXTAUTH HOOK REPLACEMENT
// This file replaces NextAuth hooks to prevent CLIENT_FETCH_ERROR

import { useState, useEffect, useCallback } from "react";

// Safe session fetcher that never throws errors
const fetchSession = async () => {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
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
        return { data: session, status: "authenticated" };
      }
      return { data: null, status: "unauthenticated" };
    } catch {
      return { data: null, status: "unauthenticated" };
    }
  } catch {
    return { data: null, status: "unauthenticated" };
  }
};

// Custom useSession hook that replaces NextAuth's version
export const useSafeSession = () => {
  const [session, setSession] = useState({ data: null, status: "loading" });

  const updateSession = useCallback(async () => {
    try {
      const result = await fetchSession();
      setSession(result);
    } catch {
      setSession({ data: null, status: "unauthenticated" });
    }
  }, []);

  useEffect(() => {
    updateSession();

    // Set up periodic session refresh
    const interval = setInterval(updateSession, 60000); // Every minute

    return () => clearInterval(interval);
  }, [updateSession]);

  return session;
};

// Export safe auth functions
export const safeSignIn = async (
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

export const safeSignOut = async (options: { callbackUrl?: string } = {}) => {
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

const safeAuthModule = {
  useSafeSession,
  safeSignIn,
  safeSignOut,
};

export default safeAuthModule;
