import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    // Initialize Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-09-30.clover',
    });

    // Fetch all customers
    const customers = await stripe.customers.list({
      limit: Math.min(limit, 100), // Stripe max is 100
    });

    // Format the response
    const formattedCustomers = customers.data.map(customer => ({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      business_name: customer.business_name,
      phone: customer.phone,
      created: customer.created,
    }));

    return NextResponse.json({
      customers: formattedCustomers,
      total: formattedCustomers.length,
      hasMore: customers.has_more,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
