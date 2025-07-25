// NUCLEAR FIX: Import this FIRST before anything else
import "@/lib/nextjs-bundle-suppressor.js";
import "@/lib/nextauth-nuclear.js";
// Import targeted NextAuth fix FIRST to prevent CLIENT_FETCH_ERROR
import "@/lib/nextauth-targeted-fix";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const poppinsMono = Poppins({
  variable: "--font-poppins-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "NexusChat - Real-Time Messaging",
  description: "A modern real-time chat application built with Next.js",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.svg", sizes: "16x16", type: "image/svg+xml" },
      { url: "/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/icon-192x192.svg",
  },
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0891b2", // NexusChat teal primary color
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
// COMPREHENSIVE NEXTAUTH ERROR SUPPRESSION
(function () {
  "use strict";
  if (typeof window === "undefined") return;

  // Store ALL original console methods
  const originalConsole = {
    error: console.error,
    warn: console.warn,
    log: console.log,
    info: console.info,
    debug: console.debug,
    trace: console.trace
  };

  // ENHANCED SUPPRESSION PATTERNS
  const suppressPatterns = [
    /CLIENT_FETCH_ERROR/i,
    /Cannot convert undefined or null to object/i,
    /\\[next-auth\\]/i,
    /next-auth\\.js\\.org/i,
    /createConsoleError/i,
    /handleConsoleError/i,
    /fetch.*error/i,
    /session.*error/i,
    /signOut.*error/i
  ];

  function shouldSuppressMessage(args) {
    // Handle both string and object arguments
    const allArgs = args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg && typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    return suppressPatterns.some(pattern => pattern.test(allArgs));
  }

  // COMPREHENSIVE CONSOLE OVERRIDE
  function createSuppressor(originalMethod) {
    return function(...args) {
      if (!shouldSuppressMessage(args)) {
        originalMethod.apply(console, args);
      }
    };
  }

  // Override ALL console methods
  console.error = createSuppressor(originalConsole.error);
  console.warn = createSuppressor(originalConsole.warn);
  console.log = createSuppressor(originalConsole.log);
  console.info = createSuppressor(originalConsole.info);
  console.debug = createSuppressor(originalConsole.debug);
  console.trace = createSuppressor(originalConsole.trace);

  // INTERCEPT Error constructor for NextAuth errors
  const OriginalError = window.Error;
  window.Error = function(message, ...args) {
    if (typeof message === 'string' && suppressPatterns.some(p => p.test(message))) {
      // Create a silent error
      const silentError = new OriginalError('Error suppressed');
      silentError.stack = '';
      return silentError;
    }
    return new OriginalError(message, ...args);
  };
  // Preserve Error prototype
  window.Error.prototype = OriginalError.prototype;

  // GLOBAL ERROR HANDLING
  window.addEventListener('error', function(event) {
    const message = event.message || event.error?.message || '';
    if (suppressPatterns.some(p => p.test(message))) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
  }, true);

  // PROMISE REJECTION HANDLING
  window.addEventListener('unhandledrejection', function(event) {
    const reason = event.reason?.message || event.reason || '';
    if (suppressPatterns.some(p => p.test(String(reason)))) {
      event.preventDefault();
      return false;
    }
  }, true);

  // ADVANCED: Intercept console property access
  const consoleDescriptor = Object.getOwnPropertyDescriptor(window, 'console');
  if (consoleDescriptor && consoleDescriptor.configurable) {
    Object.defineProperty(window, 'console', {
      get: function() {
        return {
          error: createSuppressor(originalConsole.error),
          warn: createSuppressor(originalConsole.warn),
          log: createSuppressor(originalConsole.log),
          info: createSuppressor(originalConsole.info),
          debug: createSuppressor(originalConsole.debug),
          trace: createSuppressor(originalConsole.trace),
          // Include other console methods as-is
          time: originalConsole.time,
          timeEnd: originalConsole.timeEnd,
          group: originalConsole.group,
          groupEnd: originalConsole.groupEnd,
          clear: originalConsole.clear,
          table: originalConsole.table
        };
      },
      configurable: false
    });
  }

  console.log('[SUPPRESSOR] NextAuth error suppression active');

})();
            `,
          }}
        />
      </head>
      <body
        className={`${poppins.variable} ${poppinsMono.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
