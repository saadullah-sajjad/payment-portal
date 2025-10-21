'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, Link as LinkIcon, AlertCircle, Sparkles, Shield } from 'lucide-react';
import { buildPaymentUrl } from '@/lib/hmac';
import Image from 'next/image';

export default function UrlBuilderPage() {
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('usd');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Convert dollars to cents
  const convertToCents = (dollarAmount: string): string => {
    const dollars = parseFloat(dollarAmount);
    if (isNaN(dollars)) return '0';
    return Math.round(dollars * 100).toString();
  };

  // Convert cents to dollars
  const convertToDollars = (cents: string): string => {
    const centsNum = parseInt(cents);
    if (isNaN(centsNum)) return '';
    return (centsNum / 100).toFixed(2);
  };

  const handleGenerate = () => {
    setError('');
    
    // Validation
    if (!customerId.trim()) {
      setError('Customer ID is required');
      return;
    }
    
    if (!customerId.startsWith('cus_')) {
      setError('Customer ID must start with "cus_"');
      return;
    }
    
    if (!amount.trim()) {
      setError('Amount is required');
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Amount must be a positive number');
      return;
    }
    
    if (!invoiceDate.trim()) {
      setError('Invoice Date is required');
      return;
    }
    
    if (!invoiceDescription.trim()) {
      setError('Invoice Description is required');
      return;
    }
    
    // Convert dollars to cents
    const amountInCents = convertToCents(amount);
    
    // Generate URL
    try {
      const url = buildPaymentUrl({
        cid: customerId,
        amt: amountInCents,
        currency: currency,
        invoiceDate: invoiceDate,
        invoiceDesc: invoiceDescription,
        baseUrl: window.location.origin,
      });
      setGeneratedUrl(url);
    } catch (err) {
      setError('Failed to generate URL. Please try again.');
      console.error(err);
    }
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatAmount = (dollarAmount: string, currencyCode?: string) => {
    const num = parseFloat(dollarAmount);
    if (isNaN(num)) return '';
    const amount = num.toFixed(2);
    
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center bg-black rounded-lg p-2 w-fit mx-auto">
            <Image
              src="/logo.webp"
              alt="Dubsea Logo"
              width={120}
              height={120}
              priority
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Payment URL Builder</h1>
            <p className="text-muted-foreground">
              Generate secure payment links for your clients
            </p>
          </div>
        </div>

        {/* URL Builder Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Build Payment Link
            </CardTitle>
            <CardDescription>
              Enter customer details to generate a secure payment URL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer ID */}
            <div className="space-y-2">
              <Label htmlFor="customer-id">Stripe Customer ID</Label>
              <Input
                id="customer-id"
                type="text"
                placeholder="cus_ABC123..."
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Must start with &quot;cus_&quot;
              </p>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {currency === 'usd' ? '$' : currency === 'eur' ? '€' : currency === 'gbp' ? '£' : currency.toUpperCase()}
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="999.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="pl-8"
                  />
                </div>
                {amount && (
                  <div className="flex items-center px-4 bg-muted rounded-md text-sm">
                    {convertToCents(amount)} cents
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Enter amount in dollars (e.g., 999.00 = {convertToCents('999.00')} cents)
              </p>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                type="text"
                placeholder="usd"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toLowerCase())}
                maxLength={3}
              />
              <p className="text-xs text-muted-foreground">
                ISO 4217 currency code (e.g., usd, eur, gbp)
              </p>
            </div>

            {/* Invoice Date */}
            <div className="space-y-2">
              <Label htmlFor="invoice-date">Invoice Date</Label>
              <Input
                id="invoice-date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The date when the invoice was issued
              </p>
            </div>

            {/* Invoice Description */}
            <div className="space-y-2">
              <Label htmlFor="invoice-desc">Invoice Description</Label>
              <Input
                id="invoice-desc"
                type="text"
                placeholder="Monthly Retainer - October 2025"
                value={invoiceDescription}
                onChange={(e) => setInvoiceDescription(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Description of the invoice or services
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Generate Button */}
            <Button 
              onClick={handleGenerate} 
              className="w-full"
              size="lg"
            >
              Generate Payment URL
            </Button>
          </CardContent>
        </Card>

        {/* Generated URL Display */}
        {generatedUrl && (
          <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/10 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-green-600" />
                <CardTitle className="text-green-700 dark:text-green-400">
                  Payment URL Generated
                </CardTitle>
                <Badge variant="outline" className="ml-auto bg-green-100 text-green-700 border-green-300">
                  <Shield className="h-3 w-3 mr-1" />
                  Secure
                </Badge>
              </div>
              <CardDescription>
                Copy and send this link to your client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={generatedUrl}
                  readOnly
                  className="font-mono text-sm bg-background"
                />
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* URL Preview */}
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">URL Breakdown:</Label>
                <div className="space-y-2 text-sm font-mono bg-background p-4 rounded-md border">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Base URL:</span>
                    <span className="text-foreground font-semibold">{window.location.origin}/pay</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Customer ID:</span>
                    <span className="text-foreground font-semibold">{customerId}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="text-foreground font-semibold">{formatAmount(amount, currency)} ({convertToCents(amount)} cents)</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Currency:</span>
                    <Badge variant="outline" className="uppercase">{currency}</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Invoice Date:</span>
                    <span className="text-foreground font-semibold">{invoiceDate}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Invoice Description:</span>
                    <span className="text-foreground font-semibold">{invoiceDescription}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Signature:</span>
                    <Badge variant="secondary" className="text-xs">HMAC-SHA256</Badge>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleCopy}
                  variant="secondary"
                  className="flex-1"
                >
                  {copied ? 'Copied!' : 'Copy URL'}
                </Button>
                <Button
                  onClick={() => window.open(generatedUrl, '_blank')}
                  variant="outline"
                  className="flex-1"
                >
                  Preview Link
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                1
              </div>
              <p className="text-muted-foreground">
                Create a Stripe Customer manually in your Stripe Dashboard
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                2
              </div>
              <p className="text-muted-foreground">
                Enter the Customer ID (starts with &quot;cus_&quot;), amount in cents, and currency
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                3
              </div>
              <p className="text-muted-foreground">
                Click &quot;Generate Payment URL&quot; to create a secure link
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                4
              </div>
              <p className="text-muted-foreground">
                Copy and send the URL to your client via email or messaging
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                5
              </div>
              <p className="text-muted-foreground">
                The client can click the link to complete their payment
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

