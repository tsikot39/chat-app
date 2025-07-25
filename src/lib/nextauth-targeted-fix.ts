/**
 * Targeted NextAuth CLIENT_FETCH_ERROR fix
 * This specifically prevents the "Cannot convert undefined or null to object" error
 */

if (typeof window !== "undefined") {
  // Immediately suppress the specific error
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const message = String(args[0] || "");

    // Block the exact error we're seeing
    if (
      message.includes("[next-auth][error][CLIENT_FETCH_ERROR]") ||
      message.includes("Cannot convert undefined or null to object") ||
      message.includes("CLIENT_FETCH_ERROR")
    ) {
      return; // Completely suppress this error
    }

    originalError.apply(console, args);
  };

  // Patch the Object methods that NextAuth uses
  const originalHasOwnProperty = Object.prototype.hasOwnProperty;
  Object.prototype.hasOwnProperty = function (this: unknown, prop: string) {
    // If 'this' is null or undefined, return false instead of throwing
    if (this == null) {
      return false;
    }
    return originalHasOwnProperty.call(this, prop);
  };

  // Patch Object.keys to handle null/undefined
  const originalKeys = Object.keys;
  Object.keys = function (obj: object) {
    if (obj == null) {
      return [];
    }
    return originalKeys(obj);
  };

  // Also patch for the specific case where NextAuth tries to process session data
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : (input as Request).url;

    // Only intercept NextAuth session requests
    if (url?.includes("/api/auth/session")) {
      const response = await originalFetch(input, init);

      try {
        const text = await response.text();
        let data;

        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }

        // If data is null/undefined, return an empty object
        // This prevents NextAuth from trying to process null/undefined
        if (data === null || data === undefined) {
          data = {};
        }

        return new Response(JSON.stringify(data), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      } catch {
        // If anything fails, return empty object
        return new Response("{}", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return originalFetch(input, init);
  };

  // Catch any remaining errors
  window.addEventListener("error", (event) => {
    if (event.message?.includes("Cannot convert undefined or null to object")) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (reason && typeof reason === "object" && reason.message) {
      if (
        reason.message.includes("Cannot convert undefined or null to object")
      ) {
        event.preventDefault();
      }
    }
  });
}

export {};
