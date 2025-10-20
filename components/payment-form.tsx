'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PaymentFormProps {
  clientSecret: string;
  amount: string;
  currency?: string;
  customerEmail?: string;
}

export function PaymentForm({ clientSecret, amount }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Check if Stripe has loaded
  if (!stripe || !elements) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading payment form...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log('Stripe loaded:', { stripe: !!stripe, elements: !!elements, clientSecret });

  const formatAmount = (cents: string) => {
    const num = parseInt(cents);
    return `$${(num / 100).toFixed(2)}`;
  };

  // Debug: Log if clientSecret is missing
  if (!clientSecret) {
    console.error('Client secret is missing!');
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-destructive">Payment initialization failed. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Confirm payment with Stripe
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        setError(submitError.message || 'Payment failed');
        setLoading(false);
        return;
      }

      setProcessing(true);

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        setProcessing(false);
        setLoading(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded - create invoice
        try {
          const response = await fetch('/api/create-invoice', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            router.push(`/success?payment_intent=${paymentIntent.id}&invoice_id=${data.invoiceId}`);
          } else {
            // Still redirect even if invoice creation fails
            router.push(`/success?payment_intent=${paymentIntent.id}`);
          }
        } catch (err) {
          console.error('Error creating invoice:', err);
          // Still redirect even if invoice creation fails
          router.push(`/success?payment_intent=${paymentIntent.id}`);
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Information</CardTitle>
        <CardDescription>
          Enter your payment details to complete the transaction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Amount Display */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Amount:</span>
              <span className="text-2xl font-bold text-primary">
                {formatAmount(amount)}
              </span>
            </div>
          </div>

          {/* Stripe Payment Element */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Details</label>
            <div className="border rounded-md p-4 bg-background" style={{ minHeight: '200px' }}>
              <PaymentElement />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {processing && !error && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
              <Loader2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 animate-spin" />
              <p className="text-sm text-green-700 dark:text-green-400">
                Processing your payment...
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!stripe || loading || processing}
            className="w-full"
            size="lg"
          >
            {loading || processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Pay {formatAmount(amount)}
              </>
            )}
          </Button>

          {/* Security Notice */}
          <div className="flex items-start gap-2 pt-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Your payment is secured by Stripe. Your card details are encrypted and never stored on our servers.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
