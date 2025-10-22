import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, individual_name, business_name, phone, address } = body;

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
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

    // Create customer in Stripe
    const customer = await stripe.customers.create({
      email,
      name,
      individual_name,
      business_name,
      phone,
      address: address ? {
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country,
      } : undefined,
      metadata: {
        created_via: 'payment_portal',
        registration_date: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      individual_name: customer.individual_name,
      business_name: customer.business_name,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('cid');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    if (!customerId.startsWith('cus_')) {
      return NextResponse.json(
        { error: 'Invalid customer ID format' },
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

    // Fetch customer from Stripe
    const customer = await stripe.customers.retrieve(customerId);

    if (customer.deleted) {
      return NextResponse.json(
        { error: 'Customer has been deleted' },
        { status: 404 }
      );
    }

    // Return customer details
    return NextResponse.json({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      description: customer.description,
      created: customer.created,
      metadata: customer.metadata,
      address: customer.address,
      // Business and individual names are direct fields on the customer object
      business_name: customer.business_name,
      individual_name: customer.individual_name,
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      if (error.type === 'StripeInvalidRequestError') {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch customer details' },
      { status: 500 }
    );
  }
}
