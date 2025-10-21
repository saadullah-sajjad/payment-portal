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

    // Accept all valid payment statuses
    const validStatuses = ['succeeded', 'processing', 'requires_action', 'requires_payment_method', 'canceled', 'failed'];
    if (!validStatuses.includes(paymentIntent.status)) {
      return NextResponse.json(
        { error: `Payment intent status is ${paymentIntent.status}. Expected: ${validStatuses.join(', ')}` },
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
    let invoicePdfUrl = null;
    let failureCode = null;
    let failureMessage = null;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latestCharge = (paymentIntent as any).latest_charge;
    console.log('Latest charge object:', latestCharge);
    
    // Check if charge failed (for any status)
    if (latestCharge) {
      if (latestCharge.status === 'failed') {
        failureCode = latestCharge.failure_code;
        failureMessage = latestCharge.failure_message;
        console.log('Payment failed:', { failureCode, failureMessage });
      }
    }
    
    // Access receipt URL as per Stripe documentation: pi.latest_charge.receipt_url
    if (latestCharge && latestCharge.receipt_url) {
      receiptUrl = latestCharge.receipt_url;
      console.log('Receipt URL found:', receiptUrl);
    } else {
      console.log('Receipt URL not available yet. Latest charge:', latestCharge);
    }

    // Try to get invoice PDF URL if invoice_id is provided
    const invoiceId = searchParams.get('invoice_id');
    if (invoiceId) {
      try {
        const invoice = await stripe.invoices.retrieve(invoiceId);
        if (invoice.invoice_pdf) {
          invoicePdfUrl = invoice.invoice_pdf;
          console.log('Invoice PDF URL found:', invoicePdfUrl);
        }
      } catch (err) {
        console.log('Could not retrieve invoice:', err);
      }
    }

    // Determine actual status - check charge status for ACH payments
    let actualStatus: string = paymentIntent.status;
    
    // For ACH payments, check the charge status directly
    if (latestCharge) {
      if (latestCharge.status === 'failed') {
        actualStatus = 'failed';
      } else if (latestCharge.status === 'pending') {
        actualStatus = 'processing';
      } else if (latestCharge.status === 'succeeded') {
        actualStatus = 'succeeded';
      }
    }

    return NextResponse.json({
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: actualStatus,
      failureCode,
      failureMessage,
      customerEmail: customer && !customer.deleted ? (customer as Stripe.Customer).email : null,
      customerName: customer && !customer.deleted ? (customer as Stripe.Customer).name : null,
      description: paymentIntent.description || 'Payment',
      receiptUrl,
      invoicePdfUrl,
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

