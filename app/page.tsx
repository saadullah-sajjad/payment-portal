import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link as LinkIcon, Shield, CreditCard, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="flex justify-center gap-2 mb-4">
              <Badge variant="outline" className="text-sm">Powered by Stripe</Badge>
              <Badge variant="secondary" className="text-sm">HMAC Protected</Badge>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Dubsea Payment Portal
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Generate secure payment links for your clients with HMAC signature protection
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/builder">
                <Button size="lg" className="gap-2 group">
                  <LinkIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  Build Payment Link
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="gap-2 group">
                  <Shield className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  Register Customer
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow border-primary/20">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Secure by Default</CardTitle>
                <CardDescription>
                  HMAC-SHA256 signature validation prevents URL tampering
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-primary/20">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Stripe Integration</CardTitle>
                <CardDescription>
                  Seamlessly fetch customer data from your Stripe account
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-primary/20">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Instant Links</CardTitle>
                <CardDescription>
                  Generate payment URLs in seconds and send to clients
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* How It Works */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">How It Works</CardTitle>
              <CardDescription className="text-base">
                A simple 5-step process to get your clients paid
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex gap-4 group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-md group-hover:scale-110 transition-transform">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1">Create Stripe Customer</h4>
                    <p className="text-sm text-muted-foreground">
                      Manually create a customer in your Stripe Dashboard
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-4 group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-md group-hover:scale-110 transition-transform">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1">Build Payment Link</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the URL builder to generate a secure payment link
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-4 group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-md group-hover:scale-110 transition-transform">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1">Send to Client</h4>
                    <p className="text-sm text-muted-foreground">
                      Copy and share the generated URL via email or messaging
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-4 group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-md group-hover:scale-110 transition-transform">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1">Client Opens Link</h4>
                    <p className="text-sm text-muted-foreground">
                      Client clicks the link and sees their payment details
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-4 group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-md group-hover:scale-110 transition-transform">
                    5
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1">Complete Payment</h4>
                    <p className="text-sm text-muted-foreground">
                      Client proceeds to secure Stripe checkout
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center pt-8">
            <Link href="/builder">
              <Button size="lg" variant="outline" className="gap-2">
                Get Started
                <LinkIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}