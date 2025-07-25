"use client";

import React from "react";

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends React.Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    // Check if this is a NextAuth client fetch error - don't show error UI
    if (
      error.message?.includes("CLIENT_FETCH_ERROR") ||
      error.message?.includes("Cannot convert undefined or null to object") ||
      error.stack?.includes("next-auth")
    ) {
      console.warn("NextAuth error caught and suppressed:", error.message);
      return { hasError: false }; // Don't show error UI
    }

    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log NextAuth-specific errors but don't crash the app
    if (
      error.message?.includes("CLIENT_FETCH_ERROR") ||
      error.message?.includes("Cannot convert undefined or null to object")
    ) {
      console.warn("NextAuth client error caught and handled:", error.message);
      return;
    }

    // For other errors, log them normally
    console.error("AuthErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-2">Loading...</h2>
              <p className="text-gray-600">
                Please wait while we initialize your session.
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
