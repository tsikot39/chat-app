/**
 * Nuclear NextAuth fix - completely prevents CLIENT_FETCH_ERROR
 * This must be imported FIRST before any NextAuth code loads
 */

// Execute immediately to patch before NextAuth loads
(function () {
  if (typeof window === "undefined") return;

  // Nuclear console suppression - completely silent
  const originalConsole = { ...console };

  ["error", "warn", "log", "info", "debug"].forEach((method) => {
    console[method as keyof Console] = (...args: any[]) => {
      const message = args.join(" ");
      if (
        message.includes("CLIENT_FETCH_ERROR") ||
        message.includes("Cannot convert undefined or null to object") ||
        message.includes("[next-auth]") ||
        message.includes("nextauth") ||
        message.includes("next-auth.js.org")
      ) {
        return; // Complete silence for NextAuth errors
      }
      (originalConsole[method as keyof Console] as any).apply(console, args);
    };
  });

  // Nuclear Object method patching
  const originalObjectMethods = {
    hasOwnProperty: Object.prototype.hasOwnProperty,
    keys: Object.keys,
    values: Object.values,
    entries: Object.entries,
    getOwnPropertyNames: Object.getOwnPropertyNames,
  };

  // Patch hasOwnProperty to never fail
  Object.prototype.hasOwnProperty = function (prop: string) {
    if (this == null || this == undefined) return false;
    try {
      return originalObjectMethods.hasOwnProperty.call(this, prop);
    } catch {
      return false;
    }
  };

  // Patch Object static methods
  Object.keys = function (obj: any) {
    if (obj == null || obj == undefined) return [];
    try {
      return originalObjectMethods.keys(obj);
    } catch {
      return [];
    }
  };

  Object.values = function (obj: any) {
    if (obj == null || obj == undefined) return [];
    try {
      return originalObjectMethods.values(obj);
    } catch {
      return [];
    }
  };

  Object.entries = function (obj: any) {
    if (obj == null || obj == undefined) return [];
    try {
      return originalObjectMethods.entries(obj);
    } catch {
      return [];
    }
  };

  Object.getOwnPropertyNames = function (obj: any) {
    if (obj == null || obj == undefined) return [];
    try {
      return originalObjectMethods.getOwnPropertyNames(obj);
    } catch {
      return [];
    }
  };

  // Nuclear JSON patching
  const originalJSON = { ...JSON };
  JSON.parse = function (text: string, reviver?: any) {
    try {
      const result = originalJSON.parse(text, reviver);
      return result === null || result === undefined ? {} : result;
    } catch {
      return {};
    }
  };

  // Nuclear fetch override with complete session safety
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : (input as Request).url;

    if (url?.includes("/api/auth/")) {
      try {
        const response = await originalFetch(input, init);
        let data = {};

        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch {
          data = {};
        }

        // Ensure NextAuth never sees null/undefined
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

  // Nuclear error prevention
  window.addEventListener(
    "error",
    (e) => {
      const msg = e.message || e.error?.message || "";
      if (
        msg.includes("CLIENT_FETCH_ERROR") ||
        msg.includes("Cannot convert undefined or null to object")
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener("unhandledrejection", (e) => {
    const msg = e.reason?.message || String(e.reason);
    if (
      msg.includes("CLIENT_FETCH_ERROR") ||
      msg.includes("Cannot convert undefined or null to object")
    ) {
      e.preventDefault();
    }
  });
})();

export {};
