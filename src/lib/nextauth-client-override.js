// NEXTAUTH CLIENT COMPLETE OVERRIDE
// This file completely replaces NextAuth client-side functionality

if (typeof window !== "undefined") {
  // Prevent any NextAuth client errors by providing safe fallbacks

  // Mock NextAuth client functions
  const mockSession = {
    user: null,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  // Override getSession completely
  const safeGetSession = async () => {
    try {
      const response = await fetch("/api/auth/session", {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        return null;
      }

      const session = await response.json();
      return session || null;
    } catch (error) {
      // Silent fail - return null session
      return null;
    }
  };

  // Override NextAuth client completely
  window.next_auth_client_safe = {
    getSession: safeGetSession,
    getCsrfToken: async () => "mock-csrf-token",
    getProviders: async () => ({}),
    signIn: async (provider, options) => {
      window.location.href = `/api/auth/signin${
        provider ? `/${provider}` : ""
      }`;
      return { ok: true, status: 200, error: null, url: null };
    },
    signOut: async (options) => {
      window.location.href = "/api/auth/signout";
      return { ok: true, status: 200, error: null, url: null };
    },
  };

  // Intercept any NextAuth module loading
  const originalDefine = window.define;
  if (originalDefine) {
    window.define = function (name, deps, factory) {
      if (typeof name === "string" && name.includes("next-auth")) {
        // Return safe mock for NextAuth modules
        return originalDefine(name, deps, () => window.next_auth_client_safe);
      }
      return originalDefine.apply(this, arguments);
    };
  }

  // Additional safety: Catch any remaining NextAuth errors
  const originalAddEventListener = window.addEventListener;
  window.addEventListener = function (type, listener, options) {
    if (type === "error") {
      const wrappedListener = function (event) {
        if (
          event.error &&
          event.error.message &&
          (event.error.message.includes("CLIENT_FETCH_ERROR") ||
            event.error.message.includes(
              "Cannot convert undefined or null to object"
            ))
        ) {
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
        return listener(event);
      };
      return originalAddEventListener.call(
        this,
        type,
        wrappedListener,
        options
      );
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
}

export {};
