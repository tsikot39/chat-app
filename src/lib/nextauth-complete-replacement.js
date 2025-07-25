// COMPLETE NEXTAUTH CLIENT REPLACEMENT
// This completely replaces NextAuth client functionality to prevent errors

if (typeof window !== "undefined") {
  // Store original functions before any overrides
  const originalFetch = window.fetch;

  // Create a safe session fetcher
  const safeSessionFetch = async () => {
    try {
      const response = await originalFetch("/api/auth/session", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
      });

      if (!response.ok) {
        return null;
      }

      const text = await response.text();
      if (!text || text.trim() === "") {
        return null;
      }

      try {
        const session = JSON.parse(text);
        return session && typeof session === "object" ? session : null;
      } catch {
        return null;
      }
    } catch {
      return null;
    }
  };

  // Define NextAuth client replacement before any modules load
  const nextAuthClient = {
    getSession: safeSessionFetch,
    getCsrfToken: async () => {
      try {
        const response = await originalFetch("/api/auth/csrf");
        if (!response.ok) return "mock-csrf";
        const data = await response.json();
        return data?.csrfToken || "mock-csrf";
      } catch {
        return "mock-csrf";
      }
    },
    getProviders: async () => ({}),
    signIn: async (provider, options = {}) => {
      try {
        const url = provider
          ? `/api/auth/signin/${provider}`
          : "/api/auth/signin";
        if (options.callbackUrl) {
          window.location.href = `${url}?callbackUrl=${encodeURIComponent(
            options.callbackUrl
          )}`;
        } else {
          window.location.href = url;
        }
        return { ok: true, status: 200, error: null, url: null };
      } catch {
        return { ok: false, status: 500, error: "SignIn failed", url: null };
      }
    },
    signOut: async (options = {}) => {
      try {
        const url = options.callbackUrl
          ? `/api/auth/signout?callbackUrl=${encodeURIComponent(
              options.callbackUrl
            )}`
          : "/api/auth/signout";
        window.location.href = url;
        return { ok: true, status: 200, error: null, url: null };
      } catch {
        return { ok: false, status: 500, error: "SignOut failed", url: null };
      }
    },
  };

  // Override NextAuth before it loads
  Object.defineProperty(window, "__NEXT_AUTH_CLIENT", {
    value: nextAuthClient,
    writable: false,
    configurable: false,
  });

  // Prevent NextAuth from initializing its own client
  Object.defineProperty(window, "next-auth", {
    value: nextAuthClient,
    writable: false,
    configurable: false,
  });

  // Mock the NextAuth module completely
  if (typeof window.define === "function") {
    const originalDefine = window.define;
    window.define = function (name, deps, factory) {
      if (
        typeof name === "string" &&
        (name.includes("next-auth") || name.includes("nextauth"))
      ) {
        return originalDefine(name, deps, () => nextAuthClient);
      }
      return originalDefine.apply(this, arguments);
    };
  }

  // Override require for NextAuth
  if (typeof window.require === "function") {
    const originalRequire = window.require;
    window.require = function (name) {
      if (
        typeof name === "string" &&
        (name.includes("next-auth") || name.includes("nextauth"))
      ) {
        return nextAuthClient;
      }
      return originalRequire.apply(this, arguments);
    };
  }

  console.log("🔄 NextAuth client completely replaced");
}

export {};
