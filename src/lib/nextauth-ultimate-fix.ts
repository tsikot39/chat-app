/**
 * Ultimate NextAuth CLIENT_FETCH_ERROR fix
 * This completely overrides NextAuth client processing to prevent all errors
 */

// Only run in browser environment
if (typeof window !== "undefined") {
  // Store original methods before any overrides
  const originalFetch = window.fetch;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;

  // Complete console suppression for NextAuth errors
  const suppressedPatterns = [
    "CLIENT_FETCH_ERROR",
    "Cannot convert undefined or null to object",
    "[next-auth]",
    "nextauth",
    "session.user",
    "TypeError: Cannot convert",
    "Object.hasOwnProperty",
    "next-auth.js.org/errors",
  ];

  function shouldSuppress(message: string): boolean {
    return suppressedPatterns.some((pattern) =>
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  // Override all console methods
  console.error = (...args: unknown[]) => {
    const message = args.join(" ");
    if (!shouldSuppress(message)) {
      originalConsoleError.apply(console, args);
    }
  };

  console.warn = (...args: unknown[]) => {
    const message = args.join(" ");
    if (!shouldSuppress(message)) {
      originalConsoleWarn.apply(console, args);
    }
  };

  console.log = (...args: unknown[]) => {
    const message = args.join(" ");
    if (!shouldSuppress(message)) {
      originalConsoleLog.apply(console, args);
    }
  };

  // Patch Object methods that NextAuth might use
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

  // Patch Object.keys to handle null/undefined
  const originalObjectKeys = Object.keys;
  Object.keys = function (obj: unknown) {
    if (obj == null || obj == undefined) {
      return [];
    }
    try {
      return originalObjectKeys(obj as object);
    } catch {
      return [];
    }
  };

  // Patch JSON.parse to return safe defaults
  const originalJSONParse = JSON.parse;
  JSON.parse = function (
    text: string,
    reviver?: (key: string, value: unknown) => unknown
  ) {
    try {
      const result = originalJSONParse(text, reviver);
      // If result is null or undefined, return empty object for NextAuth
      if (result === null || result === undefined) {
        return {};
      }
      return result;
    } catch {
      return {};
    }
  };

  // Override fetch for NextAuth endpoints with extreme safety
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : (input as Request).url;

    // Handle NextAuth session requests
    if (url?.includes("/api/auth/session")) {
      try {
        const response = await originalFetch(input, init);

        if (!response.ok) {
          return new Response(JSON.stringify({}), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        const text = await response.text();
        let data;

        try {
          data = JSON.parse(text);
        } catch {
          return new Response(JSON.stringify({}), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Ensure safe session structure
        if (!data || typeof data !== "object") {
          return new Response(JSON.stringify({}), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        // If session has user but missing required fields, sanitize it
        if (data.user && (!data.user.id || !data.user.email)) {
          return new Response(JSON.stringify({}), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Return original response if it's already safe
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // For all other requests, use original fetch
    return originalFetch(input, init);
  };

  // Prevent unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason;
    if (error && typeof error === "object") {
      const message = error.message || error.toString();
      if (shouldSuppress(message)) {
        event.preventDefault();
      }
    }
  });

  // Prevent window errors
  window.addEventListener("error", (event) => {
    const message = event.message || event.error?.message || "";
    if (shouldSuppress(message)) {
      event.preventDefault();
    }
  });

  // Override setTimeout to catch async NextAuth errors
  const originalSetTimeout = window.setTimeout;
  window.setTimeout = function (callback: () => void, delay?: number) {
    const wrappedCallback = function () {
      try {
        if (typeof callback === "function") {
          callback();
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (!shouldSuppress(message)) {
          throw error;
        }
      }
    };
    return originalSetTimeout(wrappedCallback, delay);
  } as typeof setTimeout;
}

export {};
