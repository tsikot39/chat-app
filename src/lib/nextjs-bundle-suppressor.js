// NEXT.JS BUNDLE ERROR SUPPRESSOR - SAFE VERSION
// Targets errors coming from Next.js compiled chunks

(function () {
  "use strict";

  if (typeof window === "undefined") return;

  console.log(
    "[BUNDLE SUPPRESSOR] Initializing Next.js bundle error suppression"
  );

  // Store original functions before they get overridden by Next.js
  const _originalConsoleError = console.error;
  const _originalConsoleWarn = console.warn;
  const _originalConsoleLog = console.log;

  // Define suppression patterns for bundle errors
  const BUNDLE_ERROR_PATTERNS = [
    /CLIENT_FETCH_ERROR/i,
    /Cannot convert undefined or null to object/i,
    /next-auth.*error/i,
    /createConsoleError/i,
    /handleConsoleError/i,
    /\[next-auth\]/i,
    /next-auth\.js\.org/i,
  ];

  function shouldSuppressBundleError(args) {
    const combined = args
      .map((arg) => {
        if (typeof arg === "string") return arg;
        if (arg && typeof arg === "object") {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(" ");

    return BUNDLE_ERROR_PATTERNS.some((pattern) => pattern.test(combined));
  }

  // SAFE CONSOLE OVERRIDE
  function createSafeConsoleOverride(originalMethod) {
    return function (...args) {
      if (!shouldSuppressBundleError(args)) {
        return originalMethod.apply(this, args);
      }
      // Silently suppress NextAuth errors
    };
  }

  // Override console methods safely
  console.error = createSafeConsoleOverride(_originalConsoleError);
  console.warn = createSafeConsoleOverride(_originalConsoleWarn);
  console.log = createSafeConsoleOverride(_originalConsoleLog);

  // GLOBAL ERROR HANDLING
  window.addEventListener(
    "error",
    function (event) {
      const error = event.error;
      const message = error?.message || event.message || "";
      const filename = event.filename || "";

      // Check if this error is from Next.js bundles or NextAuth
      if (
        filename.includes("_next/static/chunks") ||
        shouldSuppressBundleError([message])
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    },
    true
  );

  // PROMISE REJECTION HANDLING
  window.addEventListener(
    "unhandledrejection",
    function (event) {
      const reason = event.reason?.message || event.reason || "";
      if (shouldSuppressBundleError([String(reason)])) {
        event.preventDefault();
        return false;
      }
    },
    true
  );

  console.log(
    "[BUNDLE SUPPRESSOR] Bundle error suppression active (safe mode)"
  );
})();
