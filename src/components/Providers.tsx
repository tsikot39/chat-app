"use client";

import { ThemeProvider } from "./ThemeProvider";
import { AuthErrorBoundary } from "./AuthErrorBoundary";
import { SessionProvider } from "next-auth/react";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthErrorBoundary>
      <SessionProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="nexuschat-theme"
        >
          {children}
        </ThemeProvider>
      </SessionProvider>
    </AuthErrorBoundary>
  );
}
