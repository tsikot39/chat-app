"use client";

// NUCLEAR FIX: Import this FIRST
import "@/lib/nextauth-complete-replacement.js";
import "@/lib/nextauth-nuclear.js";
import "@/lib/nextauth-client-override.js";
// Import the targeted fix immediately for this page
import "@/lib/nextauth-targeted-fix";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ChatPage from "@/components/chat/ChatPage";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";

export default function Chat() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect via useEffect
  }

  return (
    <AuthErrorBoundary>
      <ChatPage />
    </AuthErrorBoundary>
  );
}
