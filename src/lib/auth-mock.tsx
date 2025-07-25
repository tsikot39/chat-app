"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
}

interface Session {
  user: User;
}

interface SessionContextType {
  data: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  update: () => void;
}

const SessionContext = createContext<SessionContextType>({
  data: null,
  status: "loading",
  update: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  const checkSession = () => {
    const storedUser = localStorage.getItem("nexuschat-user");
    const storedToken = localStorage.getItem("nexuschat-token");

    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        setSession({ user });
        setStatus("authenticated");
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("nexuschat-user");
        localStorage.removeItem("nexuschat-token");
        setSession(null);
        setStatus("unauthenticated");
      }
    } else {
      setSession(null);
      setStatus("unauthenticated");
    }
  };

  useEffect(() => {
    checkSession();

    // Listen for session updates
    const handleSessionUpdate = () => {
      checkSession();
    };

    window.addEventListener("session-update", handleSessionUpdate);

    return () => {
      window.removeEventListener("session-update", handleSessionUpdate);
    };
  }, []);

  return (
    <SessionContext.Provider
      value={{ data: session, status, update: checkSession }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

export async function signIn(
  provider: string,
  options?: { email?: string; password?: string; redirect?: boolean }
) {
  if (provider === "credentials" && options?.email && options?.password) {
    try {
      const response = await fetch("/api/auth/signin-custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: options.email,
          password: options.password,
        }),
      });

      const result = await response.json();

      if (response.ok && result.user && result.token) {
        localStorage.setItem("nexuschat-user", JSON.stringify(result.user));
        localStorage.setItem("nexuschat-token", result.token);

        // Trigger a custom event to notify all components
        window.dispatchEvent(new Event("session-update"));

        // Only redirect if redirect is not explicitly false
        if (options.redirect !== false) {
          // Use a small delay to ensure localStorage is written and context is updated
          setTimeout(() => {
            window.location.href = "/";
          }, 100);
        }

        return { ok: true };
      } else {
        return { error: result.error || "Authentication failed" };
      }
    } catch (error) {
      console.error("Sign in error:", error);
      return { error: "Network error" };
    }
  }

  return { error: "Invalid provider or missing credentials" };
}

export async function signOut(options?: { callbackUrl?: string }) {
  localStorage.removeItem("nexuschat-user");
  localStorage.removeItem("nexuschat-token");

  // Trigger a custom event to notify all components
  window.dispatchEvent(new Event("session-update"));

  if (options?.callbackUrl) {
    window.location.href = options.callbackUrl;
  } else {
    window.location.href = "/";
  }
}

// Export getSession for compatibility (deprecated but still used somewhere)
export async function getSession() {
  const storedUser = localStorage.getItem("nexuschat-user");
  const storedToken = localStorage.getItem("nexuschat-token");

  if (storedUser && storedToken) {
    try {
      const user = JSON.parse(storedUser);
      return { user };
    } catch (error) {
      console.error("Error parsing stored user:", error);
      return null;
    }
  }

  return null;
}
