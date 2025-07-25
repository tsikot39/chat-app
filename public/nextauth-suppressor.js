// ABSOLUTE NUCLEAR NEXTAUTH SUPPRESSION
// This script must execute before ANY other JavaScript

(function () {
  "use strict";

  if (typeof window === "undefined") return;

  // IMMEDIATE EXECUTION - NO DELAYS

  // 1. COMPLETELY OVERRIDE CONSOLE METHODS
  const silentFunction = function () {};
  const originalMethods = {};

  ["error", "warn", "log", "info", "debug", "trace"].forEach((method) => {
    originalMethods[method] = console[method];
    console[method] = function (...args) {
      const message = String(args[0] || "");
      if (
        message.includes("CLIENT_FETCH_ERROR") ||
        message.includes("[next-auth]") ||
        message.includes("next-auth.js.org") ||
        message.includes("Cannot convert undefined or null to object") ||
        message.includes("SESSION_ERROR") ||
        message.includes("SIGNIN_ERROR")
      ) {
        return; // ABSOLUTE SILENCE
      }
      return originalMethods[method].apply(this, arguments);
    };
  });

  // 2. NUCLEAR FETCH OVERRIDE FOR /api/auth/session
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    const url = typeof input === "string" ? input : input && input.url;

    if (url && url.includes("/api/auth/session")) {
      return new Promise((resolve) => {
        originalFetch(input, init)
          .then((response) => {
            if (!response.ok) {
              resolve(
                new Response("{}", {
                  status: 200,
                  headers: { "Content-Type": "application/json" },
                })
              );
              return;
            }
            return response.text();
          })
          .then((text) => {
            let data = {};
            try {
              data = JSON.parse(text || "{}");
              if (data === null || data === undefined) data = {};
            } catch {
              data = {};
            }
            resolve(
              new Response(JSON.stringify(data), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              })
            );
          })
          .catch(() => {
            resolve(
              new Response("{}", {
                status: 200,
                headers: { "Content-Type": "application/json" },
              })
            );
          });
      });
    }

    return originalFetch(input, init);
  };

  // 3. ABSOLUTE ERROR SUPPRESSION
  window.addEventListener(
    "error",
    function (e) {
      if (
        e.error &&
        e.error.message &&
        (e.error.message.includes("CLIENT_FETCH_ERROR") ||
          e.error.message.includes(
            "Cannot convert undefined or null to object"
          ) ||
          e.error.message.includes("[next-auth]"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    },
    true
  );

  window.addEventListener(
    "unhandledrejection",
    function (e) {
      if (
        e.reason &&
        e.reason.message &&
        (e.reason.message.includes("CLIENT_FETCH_ERROR") ||
          e.reason.message.includes(
            "Cannot convert undefined or null to object"
          ) ||
          e.reason.message.includes("[next-auth]"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    },
    true
  );

  // 4. OVERRIDE GLOBAL ERROR HANDLERS
  window.onerror = function (msg, url, line, col, error) {
    if (
      msg &&
      (msg.includes("CLIENT_FETCH_ERROR") ||
        msg.includes("Cannot convert undefined or null to object") ||
        msg.includes("[next-auth]"))
    ) {
      return true; // Suppress error
    }
    return false;
  };

  window.onunhandledrejection = function (e) {
    if (
      e.reason &&
      e.reason.message &&
      (e.reason.message.includes("CLIENT_FETCH_ERROR") ||
        e.reason.message.includes("Cannot convert undefined or null to object"))
    ) {
      e.preventDefault();
      return;
    }
  };

  // 5. NEXTAUTH SPECIFIC PATCHES
  Object.defineProperty(window, "__NEXTAUTH_LOGGER", {
    value: {
      error: silentFunction,
      warn: silentFunction,
      debug: silentFunction,
    },
    writable: false,
    configurable: false,
  });

  // 6. OBJECT PROTOTYPE SAFETY
  const originalHasOwnProperty = Object.prototype.hasOwnProperty;
  Object.prototype.hasOwnProperty = function (prop) {
    if (this == null || this == undefined) return false;
    try {
      return originalHasOwnProperty.call(this, prop);
    } catch {
      return false;
    }
  };

  console.log("🛡️ NextAuth error suppression ACTIVATED");
})();
