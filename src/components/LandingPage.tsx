"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Users,
  Zap,
  Shield,
  Globe,
  Chrome,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Real-Time Messaging",
      description:
        "Instant message delivery with WebSocket technology for seamless communication.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "User Management",
      description:
        "Find and connect with other users effortlessly with smart search functionality.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure Authentication",
      description:
        "Google OAuth integration ensures your account is protected and easy to access.",
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Cross-Platform",
      description:
        "Works seamlessly across desktop and mobile devices with responsive design.",
    },
  ];

  const benefits = [
    "Lightning-fast real-time messaging",
    "One-on-one private conversations",
    "Typing indicators for better communication",
    "Message history with pagination",
    "Modern, intuitive interface",
    "Mobile-responsive design",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo and App Name */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200 cursor-pointer"
          >
            <MessageCircle className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">NexusChat</span>
          </button>

          {/* Right side - CTA button */}
          <div className="flex items-center gap-4">
            {session ? (
              <Link href="/chat">
                <Button className="gap-2 google-signin-btn">
                  <MessageCircle className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            ) : (
              <Link href="/auth/signin">
                <Button className="gap-2 google-signin-btn">
                  <Chrome className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Properly centered in viewport */}
      <section
        className="flex items-center justify-center"
        style={{ height: "calc(100vh - 64px)", marginTop: "64px" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Hero content */}
            <div className="text-left flex flex-col justify-center">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 max-w-3xl leading-tight">
                Real-Time Messaging, Redefined
              </h1>

              <p className="text-xl lg:text-2xl text-muted-foreground/90 mb-12 max-w-3xl font-medium leading-relaxed">
                Connect instantly with friends and colleagues through our
                modern, lightning-fast chat application built with Next.js and
                Socket.io
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                {session ? (
                  <Link href="/chat">
                    <Button
                      size="lg"
                      className="gap-2 text-lg px-8 py-3 google-signin-btn"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Go to Chat App
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/signin">
                    <Button
                      size="lg"
                      className="gap-2 text-lg px-8 py-3 google-signin-btn"
                    >
                      <Chrome className="h-5 w-5" />
                      Get Started with Google
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}

                <Badge variant="secondary" className="gap-2 px-4 py-2 w-fit">
                  <Sparkles className="h-4 w-4" />
                  Free to use
                </Badge>
              </div>
            </div>

            {/* Right side - Live Chat Preview */}
            <div className="relative flex flex-col justify-center">
              <Card className="p-6 shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <MessageCircle className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-semibold">
                      Live Chat Preview
                    </CardTitle>
                    <div className="ml-auto">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl max-w-[80%] shadow-md">
                      <p className="text-sm font-medium">
                        Hey! How&apos;s the new NexusChat app?
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-muted border border-border px-4 py-3 rounded-2xl max-w-[80%] shadow-sm">
                      <p className="text-sm text-black">
                        It&apos;s amazing! Real-time messaging works perfectly
                        ⚡
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl max-w-[80%] shadow-md">
                      <p className="text-sm font-medium">
                        The interface is so clean and modern! 🚀
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-muted/80 border border-border/50 px-4 py-3 rounded-2xl max-w-[80%] shadow-sm">
                      <p className="text-sm italic text-muted-foreground">
                        Someone is typing...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Why Choose NexusChat */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose NexusChat?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built with modern technologies to deliver the best messaging
            experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="text-center border-2 border-border bg-card/80 backdrop-blur-sm hover:bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 hover:scale-105 hover:-translate-y-2 transition-all duration-300 ease-out cursor-pointer group"
            >
              <CardHeader>
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-6">
              Everything You Need for Modern Communication
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              {session ? (
                <Link href="/chat">
                  <Button size="lg" className="gap-2 google-signin-btn">
                    <MessageCircle className="h-5 w-5" />
                    Enter Chat App
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button size="lg" className="gap-2 google-signin-btn">
                    <Chrome className="h-5 w-5" />
                    Start Chatting Now
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MessageCircle className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-primary">
              NexusChat
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with Next.js and Socket.io • Real-time messaging redefined
          </p>
        </div>
      </footer>
    </div>
  );
}
