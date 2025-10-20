'use client';

import { useEffect, useState, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CreditCard, Banknote, Shield } from 'lucide-react';
import { validateSignature } from '@/lib/hmac';
import { useSearchParams } from 'next/navigation';
import { StripeProvider } from '@/components/stripe-provider';
import { PaymentForm } from '@/components/payment-form';


interface CustomerData {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  created: number;
  metadata: Record<string, string>;
}

interface PaymentParams {
  cid: string;
  amt: string;
  currency: string;
  sig: string;
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [paymentParams, setPaymentParams] = useState<PaymentParams | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [creatingPayment, setCreatingPayment] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        // Get URL parameters
        const cid = searchParams.get('cid');
        const amt = searchParams.get('amt');
        const currency = searchParams.get('currency');
        const sig = searchParams.get('sig');

        // Validate required parameters
        if (!cid || !amt || !currency || !sig) {
          setError('Missing required parameters in URL');
          setLoading(false);
          return;
        }

        const params: PaymentParams = { cid, amt, currency, sig };

        // Validate signature
        const isValidSignature = validateSignature(params);
        if (!isValidSignature) {
          setError('Invalid or tampered payment link. Please request a new link.');
          setLoading(false);
          return;
        }

        setPaymentParams(params);

        // Fetch customer details from API
        const response = await fetch(`/api/customer?cid=${cid}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load customer details');
          setLoading(false);
          return;
        }

        const customer = await response.json();
        setCustomerData(customer);
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [searchParams]);

  const handlePaymentMethodSelect = async (method: 'card' | 'bank') => {
    setPaymentMethod(method);
    
    if (!paymentParams || !customerData) return;

    setCreatingPayment(true);

    try {
      // Calculate amount with processing fee
      const { totalAmount, processingFee } = calculateWithFee(paymentParams.amt);
      
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: paymentParams.cid,
          amount: totalAmount,
          currency: paymentParams.currency,
          description: `Payment for ${customerData.email || customerData.name || 'customer'}`,
          metadata: {
            base_amount: paymentParams.amt,
            processing_fee: processingFee.toString(),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize payment');
      setPaymentMethod(null);
    } finally {
      setCreatingPayment(false);
    }
  };

  const formatAmount = (cents: string, currencyCode?: string) => {
    const num = parseInt(cents);
    const amount = (num / 100).toFixed(2);
    
    // Currency symbols mapping
    const currencySymbols: Record<string, string> = {
      usd: '$',
      eur: '€',
      gbp: '£',
      jpy: '¥',
      cad: 'CA$',
      aud: 'A$',
      chf: 'CHF',
      cny: '¥',
      inr: '₹',
      brl: 'R$',
      mxn: 'MX$',
      krw: '₩',
      sgd: 'S$',
      nzd: 'NZ$',
      sek: 'kr',
      nok: 'kr',
      dkk: 'kr',
      pln: 'zł',
      czk: 'Kč',
      huf: 'Ft',
      rub: '₽',
      try: '₺',
      zar: 'R',
      aed: 'د.إ',
      sar: '﷼',
      thb: '฿',
      myr: 'RM',
      php: '₱',
      idr: 'Rp',
      vnd: '₫',
      pkr: '₨',
    };
    
    const symbol = currencySymbols[currencyCode?.toLowerCase() || 'usd'] || currencyCode?.toUpperCase() || 'USD';
    return `${symbol}${amount}`;
  };

  const calculateWithFee = (amount: string) => {
    const baseAmount = parseInt(amount);
    const processingFee = Math.round(baseAmount * 0.03); // 3% fee
    const totalAmount = baseAmount + processingFee;
    return {
      baseAmount,
      processingFee,
      totalAmount: totalAmount.toString(),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading payment details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-500/50">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Payment Link Error</CardTitle>
            </div>
            <CardDescription>
              We couldn&apos;t process your payment link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Please contact support or request a new payment link from your service provider.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold tracking-tight">Complete Your Payment</h1>
          <p className="text-lg text-muted-foreground">
            Review your payment details and choose a payment method
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Payment Details */}
          <div className="space-y-6">
            {/* Customer Information Card */}
            <Card className="shadow-lg border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Details
                </CardTitle>
                <CardDescription>
                  Review the information before proceeding
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-6 pt-6">
                {/* Customer Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Customer Information</h3>
                  <div className="space-y-3 text-sm">
                    {customerData?.name && (
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{customerData.name}</span>
                      </div>
                    )}
                    {customerData?.email && (
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{customerData.email}</span>
                      </div>
                    )}
                    {customerData?.phone && (
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium">{customerData.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <span className="text-muted-foreground font-semibold">Amount:</span>
                    <span className="text-4xl font-bold text-primary">
                      {paymentParams && formatAmount(paymentParams.amt, paymentParams.currency)}
                    </span>
                  </div>
                  {paymentMethod === 'card' && (
                    <div className="flex justify-between items-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded-md">
                      <span className="text-muted-foreground text-sm">Processing Fee (3%):</span>
                      <span className="font-semibold text-orange-600">
                        +{paymentParams && formatAmount(calculateWithFee(paymentParams.amt).processingFee.toString(), paymentParams.currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Currency:</span>
                    <Badge variant="outline" className="uppercase">
                      {paymentParams?.currency}
                    </Badge>
                  </div>
                  {paymentMethod === 'card' && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <span className="text-muted-foreground font-semibold">Total to Pay:</span>
                        <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                          {paymentParams && formatAmount(calculateWithFee(paymentParams.amt).totalAmount, paymentParams.currency)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <Separator />

                {/* Security Indicator */}
                <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    Secure payment with HMAC signature validation
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Payment Method Selector */}
            {!paymentMethod && !clientSecret && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Choose Payment Method</CardTitle>
                  <CardDescription>
                    Select how you&apos;d like to pay
                  </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="space-y-3 pt-6">
                  <Button
                    onClick={() => handlePaymentMethodSelect('card')}
                    disabled={creatingPayment}
                    className="w-full justify-start h-auto py-6 hover:scale-[1.02] transition-transform"
                    variant="outline"
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-base">Credit/Debit Card</div>
                        <div className="text-xs text-muted-foreground">
                          Visa, Mastercard, Amex, and more
                        </div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => handlePaymentMethodSelect('bank')}
                    disabled={creatingPayment}
                    className="w-full justify-start h-auto py-6 hover:scale-[1.02] transition-transform"
                    variant="outline"
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Banknote className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-base">Bank Transfer</div>
                        <div className="text-xs text-muted-foreground">
                          Direct bank account payment
                        </div>
                      </div>
                    </div>
                  </Button>

                  {creatingPayment && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Initializing payment...
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Payment Form */}
          <div>
            {paymentMethod && clientSecret && (
              <StripeProvider clientSecret={clientSecret}>
                <PaymentForm
                  clientSecret={clientSecret}
                  amount={paymentParams ? calculateWithFee(paymentParams.amt).totalAmount : '0'}
                  currency={paymentParams?.currency || 'usd'}
                  customerEmail={customerData?.email || undefined}
                />
              </StripeProvider>
            )}

            {!paymentMethod && !clientSecret && (
              <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/10 shadow-lg h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Secure Payment
                  </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6">
                  <Alert className="bg-transparent border-none p-0">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                      Your payment is protected by Stripe&apos;s secure payment processing. 
                      Your card details are never stored on our servers.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading payment details...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}