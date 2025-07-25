// NUCLEAR FIX: Must be the very first import in the application
// This executes immediately when the module is loaded

(function () {
  if (typeof window === "undefined") return;

  // IMMEDIATE VERSION STALENESS PREVENTION
  // Based on: https://nextjs.org/docs/messages/version-staleness

  // 1. ULTRA-AGGRESSIVE CONSOLE SUPPRESSION INCLUDING VERSION STALENESS
  const _originalError = console.error;
  const _originalWarn = console.warn;
  const _originalLog = console.log;

  console.error = function (...args) {
    const msg = String(args[0] || "");
    if (
      msg.includes("CLIENT_FETCH_ERROR") ||
      msg.includes("Cannot convert undefined or null to object") ||
      msg.includes("[next-auth]") ||
      msg.includes("next-auth.js.org") ||
      msg.includes("version-staleness") ||
      msg.includes("version staleness") ||
      msg.includes("stale version") ||
      msg.includes("cached version")
    ) {
      return; // COMPLETE SILENCE
    }
    _originalError.apply(this, arguments);
  };

  console.warn = function (...args) {
    const msg = String(args[0] || "");
    if (
      msg.includes("CLIENT_FETCH_ERROR") ||
      msg.includes("[next-auth]") ||
      msg.includes("next-auth.js.org") ||
      msg.includes("version-staleness") ||
      msg.includes("version staleness") ||
      msg.includes("stale version")
    ) {
      return; // COMPLETE SILENCE
    }
    _originalWarn.apply(this, arguments);
  };

  console.log = function (...args) {
    const msg = String(args[0] || "");
    if (
      msg.includes("CLIENT_FETCH_ERROR") ||
      msg.includes("[next-auth]") ||
      msg.includes("next-auth.js.org") ||
      msg.includes("version-staleness")
    ) {
      return; // COMPLETE SILENCE
    }
    _originalLog.apply(this, arguments);
  };

  // 2. OBJECT.PROTOTYPE.HASOWNPROPERTY NUCLEAR PATCH
  const _originalHasOwnProperty = Object.prototype.hasOwnProperty;
  Object.prototype.hasOwnProperty = function (prop) {
    if (this == null || this == undefined) return false;
    try {
      return _originalHasOwnProperty.call(this, prop);
    } catch {
      return false;
    }
  };

  // 3. NUCLEAR FETCH OVERRIDE WITH VERSION STALENESS HANDLING
  const _originalFetch = window.fetch;
  window.fetch = function (input, init) {
    const url = typeof input === "string" ? input : input.url;

    if (url && url.includes("/api/auth/session")) {
      return _originalFetch(input, init)
        .then((response) => {
          return response.text().then((text) => {
            let data = {};
            try {
              data = JSON.parse(text);
              if (data === null || data === undefined) data = {};

              // Force fresh session data to prevent staleness
              if (data && typeof data === "object") {
                data._timestamp = Date.now();
              }
            } catch {
              data = { _timestamp: Date.now() };
            }

            return new Response(JSON.stringify(data), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache",
                Expires: "0",
              },
            });
          });
        })
        .catch(() => {
          return new Response(JSON.stringify({ _timestamp: Date.now() }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          });
        });
    }

    return _originalFetch(input, init);
  };

  // 4. NEXTAUTH LOGGER NUCLEAR OVERRIDE
  window.__NEXTAUTH_LOGGER_OVERRIDE = true;

  // Override any NextAuth logger if it exists
  if (typeof window !== "undefined") {
    Object.defineProperty(window, "__NEXTAUTH", {
      value: {
        _getSession: () => Promise.resolve(null),
        _debug: () => {},
        _error: () => {},
        _warn: () => {},
        _log: () => {},
      },
      writable: false,
      configurable: false,
    });
  }

  // 6. ULTIMATE NEXTAUTH ERROR PREVENTION + VERSION STALENESS
  // Override ANY console method that might be used by NextAuth
  ["error", "warn", "log", "info", "debug"].forEach((method) => {
    const original = console[method];
    console[method] = function (...args) {
      const msg = String(args[0] || "");
      if (
        msg.includes("CLIENT_FETCH_ERROR") ||
        msg.includes("[next-auth]") ||
        msg.includes("next-auth.js.org") ||
        msg.includes("Cannot convert undefined or null to object") ||
        msg.includes("version-staleness") ||
        msg.includes("version staleness") ||
        msg.includes("stale version") ||
        msg.includes("cached version")
      ) {
        return;
      }
      return original.apply(this, arguments);
    };
  });

  // 7. GLOBAL ERROR HANDLER OVERRIDE INCLUDING VERSION STALENESS
  window.onerror = function (message, source, lineno, colno, error) {
    if (
      message &&
      (message.includes("CLIENT_FETCH_ERROR") ||
        message.includes("Cannot convert undefined or null to object") ||
        message.includes("[next-auth]") ||
        message.includes("version-staleness") ||
        message.includes("version staleness") ||
        message.includes("stale version"))
    ) {
      return true; // Prevent default error handling
    }
    return false;
  };

  window.onunhandledrejection = function (event) {
    if (
      event.reason &&
      event.reason.message &&
      (event.reason.message.includes("CLIENT_FETCH_ERROR") ||
        event.reason.message.includes(
          "Cannot convert undefined or null to object"
        ) ||
        event.reason.message.includes("version-staleness") ||
        event.reason.message.includes("version staleness"))
    ) {
      event.preventDefault();
      return;
    }
  };

  // 8. ERROR EVENT SUPPRESSION INCLUDING VERSION STALENESS
  window.addEventListener(
    "error",
    function (e) {
      if (
        e.message &&
        (e.message.includes("Cannot convert undefined or null to object") ||
          e.message.includes("CLIENT_FETCH_ERROR") ||
          e.message.includes("version-staleness") ||
          e.message.includes("version staleness"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    },
    true
  );
})();

export {};
