'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Download, Loader2, AlertCircle } from 'lucide-react';

interface PaymentData {
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
  customerEmail: string | null;
  customerName: string | null;
  description: string;
  receiptUrl: string | null;
  created: number;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState<PaymentData | null>(null);

  useEffect(() => {
    const fetchPayment = async (retryCount = 0) => {
      try {
        const paymentIntentId = searchParams.get('payment_intent');

        if (!paymentIntentId) {
          setError('Missing payment information');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/get-payment?payment_intent_id=${paymentIntentId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch payment details');
          setLoading(false);
          return;
        }

        const paymentData = await response.json();
        console.log('Payment data received:', paymentData);
        console.log('Receipt URL:', paymentData.receiptUrl);
        
        if (!paymentData.receiptUrl && retryCount < 3) {
          console.log(`Receipt URL not available, retrying... (attempt ${retryCount + 1}/3)`);
          setTimeout(() => fetchPayment(retryCount + 1), 2000); 
          return;
        }
        
        console.log('Setting payment data and stopping loading');
        setPayment(paymentData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching payment:', err);
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    };

    fetchPayment();
  }, [searchParams]);

  const formatAmount = (cents: number, currencyCode?: string) => {
    const amount = (cents / 100).toFixed(2);
    
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Loading your payment details...
              </p>
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
              <CardTitle>Error</CardTitle>
            </div>
            <CardDescription>
              We couldn&apos;t retrieve your payment details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-6 shadow-lg animate-in zoom-in duration-500">
              <CheckCircle2 className="h-20 w-20 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-4xl font-bold tracking-tight">Payment Successful!</h1>
              
            </div>
            <p className="text-muted-foreground mt-2 text-lg">
              Thank you for your payment. Your receipt is ready to download.
            </p>
          </div>
        </div>

        {/* Payment Details Card */}
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Payment Confirmation
            </CardTitle>
            <CardDescription>
              Your payment has been processed successfully
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-6 pt-6">
            {/* Payment Details */}
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg border border-primary/10">
                <span className="text-muted-foreground font-semibold">Amount Paid:</span>
                <span className="text-3xl font-bold text-primary">
                  {payment && formatAmount(payment.amount, payment.currency)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Currency:</span>
                <Badge variant="outline" className="uppercase">
                  {payment?.currency}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <Badge className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Paid
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Date Paid:</span>
                <span className="font-medium">
                  {payment && new Date(payment.created * 1000).toLocaleDateString()}
                </span>
              </div>
              {payment?.customerEmail && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{payment.customerEmail}</span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Transaction ID:</span>
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{payment?.paymentIntentId}</span>
              </div>
            </div>

            <Separator />
            <div className="pt-6 space-y-3">
              
              <a
                href={payment?.receiptUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full" size="lg" variant="default" disabled={!payment?.receiptUrl}>
                  <Download className="mr-2 h-4 w-4" />
                  {payment?.receiptUrl ? 'View Receipt' : 'Loading Receipt...'}
                </Button>
              </a>
              <p className="text-sm text-muted-foreground pt-2">
                Save a copy of your payment receipt for your records
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Alert className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/10">
          <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <AlertDescription>
            <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              What&apos;s Next?
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              Your payment has been processed successfully. A confirmation email has been sent to your email address. 
              You can download your receipt using the button above.
            </p>
          </AlertDescription>
        </Alert>

        {/* Support */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Contact support at{' '}
            <a href="mailto:support@cirqley.com" className="text-primary hover:underline">
              support@cirqley.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading your payment details...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
