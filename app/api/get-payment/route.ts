import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent_id');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'payment_intent_id is required' },
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

    // Retrieve payment intent with expanded latest_charge (for API versions after 2022-11-15)
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge'],
    });

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment intent is not succeeded' },
        { status: 400 }
      );
    }

    // Get customer details
    let customer = null;
    if (paymentIntent.customer) {
      customer = await stripe.customers.retrieve(paymentIntent.customer as string);
    }

    // Get receipt URL from latest_charge (as per Stripe docs for API versions after 2022-11-15)
    let receiptUrl = null;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latestCharge = (paymentIntent as any).latest_charge;
    console.log('Latest charge object:', latestCharge);
    
    // Access receipt URL as per Stripe documentation: pi.latest_charge.receipt_url
    if (latestCharge && latestCharge.receipt_url) {
      receiptUrl = latestCharge.receipt_url;
      console.log('Receipt URL found:', receiptUrl);
    } else {
      console.log('Receipt URL not available yet. Latest charge:', latestCharge);
    }

    return NextResponse.json({
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      customerEmail: customer && !customer.deleted ? (customer as Stripe.Customer).email : null,
      customerName: customer && !customer.deleted ? (customer as Stripe.Customer).name : null,
      description: paymentIntent.description || 'Payment',
      receiptUrl,
      created: paymentIntent.created,
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      if (error.type === 'StripeInvalidRequestError') {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch payment' },
      { status: 500 }
    );
  }
}

