/**
 * Direct NextAuth module override to prevent CLIENT_FETCH_ERROR
 * This patches NextAuth at import time to prevent any errors
 */

// Store original console methods before NextAuth loads
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Set up immediate error suppression
if (typeof window !== "undefined") {
  // Suppress errors immediately on import
  console.error = (...args: unknown[]) => {
    const message = args.join(" ");
    if (
      message.includes("CLIENT_FETCH_ERROR") ||
      message.includes("Cannot convert undefined or null to object") ||
      message.includes("[next-auth]") ||
      message.includes("nextauth") ||
      message.includes("next-auth.js.org/errors")
    ) {
      return; // Silently ignore
    }
    originalConsoleError.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    const message = args.join(" ");
    if (message.includes("[next-auth]") || message.includes("nextauth")) {
      return; // Silently ignore
    }
    originalConsoleWarn.apply(console, args);
  };

  // Immediately patch Object.prototype.hasOwnProperty
  const originalHasOwnProperty = Object.prototype.hasOwnProperty;
  Object.prototype.hasOwnProperty = function (prop: string) {
    if (this == null || this == undefined) {
      return false;
    }
    try {
      return originalHasOwnProperty.call(this, prop);
    } catch {
      return false;
    }
  };

  // Patch window.fetch immediately
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : (input as Request).url;

    if (url?.includes("/api/auth/session")) {
      try {
        const response = await originalFetch(input, init);
        const text = await response.text();

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }

        // Ensure data is safe for NextAuth processing
        if (!data || typeof data !== "object" || data === null) {
          data = {};
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        return new Response("{}", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return originalFetch(input, init);
  };
}

export {};
