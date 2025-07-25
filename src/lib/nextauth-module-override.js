// COMPLETE NEXTAUTH MODULE OVERRIDE
// This completely replaces any NextAuth imports before they can cause errors

if (typeof window !== "undefined") {
  // Store our safe implementations
  const safeSessionFetch = async () => {
    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });

      if (!response.ok) return null;

      const text = await response.text();
      if (!text || text.trim() === "") return null;

      try {
        const session = JSON.parse(text);
        return session && typeof session === "object" && session.user
          ? session
          : null;
      } catch {
        return null;
      }
    } catch {
      return null;
    }
  };

  // Define NextAuth replacements
  const nextAuthReplacements = {
    useSession: () => ({
      data: null,
      status: "loading",
      update: async () => {},
    }),
    SessionProvider: ({ children }) => children,
    getSession: safeSessionFetch,
    signIn: async (provider = "google", options = {}) => {
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
        return { ok: true };
      } catch {
        return { ok: false, error: "SignIn failed" };
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
        return { ok: true };
      } catch {
        return { ok: false, error: "SignOut failed" };
      }
    },
  };

  // Override module loading systems

  // 1. AMD/RequireJS override
  if (typeof window.define === "function" && window.define.amd) {
    const originalDefine = window.define;
    window.define = function (name, deps, factory) {
      if (typeof name === "string" && name.includes("next-auth")) {
        return originalDefine(name, deps || [], () => nextAuthReplacements);
      }
      return originalDefine.apply(this, arguments);
    };
  }

  // 2. CommonJS override
  if (typeof window.require === "function") {
    const originalRequire = window.require;
    window.require = function (name) {
      if (typeof name === "string" && name.includes("next-auth")) {
        return nextAuthReplacements;
      }
      return originalRequire.apply(this, arguments);
    };
  }

  // 3. ES6 Module override (intercept import statements)
  const originalImport = window.__import__;
  if (originalImport) {
    window.__import__ = function (name) {
      if (typeof name === "string" && name.includes("next-auth")) {
        return Promise.resolve(nextAuthReplacements);
      }
      return originalImport.apply(this, arguments);
    };
  }

  // 4. Global NextAuth override
  Object.defineProperty(window, "NextAuth", {
    value: nextAuthReplacements,
    writable: false,
    configurable: false,
  });

  // 5. Prevent any NextAuth initialization
  window.__NEXTAUTH_DISABLED = true;

  console.log("🚫 NextAuth module loading completely overridden");
}

export {};
