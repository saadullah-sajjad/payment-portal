'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface CustomerData {
  email: string;
  name: string;
  business_name?: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CustomerData>({
    email: '',
    name: '',
    business_name: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
    },
  });

  // Format phone number as (XXX) XXX-XXXX
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '').slice(0, 10);

    if (digits.length === 0) return '';

    if (digits.length <= 3) {
      return `(${digits}`;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
  };

  // Validate email format
  const validateEmail = (email: string): boolean => {
    // Email must contain @ and a domain with at least .com, .org, .net, etc.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address!,
          [addressField]: value,
        },
      }));
    } else if (field === 'phone') {
      // Format phone number with (XXX)XXX-XXXX pattern
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [field]: formatted,
      }));
    } else if (field === 'email') {
      // Validate email in real-time
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
      
      // Clear error if email is valid or empty
      if (value === '' || validateEmail(value)) {
        setEmailError(null);
      } else {
        setEmailError('Please enter a valid email address (e.g., name@example.com)');
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEmailError(null);

    // Validate email before submission
    if (!validateEmail(formData.email)) {
      setEmailError('Please enter a valid email address (e.g., name@example.com)');
      setLoading(false);
      return;
    }

    try {
      // Send full name as both name and individual_name for Stripe dashboard
      const payload = {
        ...formData,
        individual_name: formData.name,
      };

      const response = await fetch('/api/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create customer');
      }

      setCustomerId(result.customerId);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Registration Successful!</CardTitle>
            <CardDescription>
              You have successfully registered your account with Dubsea Networks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* <div className="space-y-2">
              <Button 
                onClick={() => router.push('/invoicing')} 
                className="w-full"
              >
                Create Payment Link
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/')} 
                className="w-full"
              >
                Back to Home
              </Button>
            </div> */}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent pb-2">
            Customer Registration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Basic Information</h3>
                <p className="text-sm text-muted-foreground"> Please input information for Billing.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    placeholder="john@example.com"
                    className={emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                  />
                  {emailError && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {emailError}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(200) 123-1231"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Address Information</h3>
              <div className="space-y-2">
                <Label htmlFor="line1">Street Address *</Label>
                <Input
                  id="line1"
                  type="text"
                  value={formData.address?.line1 || ''}
                  onChange={(e) => handleInputChange('address.line1', e.target.value)}
                  required
                  placeholder="123 Main St"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="line2">Address Line 2</Label>
                <Input
                  id="line2"
                  type="text"
                  value={formData.address?.line2 || ''}
                  onChange={(e) => handleInputChange('address.line2', e.target.value)}
                  placeholder="Suite 100"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.address?.city || ''}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                    required
                    placeholder="Seattle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    type="text"
                    value={formData.address?.state || ''}
                    onChange={(e) => handleInputChange('address.state', e.target.value)}
                    required
                    placeholder="WA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">ZIP Code *</Label>
                  <Input
                    id="postal_code"
                    type="text"
                    value={formData.address?.postal_code || ''}
                    onChange={(e) => handleInputChange('address.postal_code', e.target.value)}
                    required
                    placeholder="98101"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  type="text"
                  value={formData.address?.country || 'US'}
                  onChange={(e) => handleInputChange('address.country', e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-600">{error}</span>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              {/* <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/')}
                className="flex-1 h-12 text-base"
              >
                Cancel
              </Button> */}
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-12 text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Register'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
