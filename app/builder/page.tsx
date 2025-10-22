'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Copy, Check, Link as LinkIcon, AlertCircle, Sparkles, Shield, Search, UserPlus, Loader2 } from 'lucide-react';
import { buildPaymentUrl } from '@/lib/hmac';
import Image from 'next/image';
import Link from 'next/link';

interface Customer {
  id: string;
  email: string;
  name: string;
  individual_name?: string;
  business_name?: string;
  phone?: string;
  created: number;
}

export default function UrlBuilderPage() {
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('usd');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  
  // Customer search states
  const [searchQuery, setSearchQuery] = useState('');
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  
  // Email sending states
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Manual ID dialog states
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualId, setManualId] = useState('');
  const [manualIdError, setManualIdError] = useState('');

  // Load all customers on component mount
  const loadAllCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await fetch('/api/customers/list?limit=100');
      const data = await response.json();
      
      if (response.ok) {
        setAllCustomers(data.customers);
        setFilteredCustomers(data.customers);
      } else {
        console.error('Error loading customers:', data.error);
        setAllCustomers([]);
        setFilteredCustomers([]);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
      setAllCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Filter customers based on search query
  const filterCustomers = (query: string) => {
    if (!query.trim()) {
      setFilteredCustomers(allCustomers);
      return;
    }

    const filtered = allCustomers.filter(customer => {
      const searchTerm = query.toLowerCase();
      return (
        customer.email?.toLowerCase().includes(searchTerm) ||
        customer.name?.toLowerCase().includes(searchTerm) ||
        customer.business_name?.toLowerCase().includes(searchTerm)
      );
    });

    setFilteredCustomers(filtered);
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    filterCustomers(value);
    setShowDropdown(true);
  };

  // Load customers on component mount
  useEffect(() => {
    loadAllCustomers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-customer-dropdown]')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerId(customer.id);
    setSearchQuery(customer.business_name || customer.name || customer.email || '');
    setShowDropdown(false);
  };

  // Handle manual ID submission
  const handleManualIdSubmit = async () => {
    setManualIdError('');
    
    if (!manualId.trim()) {
      setManualIdError('Please enter a customer ID');
      return;
    }

    if (!manualId.startsWith('cus_')) {
      setManualIdError('Customer ID must start with "cus_"');
      return;
    }

    // Check if customer exists in our loaded customers
    const existingCustomer = allCustomers.find(customer => customer.id === manualId);
    
    if (existingCustomer) {
      // Customer exists in our list, use it
      setSelectedCustomer(existingCustomer);
      setSearchQuery(existingCustomer.business_name || existingCustomer.name || existingCustomer.email || '');
    } else {
      // Customer not in our list, try to fetch from API
      try {
        const response = await fetch(`/api/customer?id=${manualId}`);
        const data = await response.json();
        
        if (response.ok && data.customer) {
          const fetchedCustomer = data.customer;
          setSelectedCustomer(fetchedCustomer);
          setSearchQuery(fetchedCustomer.business_name || fetchedCustomer.name || fetchedCustomer.email || '');
        } else {
          // Customer not found, but still set the ID for manual entry
          setSelectedCustomer(null);
          setSearchQuery(manualId);
        }
      } catch (error) {
        console.error('Failed to fetch customer:', error);
        // Still set the ID even if fetch fails
        setSelectedCustomer(null);
        setSearchQuery(manualId);
      }
    }

    setCustomerId(manualId);
    setShowDropdown(false);
    setShowManualDialog(false);
    setManualId('');
  };

  // Send payment link via email
  const handleSendEmail = async () => {
    if (!selectedCustomer || !generatedUrl) {
      setError('Please select a customer and generate a URL first');
      return;
    }

    setSendingEmail(true);
    setError('');

    try {
      const requestData = {
        customerEmail: selectedCustomer.email,
        customerName: selectedCustomer.name,
        businessName: selectedCustomer.business_name,
        amount: convertToCents(amount),
        currency: currency,
        paymentUrl: generatedUrl,
        invoiceDescription: invoiceDescription,
        invoiceDate: invoiceDate,
      };
      
      console.log('Sending payment URL:', generatedUrl);
      console.log('Request data:', requestData);
      
      const response = await fetch('/api/send-payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Convert dollars to cents
  const convertToCents = (dollarAmount: string): string => {
    const dollars = parseFloat(dollarAmount);
    if (isNaN(dollars)) return '0';
    return Math.round(dollars * 100).toString();
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
      
      console.log('Generated payment URL:', url);
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
            {/* Customer Select */}
            <div className="space-y-2" data-customer-dropdown>
              <Label htmlFor="customer-select">
                Select Customer 
                {allCustomers.length > 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({allCustomers.length} customers loaded)
                  </span>
                )}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customer-select"
                  type="text"
                  placeholder={loadingCustomers ? "Loading customers..." : "Search customers by name, email, or business..."}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  className="pl-10"
                  disabled={loadingCustomers}
                />
                {loadingCustomers && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
              
              {/* Customer Dropdown */}
              {showDropdown && filteredCustomers.length > 0 && (
                <div className="border rounded-md bg-white shadow-lg max-h-60 overflow-y-auto z-10 relative">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{customer.business_name || customer.name || 'Unnamed Customer'}</p>
                          {customer.individual_name && (
                            <p className="text-sm text-gray-500">Individual: {customer.individual_name}</p>
                          )}
                          <p className="text-sm text-gray-600">{customer.email || 'No email'}</p>
                          {customer.phone && (
                            <p className="text-xs text-gray-500">{customer.phone}</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs ml-2">
                          {customer.id}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* No Results */}
              {showDropdown && filteredCustomers.length === 0 && !loadingCustomers && searchQuery && (
                <div className="border rounded-md bg-white shadow-lg p-4 text-center">
                  <p className="text-gray-500">No customers found</p>
                  <Link href="/register" className="text-primary hover:underline text-sm">
                    Create new customer
                  </Link>
                </div>
              )}
              
              {/* Selected Customer */}
              {selectedCustomer && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-green-800">
                        {selectedCustomer.business_name || selectedCustomer.name || 'Unnamed Customer'}
                      </p>
                      {selectedCustomer.individual_name && (
                        <p className="text-sm text-green-500">Individual: {selectedCustomer.individual_name}</p>
                      )}
                      <p className="text-sm text-green-600">{selectedCustomer.email || 'No email'}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setCustomerId('');
                        setSearchQuery('');
                        setShowDropdown(false);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Manual Customer ID Display */}
              {customerId && !selectedCustomer && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-blue-800">Manual Customer ID</p>
                      <p className="text-sm text-blue-600">{customerId}</p>
                      <p className="text-xs text-blue-500">Customer details not available</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCustomerId('');
                        setSearchQuery('');
                        setShowDropdown(false);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Manual Entry Option */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Or</span>
                <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto"
                    >
                      enter customer ID manually
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Enter Customer ID</DialogTitle>
                      <DialogDescription>
                        Enter the Stripe Customer ID (starts with &quot;cus_&quot;) to manually select a customer.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="manual-id" className="text-right">
                          Customer ID
                        </Label>
                        <Input
                          id="manual-id"
                          value={manualId}
                          onChange={(e) => {
                            setManualId(e.target.value);
                            setManualIdError('');
                          }}
                          placeholder="cus_..."
                          className="col-span-3"
                        />
                      </div>
                      {manualIdError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{manualIdError}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowManualDialog(false);
                          setManualId('');
                          setManualIdError('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleManualIdSubmit}>
                        Use Customer ID
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="flex items-center gap-2">
                <Link href="/register" className="text-primary hover:underline text-sm flex items-center gap-1">
                  <UserPlus className="h-3 w-3" />
                  Create new customer
                </Link>
              </div>
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
              <div className="space-y-3 pt-2">
                <div className="flex gap-2">
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
                
                {/* Email sending section */}
                {selectedCustomer && (
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">Send to Customer:</span>
                      <span className="text-sm text-muted-foreground">
                        {selectedCustomer.email}
                      </span>
                    </div>
                    <Button
                      onClick={handleSendEmail}
                      disabled={sendingEmail || emailSent}
                      className="w-full"
                    >
                      {sendingEmail ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending Email...
                        </>
                      ) : emailSent ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Email Sent!
                        </>
                      ) : (
                        'Send Payment Link via Email'
                      )}
                    </Button>
                    {emailSent && (
                      <p className="text-sm text-green-600 text-center mt-2">
                        Payment link sent to {selectedCustomer.email}
                      </p>
                    )}
                  </div>
                )}
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
                Select from all your Stripe customers or create a new one using the registration form
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                2
              </div>
              <p className="text-muted-foreground">
                Enter the payment amount, currency, invoice date, and description
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
                Send the payment link directly to your customer via email or copy the URL
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                5
              </div>
              <p className="text-muted-foreground">
                The customer can click the link to complete their payment with card or ACH
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

