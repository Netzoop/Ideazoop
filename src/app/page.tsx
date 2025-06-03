"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Lightbulb, MessageSquare, CheckCircle, BarChart, Sparkles } from "lucide-react";

export default function Home() {
  const { isAuthenticated, signInWithGoogle, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  // Handle sign in with Google
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Ideazoop</span>
          </div>
          <Button onClick={handleSignIn} variant="outline">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-6 py-12 md:py-24 lg:py-32">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
          <Badge className="px-3 py-1 text-sm" variant="secondary">
            Idea-to-Product Platform
          </Badge>
          <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl">
            Turn your ideas into validated products
          </h1>
          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            Collaborate, validate, and track ideas from concept to approval with a
            streamlined workflow designed for innovation.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button onClick={handleSignIn} size="lg" className="gap-2">
            Get Started <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center mb-12">
          <h2 className="text-2xl font-bold leading-tight tracking-tighter md:text-3xl lg:text-4xl">
            Key Features
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-lg">
            Everything you need to manage the innovation process from idea to approval
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <Lightbulb className="h-6 w-6 text-primary mb-2" />
              <CardTitle>Idea Workflow</CardTitle>
              <CardDescription>
                Draft → Submitted → Approved/Rejected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Structured process ensures ideas are properly reviewed and tracked
                through each stage of development.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-6 w-6 text-primary mb-2" />
              <CardTitle>Real-time Collaboration</CardTitle>
              <CardDescription>
                Comments and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Provide feedback, ask questions, and stay updated with real-time
                comments and notifications.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="h-6 w-6 text-primary mb-2" />
              <CardTitle>Admin Review</CardTitle>
              <CardDescription>
                Structured approval process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Admins can review submitted ideas, provide feedback, and make
                approval decisions with mandatory comments.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart className="h-6 w-6 text-primary mb-2" />
              <CardTitle>Dashboard Analytics</CardTitle>
              <CardDescription>
                Track idea status and metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Visualize idea progress with status counters, filters, and
                performance metrics.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Sparkles className="h-6 w-6 text-primary mb-2" />
              <CardTitle>AI Assistance</CardTitle>
              <CardDescription>
                Improve descriptions and generate tags
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Enhance your idea descriptions and automatically generate
                relevant tags with AI-powered assistance.
              </p>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between">
            <CardHeader>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary mb-2"
              >
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m15 9-6 6" />
                <path d="m9 9 6 6" />
              </svg>
              <CardTitle>Google Sign-In</CardTitle>
              <CardDescription>
                Secure and convenient authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Sign in securely with your Google account for a seamless
                experience across devices.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-12 md:py-24 lg:py-32">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-6 text-center">
          <h2 className="text-2xl font-bold leading-tight tracking-tighter md:text-3xl lg:text-4xl">
            Ready to start innovating?
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-lg">
            Join Ideazoop today and transform how your organization manages ideas.
          </p>
          <Button onClick={handleSignIn} size="lg" className="gap-2">
            Sign in with Google <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 md:py-8">
        <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">Ideazoop</span>
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Netzoop. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
