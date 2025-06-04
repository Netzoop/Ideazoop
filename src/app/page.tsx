"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Lightbulb, MessageSquare, CheckCircle, BarChart, Sparkles, ChevronRight } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  // Handle sign in with Google, with fallback to email login
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      // If Google sign-in is successful, the auth callback route will handle redirection
    } catch (error) {
      console.error("Error signing in with Google:", error);
      // If Google sign-in fails, redirect to the email login page
      router.push("/login");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header - Modern floating header with blur effect */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">Ideazoop</span>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={handleSignIn} variant="outline" className="rounded-full">
              Sign In
            </Button>
            <Button onClick={handleSignIn} className="rounded-full">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - With gradient background and decorative elements */}
      <section className="relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="container relative z-10 py-20 md:py-28 lg:py-36">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6">
              <Badge className="w-fit px-4 py-1.5 text-sm font-medium rounded-full" variant="secondary">
                Idea-to-Product Platform
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                Turn your ideas into <span className="text-primary">validated products</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-[600px]">
                Collaborate, validate, and track ideas from concept to approval with a
                streamlined workflow designed for innovation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Button onClick={handleSignIn} size="lg" className="rounded-full gap-2 px-8 shadow-lg">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
                <Button onClick={handleSignIn} variant="outline" size="lg" className="rounded-full">
                  View Demo
                </Button>
              </div>
            </div>
            
            {/* Hero image/illustration */}
            <div className="relative aspect-square max-w-md mx-auto lg:max-w-none">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl -rotate-6 transform"></div>
              <div className="absolute inset-0 bg-card rounded-2xl shadow-xl"></div>
              <div className="relative h-full p-6 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="space-y-4">
                    <div className="h-24 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Lightbulb className="h-8 w-8 text-primary/70" />
                    </div>
                    <div className="h-40 bg-secondary/10 rounded-xl"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-40 bg-muted rounded-xl"></div>
                    <div className="h-24 bg-primary/5 rounded-xl"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary">1,200+</p>
              <p className="text-sm text-muted-foreground">Ideas Processed</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary">78%</p>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary">3 days</p>
              <p className="text-sm text-muted-foreground">Avg Review Time</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary">500+</p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Staggered grid layout */}
      <section className="py-24 lg:py-32">
        <div className="container">
          <div className="flex flex-col items-start gap-4 mb-12 max-w-[800px]">
            <Badge variant="outline" className="px-3 py-1 rounded-full">Features</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to manage innovation
            </h2>
            <p className="text-lg text-muted-foreground">
              Our platform provides all the tools necessary to streamline your idea management process
            </p>
          </div>

          {/* Staggered grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {/* Feature 1 */}
            <div className="group relative">
              <div className="absolute -inset-y-6 -inset-x-4 z-0 scale-95 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 transition group-hover:scale-100 group-hover:opacity-100 rounded-xl"></div>
              <div className="relative z-10">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-medium">Idea Workflow</h3>
                <p className="text-muted-foreground mb-4">
                  Structured process ensures ideas are properly reviewed and tracked
                  through each stage of development.
                </p>
                <div className="flex items-center text-sm text-primary font-medium">
                  <span>Learn more</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative">
              <div className="absolute -inset-y-6 -inset-x-4 z-0 scale-95 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 transition group-hover:scale-100 group-hover:opacity-100 rounded-xl"></div>
              <div className="relative z-10">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-medium">Real-time Collaboration</h3>
                <p className="text-muted-foreground mb-4">
                  Provide feedback, ask questions, and stay updated with real-time
                  comments and notifications.
                </p>
                <div className="flex items-center text-sm text-primary font-medium">
                  <span>Learn more</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative">
              <div className="absolute -inset-y-6 -inset-x-4 z-0 scale-95 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 transition group-hover:scale-100 group-hover:opacity-100 rounded-xl"></div>
              <div className="relative z-10">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-medium">Admin Review</h3>
                <p className="text-muted-foreground mb-4">
                  Admins can review submitted ideas, provide feedback, and make
                  approval decisions with mandatory comments.
                </p>
                <div className="flex items-center text-sm text-primary font-medium">
                  <span>Learn more</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative">
              <div className="absolute -inset-y-6 -inset-x-4 z-0 scale-95 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 transition group-hover:scale-100 group-hover:opacity-100 rounded-xl"></div>
              <div className="relative z-10">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-medium">Dashboard Analytics</h3>
                <p className="text-muted-foreground mb-4">
                  Visualize idea progress with status counters, filters, and
                  performance metrics.
                </p>
                <div className="flex items-center text-sm text-primary font-medium">
                  <span>Learn more</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group relative">
              <div className="absolute -inset-y-6 -inset-x-4 z-0 scale-95 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 transition group-hover:scale-100 group-hover:opacity-100 rounded-xl"></div>
              <div className="relative z-10">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-medium">AI Assistance</h3>
                <p className="text-muted-foreground mb-4">
                  Enhance your idea descriptions and automatically generate
                  relevant tags with AI-powered assistance.
                </p>
                <div className="flex items-center text-sm text-primary font-medium">
                  <span>Learn more</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group relative">
              <div className="absolute -inset-y-6 -inset-x-4 z-0 scale-95 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 transition group-hover:scale-100 group-hover:opacity-100 rounded-xl"></div>
              <div className="relative z-10">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-primary"
                  >
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m15 9-6 6" />
                    <path d="m9 9 6 6" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-medium">Google Sign-In</h3>
                <p className="text-muted-foreground mb-4">
                  Sign in securely with your Google account for a seamless
                  experience across devices.
                </p>
                <div className="flex items-center text-sm text-primary font-medium">
                  <span>Learn more</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="bg-muted/30 py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-background via-background to-muted/50"></div>
        
        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-4 px-3 py-1 rounded-full">Workflow</Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-6">
                Simple, effective idea management
              </h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-medium mb-2">Create Ideas</h3>
                    <p className="text-muted-foreground">
                      Submit and develop your innovative concepts with AI assistance
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-medium mb-2">Collaborate</h3>
                    <p className="text-muted-foreground">
                      Get feedback and iterate with your team in real-time
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-medium mb-2">Get Approved</h3>
                    <p className="text-muted-foreground">
                      Move forward with validated ideas through structured review
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sample Ideas Dashboard */}
            <div className="bg-card rounded-2xl shadow-xl overflow-hidden border">
              <div className="p-6 border-b">
                <h3 className="font-medium">Sample Ideas Dashboard</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-background rounded-xl p-4 border">
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant="success" className="px-2 py-0.5 text-xs">Approved</Badge>
                    <span className="text-xs text-muted-foreground">by John Doe</span>
                  </div>
                  <h4 className="font-medium mb-1">AI-Powered Personal Finance Assistant</h4>
                  <p className="text-sm text-muted-foreground mb-3">A mobile app that uses machine learning to analyze spending patterns and provide personalized budgeting advice.</p>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">AI</Badge>
                    <Badge variant="outline" className="text-xs">Finance</Badge>
                    <Badge variant="outline" className="text-xs">Mobile App</Badge>
                  </div>
                </div>
                
                <div className="bg-background rounded-xl p-4 border">
                  <div className="flex justify-between items-start mb-3">
                    <Badge className="px-2 py-0.5 text-xs">Submitted</Badge>
                    <span className="text-xs text-muted-foreground">by Jane Smith</span>
                  </div>
                  <h4 className="font-medium mb-1">Smart Home Energy Optimization</h4>
                  <p className="text-sm text-muted-foreground mb-3">An IoT-based system that learns household energy usage patterns and automatically adjusts heating, cooling, and lighting.</p>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">IoT</Badge>
                    <Badge variant="outline" className="text-xs">Energy</Badge>
                    <Badge variant="outline" className="text-xs">Smart Home</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"></div>
        
        <div className="container relative z-10">
          <div className="max-w-[800px] mx-auto text-center">
            <Badge className="mb-6 px-3 py-1 rounded-full" variant="secondary">
              Ready to Transform Your Ideas?
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-6">
              Join thousands of innovators bringing their ideas to life
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-[600px] mx-auto">
              Start turning your ideas into reality today with our comprehensive platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleSignIn} size="lg" className="rounded-full gap-2 px-8 shadow-lg">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
              <Button onClick={handleSignIn} variant="outline" size="lg" className="rounded-full">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-lg">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-bold tracking-tight">Ideazoop</span>
            </div>
            
            <div className="flex gap-8">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
            
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Netzoop. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
