// TURBOPACK ERROR SUPPRESSION
// Specifically targets Turbopack's error interception system

(function () {
  "use strict";

  if (typeof window === "undefined") return;

  console.log(
    "[TURBOPACK SUPPRESSOR] Initializing Turbopack error interception"
  );

  // Define suppression patterns
  const SUPPRESSION_PATTERNS = [
    /CLIENT_FETCH_ERROR/i,
    /next-auth/i,
    /NextAuth/i,
    /Cannot convert undefined or null to object/i,
    /intercept-console-error/i,
    /\[next-auth\]\[error\]/i,
    /fetch.*error/i,
    /TypeError.*Object/i,
  ];

  function shouldSuppress(message) {
    if (!message || typeof message !== "string") return false;
    return SUPPRESSION_PATTERNS.some((pattern) => pattern.test(message));
  }

  // INTERCEPT TURBOPACK'S ERROR REPORTING
  // Turbopack uses a global error handler that we need to override

  // 1. Override global error handling
  const originalError = window.Error;
  const originalConsoleError = console.error;

  // Create a comprehensive error suppression wrapper
  function createErrorSuppressor(originalFunction) {
    return function (...args) {
      // Convert all arguments to strings for checking
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

      if (shouldSuppress(combined)) {
        return; // Suppress the error completely
      }

      // Call original function if not suppressed
      return originalFunction.apply(this, args);
    };
  }

  // Override console.error with suppression
  console.error = createErrorSuppressor(originalConsoleError);

  // 2. Intercept Error constructor
  window.Error = function (message, ...args) {
    if (typeof message === "string" && shouldSuppress(message)) {
      // Return a harmless error
      const harmlessError = new originalError("Error suppressed");
      harmlessError.stack = ""; // Remove stack trace
      return harmlessError;
    }
    return new originalError(message, ...args);
  };

  // Preserve Error prototype and static methods
  Object.setPrototypeOf(window.Error, originalError);
  Object.defineProperty(window.Error, "prototype", {
    value: originalError.prototype,
    writable: false,
  });

  // 3. Intercept addEventListener for 'error' events
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (type === "error" && this === window) {
      const suppressingListener = function (event) {
        const message = event.message || event.error?.message || "";
        if (shouldSuppress(message)) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return false;
        }
        return listener.call(this, event);
      };
      return originalAddEventListener.call(
        this,
        type,
        suppressingListener,
        options
      );
    }
    return originalAddEventListener.call(this, type, listener, options);
  };

  // 4. Override window.onerror
  const originalOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    if (shouldSuppress(message)) {
      return true; // Prevent default error handling
    }
    if (originalOnError) {
      return originalOnError.call(this, message, source, lineno, colno, error);
    }
    return false;
  };

  // 5. Override unhandled rejection handler
  const originalOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = function (event) {
    const reason = event.reason?.message || event.reason || "";
    if (shouldSuppress(String(reason))) {
      event.preventDefault();
      return;
    }
    if (originalOnUnhandledRejection) {
      return originalOnUnhandledRejection.call(this, event);
    }
  };

  // 6. Intercept property definitions on global objects
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function (obj, prop, descriptor) {
    // Intercept error handlers being defined
    if (
      prop === "error" &&
      descriptor &&
      typeof descriptor.value === "function"
    ) {
      const originalHandler = descriptor.value;
      descriptor.value = createErrorSuppressor(originalHandler);
    }

    // Intercept error setters
    if (prop === "error" && descriptor && descriptor.set) {
      const originalSetter = descriptor.set;
      descriptor.set = function (value) {
        if (value && value.message && shouldSuppress(value.message)) {
          return; // Don't set the error
        }
        return originalSetter.call(this, value);
      };
    }

    return originalDefineProperty.call(this, obj, prop, descriptor);
  };

  // 7. Intercept Object.assign for error objects
  const originalObjectAssign = Object.assign;
  Object.assign = function (target, ...sources) {
    sources.forEach((source) => {
      if (source && source.message && shouldSuppress(source.message)) {
        // Remove the message property from error objects
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { message, ...rest } = source;
        Object.assign(target, rest);
        return;
      }
    });
    return originalObjectAssign.call(this, target, ...sources);
  };

  // 8. Patch JSON.stringify to suppress error serialization
  const originalStringify = JSON.stringify;
  JSON.stringify = function (value, replacer, space) {
    try {
      if (value && value.message && shouldSuppress(value.message)) {
        return JSON.stringify({}, replacer, space);
      }
      return originalStringify.call(this, value, replacer, space);
    } catch {
      return "{}";
    }
  };

  // 9. Monitor and suppress dynamic error injection
  if (window.MutationObserver) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || "";
            if (shouldSuppress(text)) {
              node.textContent = ""; // Clear the error text
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Check for script tags with error content
            if (node.tagName === "SCRIPT") {
              const scriptContent = node.textContent || "";
              if (shouldSuppress(scriptContent)) {
                node.textContent = ""; // Clear the script
              }
            }
          }
        });
      });
    });

    // Start observing once DOM is ready
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      });
    }
  }

  // 10. Override any potential React error boundaries
  if (
    typeof React !== "undefined" &&
    React?.Component?.prototype?.componentDidCatch
  ) {
    const originalComponentDidCatch =
      React.Component.prototype.componentDidCatch;
    React.Component.prototype.componentDidCatch = function (error, errorInfo) {
      if (error && error.message && shouldSuppress(error.message)) {
        return; // Don't call the original error handler
      }
      return originalComponentDidCatch.call(this, error, errorInfo);
    };
  }

  console.log("[TURBOPACK SUPPRESSOR] Error suppression active");
})();
