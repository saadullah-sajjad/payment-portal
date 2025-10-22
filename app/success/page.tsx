'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Download, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface PaymentData {
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
  failureCode?: string | null;
  failureMessage?: string | null;
  customerEmail: string | null;
  customerName: string | null;
  description: string;
  receiptUrl: string | null;
  invoicePdfUrl: string | null;
  created: number;
  chargeId: string | null;
  receiptNumber: string | null;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const paymentIntentId = searchParams.get('payment_intent');
        const invoiceId = searchParams.get('invoice_id');

        if (!paymentIntentId) {
          setError('Missing payment information');
          setLoading(false);
          return;
        }

        const url = invoiceId 
          ? `/api/get-payment?payment_intent_id=${paymentIntentId}&invoice_id=${invoiceId}`
          : `/api/get-payment?payment_intent_id=${paymentIntentId}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch payment details');
          setLoading(false);
          return;
        }

        const paymentData = await response.json();
        console.log('Payment data received:', paymentData);
        console.log('Receipt URL:', paymentData.receiptUrl);
        console.log('Invoice PDF URL:', paymentData.invoicePdfUrl);
        
        setPayment(paymentData);
        setLoading(false);
        
        // Start polling if payment is processing
        if (paymentData.status === 'processing' || paymentData.status === 'requires_action') {
          setIsPolling(true);
        }
      } catch (err) {
        console.error('Error fetching payment:', err);
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    };

    fetchPayment();
  }, [searchParams]);

  // Poll for status updates when payment is processing
  useEffect(() => {
    if (!isPolling || !payment) return;

    const pollInterval = setInterval(async () => {
      try {
        const invoiceId = searchParams.get('invoice_id');
        const url = invoiceId 
          ? `/api/get-payment?payment_intent_id=${payment.paymentIntentId}&invoice_id=${invoiceId}`
          : `/api/get-payment?payment_intent_id=${payment.paymentIntentId}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const updatedPayment = await response.json();
          console.log('Polling - Payment status:', updatedPayment.status);
          
          // Update payment data
          setPayment(updatedPayment);
          
          // Stop polling if payment succeeded or failed
          if (updatedPayment.status === 'succeeded' || updatedPayment.status === 'canceled' || updatedPayment.status === 'requires_payment_method') {
            setIsPolling(false);
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [isPolling, payment, searchParams]);

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
              <div className="flex justify-center bg-black rounded-lg p-2 w-fit mx-auto">
              <Image
                src="/logo.webp"
                alt="Dubsea Logo"
                width={80}
                height={80}
                priority
              />
              </div>
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
            <div className="flex justify-center bg-black rounded-lg p-2 w-fit mx-auto mb-4">
              <Image
                src="/logo.webp"
                alt="Dubsea Logo"
                width={80}
                height={80}
                priority
              />
            </div>
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

  // Handle failed payments
  if (payment?.status === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Failed Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center bg-black rounded-lg p-2 w-fit mx-auto">
              <Image
                src="/logo.webp"
                alt="Dubsea Logo"
                width={100}
                height={100}
                priority
              />
            </div>
            <div className="flex justify-center">
              <div className="rounded-full p-6 shadow-lg animate-in zoom-in duration-500 bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-20 w-20 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-red-600 dark:text-red-400">
                Payment Failed
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                {payment.failureMessage || 'Your payment could not be processed. Please try again or use a different payment method.'}
              </p>
            </div>
          </div>

          {/* Payment Details Card */}
          <Card className="shadow-lg border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                Payment Details
              </CardTitle>
              <CardDescription>
                Your payment could not be completed
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <span className="text-muted-foreground font-semibold">Amount:</span>
                  <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {payment && formatAmount(payment.amount, payment.currency)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className="bg-red-600 hover:bg-red-700">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Failed
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Failure Code:</span>
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{payment.failureCode || 'N/A'}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{payment?.paymentIntentId}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="border-red-500/50 bg-red-50/50 dark:bg-red-950/10">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <AlertDescription>
              <p className="font-semibold mb-2">What happened?</p>
              <p className="text-red-700 dark:text-red-300">
                {payment.failureMessage || 'The payment could not be processed. Please check your payment method and try again.'}
              </p>
            </AlertDescription>
          </Alert>

          <div className="text-center">
            <Button onClick={() => window.history.back()} size="lg">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center bg-black rounded-lg p-2 w-fit mx-auto">
            <Image
              src="/logo.webp"
              alt="Dubsea Logo"
              width={100}
              height={100}
              priority
            />
          </div>
          <div className="flex justify-center">
            <div className={`rounded-full p-6 shadow-lg animate-in zoom-in duration-500 ${
              payment?.status === 'processing' 
                ? 'bg-blue-100 dark:bg-blue-900/30' 
                : 'bg-green-100 dark:bg-green-900/30'
            }`}>
              {payment?.status === 'processing' ? (
                <CheckCircle2 className="h-20 w-20 text-blue-600 dark:text-blue-400" />
              ) : (
                <CheckCircle2 className="h-20 w-20 text-green-600 dark:text-green-400" />
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-4xl font-bold tracking-tight">
                {payment?.status === 'processing' ? 'Payment Submitted!' : 'Payment Successful!'}
              </h1>
              
            </div>
            <p className="text-muted-foreground mt-2 text-lg">
              {payment?.status === 'processing' 
                ? 'Your ACH payment is being processed. You will receive a confirmation email once it completes (typically 1-3 business days).'
                : 'Thank you for your payment. Your receipt is ready to download.'}
            </p>
          </div>
        </div>

        {/* Payment Details Card */}
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {payment?.status === 'processing' ? (
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              Payment Confirmation
            </CardTitle>
            <CardDescription>
              {payment?.status === 'processing' 
                ? 'Your ACH payment is being verified'
                : 'Your payment has been processed successfully'}
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-6 pt-6">
            {/* ACH Processing Alert */}
            {payment?.status === 'processing' && (
              <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  <strong>ACH Payment Processing:</strong> Your bank transfer is being verified. This typically takes 1-3 business days. You will receive an email confirmation once the payment completes.
                </AlertDescription>
              </Alert>
            )}
            
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
                <Badge className={
                  payment?.status === 'processing' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {payment?.status === 'processing' ? 'Processing' : 'Paid'}
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

            {/* Only show receipt button if payment is succeeded */}
            {payment?.status === 'succeeded' && (
              <>
                <Separator />
                <div className="pt-6 space-y-3">
                  <a
                    href={`/api/download-receipt?payment_intent_id=${payment.paymentIntentId}`}
                    download={`receipt-${payment.paymentIntentId}.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full" size="lg" variant="default">
                      <Download className="mr-2 h-4 w-4" />
                      Download Receipt (PDF)
                    </Button>
                  </a>
                  <p className="text-sm text-muted-foreground pt-2">
                    Download your payment receipt as a PDF for your records
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Alert className={
          payment?.status === 'processing' 
            ? 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/10'
            : 'border-green-500/50 bg-green-50/50 dark:bg-green-950/10'
        }>
          <CheckCircle2 className={
            payment?.status === 'processing' 
              ? 'h-5 w-5 text-blue-600 dark:text-blue-400' 
              : 'h-5 w-5 text-green-600 dark:text-green-400'
          } />
          <AlertDescription>
            <p className="font-semibold mb-2">
              What&apos;s Next?
            </p>
            <p>
              {payment?.status === 'processing' 
                ? 'Your ACH payment is being verified by your bank. You will receive an email confirmation once the payment completes (typically 1-3 business days). You can close this page.'
                : 'Your payment has been processed successfully. A confirmation email has been sent to your email address. You can download your receipt using the button above.'}
            </p>
          </AlertDescription>
        </Alert>

        {/* Support */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Contact support at{' '}
            <a href="mailto:support@dubsea.com" className="text-primary hover:underline">
              support@dubsea.com
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
                <div className="flex justify-center bg-black rounded-lg p-2 w-fit mx-auto">
                <Image
                  src="/logo.webp"
                  alt="Dubsea Logo"
                  width={80}
                  height={80}
                  priority
                />
                </div>
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
