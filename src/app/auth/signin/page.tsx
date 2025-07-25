"use client";

import { useState, useEffect } from "react";
import { signIn, getProviders, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageCircle, Loader2, Chrome } from "lucide-react";
import { toast } from "sonner";

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<Record<string, unknown> | null>(
    null
  );
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/chat");
    }
  }, [session, status, router]);

  useEffect(() => {
    const loadProviders = async () => {
      const availableProviders = await getProviders();
      setProviders(availableProviders);
    };
    loadProviders();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);

      if (!providers?.google) {
        toast.error("Google sign-in is not configured");
        return;
      }

      const result = await signIn("google", {
        callbackUrl: "/chat",
      });

      if (result?.error) {
        console.error("Sign-in error:", result.error);
        toast.error("Failed to sign in with Google");
      }
    } catch (error) {
      console.error("Sign-in error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">
              Welcome to NexusChat
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Connect and chat with people around the world
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading || !providers?.google}
            className="w-full h-12 btn-outline google-signin-btn"
            variant="outline"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing in...
              </div>
            ) : (
              <div className="flex items-center">
                <Chrome className="w-5 h-5 mr-3" />
                Continue with Google
              </div>
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>Secure, fast, and easy authentication</p>
            <p>
              By signing in, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
