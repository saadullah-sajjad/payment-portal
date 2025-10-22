'use client';

import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CreditCard, Building2, User, Mail, MapPin, Calendar, FileText } from 'lucide-react';
import { validateSignature } from '@/lib/hmac';
import { useSearchParams } from 'next/navigation';
import { StripeProvider } from '@/components/stripe-provider';
import { PaymentForm } from '@/components/payment-form';
import Image from 'next/image';


interface CustomerData {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  description: string | null;
  created: number;
  metadata: Record<string, string>;
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
  } | null;
  business_name: string | null;
  individual_name: string | null;
}

interface PaymentParams {
  cid: string;
  amt: string;
  currency: string;
  invoiceDate: string;
  invoiceDesc: string;
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
  const [actualPaymentAmount, setActualPaymentAmount] = useState<string>('0');

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        // Get URL parameters
        const cid = searchParams.get('cid');
        const amt = searchParams.get('amt');
        const currency = searchParams.get('currency');
        const invoiceDate = searchParams.get('invoiceDate');
        const invoiceDesc = searchParams.get('invoiceDesc');
        const sig = searchParams.get('sig');

        // Debug: Log all URL parameters
        console.log('URL Parameters received:', { cid, amt, currency, invoiceDate, invoiceDesc, sig });
        console.log('URL string:', window.location.href);
        
        // Validate required parameters
        if (!cid || !amt || !currency || !invoiceDate || !invoiceDesc || !sig) {
          console.error('Missing required parameters:', { cid, amt, currency, invoiceDate, invoiceDesc, sig });
          setError('Missing required parameters in URL');
          setLoading(false);
          return;
        }

        const params: PaymentParams = { cid, amt, currency, invoiceDate, invoiceDesc, sig };

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
      // Calculate amount with appropriate fees
      let totalAmount: string;
      let processingFee: number = 0;
      
      if (method === 'card') {
        const calculated = calculateWithFee(paymentParams.amt);
        totalAmount = calculated.totalAmount;
        processingFee = calculated.processingFee;
      } else {
        // ACH/Bank - 0.8% fee (max $5)
        const calculated = calculateACHFee(paymentParams.amt);
        totalAmount = calculated.totalAmount;
        processingFee = calculated.achFee;
      }
      
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
          description: paymentParams.invoiceDesc,
          paymentMethodType: method, // Pass the payment method type
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
      setActualPaymentAmount(totalAmount);
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

  const calculateACHFee = (amount: string) => {
    const baseAmount = parseInt(amount);
    const achFee = Math.min(Math.round(baseAmount * 0.008), 500); // 0.8% fee, max $5 (500 cents)
    const totalAmount = baseAmount + achFee;
    return {
      baseAmount,
      achFee,
      totalAmount: totalAmount.toString(),
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatAddress = (address: CustomerData['address'] | null | undefined) => {
    if (!address) return 'Not provided';
    const parts = [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.postal_code,
      address.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center space-y-4">
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
          <p className="text-muted-foreground">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-background border border-red-500/50 rounded-xl p-6">
          <div className="flex justify-center bg-black rounded-lg p-2 w-fit mx-auto mb-4">
            <Image
              src="/logo.webp"
              alt="Dubsea Logo"
              width={80}
              height={80}
              priority
            />
          </div>
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-4">
            <AlertCircle className="h-5 w-5" />
            <h2 className="text-xl font-bold">Payment Link Error</h2>
          </div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-xs text-muted-foreground">
            Please contact support or request a new payment link from your service provider.
          </p>
        </div>
      </div>
    );
  }

  const baseAmount = paymentParams ? parseInt(paymentParams.amt) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Invoice Details - Combined Card */}
        <div className="bg-card rounded-xl p-6 border">
          {/* General Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Client</p>
              <p className="text-lg font-bold">{customerData?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Due</p>
              <p className="text-lg font-bold">
                {paymentParams && formatDate(paymentParams.invoiceDate)} (7 days)
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Issued</p>
              <p className="text-lg font-bold">
                {paymentParams && formatDate(paymentParams.invoiceDate)}
              </p>
            </div>
          </div>

          {/* Customer Information */}
          <div className="mb-6 pb-6 border-b">
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Business Name</p>
                  <p className="font-medium">
                    {customerData?.business_name || customerData?.name || 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Individual Name</p>
                  <p className="font-medium">
                    {customerData?.individual_name || 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{customerData?.email || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Billing Address</p>
                  <p className="font-medium">{formatAddress(customerData?.address)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Description */}
          <div>
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Invoice Description</p>
                <p className="font-medium">{paymentParams?.invoiceDesc || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        {!paymentMethod && !clientSecret && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose Payment Method</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ACH Option */}
              <button
                onClick={() => handlePaymentMethodSelect('bank')}
                disabled={creatingPayment}
                className="bg-card hover:bg-accent border hover:border-primary rounded-xl p-6 text-left transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-lg">ACH (Bank)</h4>
                  <Badge className="bg-blue-600 text-white text-xs">+0.8% fee</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Fast, secure, and lower fees. Recommended.</p>
              </button>

              {/* Card Option */}
              <button
                onClick={() => handlePaymentMethodSelect('card')}
                disabled={creatingPayment}
                className="bg-card hover:bg-accent border hover:border-primary rounded-xl p-6 text-left transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-lg">Card</h4>
                  <Badge className="bg-orange-600 text-white text-xs">+3% fee</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Pay with Visa, MasterCard, AmEx.</p>
              </button>
            </div>

            {creatingPayment && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Initializing payment...
              </div>
            )}
          </div>
        )}

        {/* Payment Form */}
        {paymentMethod && clientSecret && (
          <div className="bg-card rounded-xl p-6 border">
            <StripeProvider clientSecret={clientSecret}>
              <PaymentForm
                clientSecret={clientSecret}
                amount={actualPaymentAmount}
                currency={paymentParams?.currency || 'usd'}
                customerEmail={customerData?.email || undefined}
              />
            </StripeProvider>
          </div>
        )}

        {/* Authorization Text */}
        <p className="text-sm text-muted-foreground text-center">
          By continuing, you authorize Dubsea to charge the selected payment method for this invoice and future monthly renewals. You can change your payment method at any time.
        </p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
          <div className="flex flex-col items-center justify-center space-y-4">
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
            <p className="text-muted-foreground">Loading payment details...</p>
          </div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
