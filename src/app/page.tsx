"use client";

// NUCLEAR FIX: Import this FIRST
import "@/lib/nextauth-complete-replacement.js";
import "@/lib/nextauth-nuclear.js";
import "@/lib/nextauth-client-override.js";
// Import the targeted fix immediately for this page
import "@/lib/nextauth-targeted-fix";

import LandingPage from "@/components/LandingPage";

export default function Home() {
  // Always show the landing page first
  // Users can navigate to the chat app from there
  return <LandingPage />;
}
