'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface CustomerData {
  email: string;
  name: string;
  individual_name?: string;
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
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CustomerData>({
    email: '',
    name: '',
    individual_name: '',
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

    try {
      const response = await fetch('/api/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
              Your customer account has been created successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Customer ID:</p>
              <p className="font-mono text-sm bg-white p-2 rounded border">
                {customerId}
              </p>
            </div>
            {/* <div className="space-y-2">
              <Button 
                onClick={() => router.push('/builder')} 
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
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="individual_name">Individual Name</Label>
                  <Input
                    id="individual_name"
                    type="text"
                    value={formData.individual_name}
                    onChange={(e) => handleInputChange('individual_name', e.target.value)}
                    placeholder="Jenny Rosen"
                  />
                  <p className="text-xs text-muted-foreground">
                    The individual's name (separate from business name)
                  </p>
                </div>
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (206) 555-0123"
                  />
                </div>
                <div className="space-y-2">
                  {/* Empty div to maintain grid layout */}
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
