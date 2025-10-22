import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

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

    // Search customers by email or name (business_name is not supported in Stripe search)
    const customers = await stripe.customers.search({
      query: `email:"${query}" OR name:"${query}"`,
      limit: 10,
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
      total: customers.data.length,
    });
  } catch (error) {
    console.error('Error searching customers:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search customers' },
      { status: 500 }
    );
  }
}
