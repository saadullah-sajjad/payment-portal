import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { renderToStream } from '@react-pdf/renderer';
import { ReceiptDocument } from './receipt-template';

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

    // Retrieve payment intent with expanded latest_charge
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge', 'customer'],
    });

    // Only generate receipt for successful payments
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Receipt is only available for successful payments' },
        { status: 400 }
      );
    }

    // Get customer details
    let customer: Stripe.Customer | null = null;
    if (paymentIntent.customer && typeof paymentIntent.customer !== 'string') {
      customer = paymentIntent.customer as Stripe.Customer;
    } else if (paymentIntent.customer) {
      customer = await stripe.customers.retrieve(paymentIntent.customer as string) as Stripe.Customer;
    }

    // Get charge details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latestCharge = (paymentIntent as any).latest_charge as Stripe.Charge | null;
    const chargeId = latestCharge?.id || null;
    const receiptNumber = latestCharge?.receipt_number || null;
    
    // Determine payment method
    let paymentMethod = 'Card';
    const paymentType = latestCharge?.payment_method_details?.type;
    
    if (paymentType === 'us_bank_account' || paymentType === 'ach_credit_transfer' || paymentType === 'ach_debit') {
      paymentMethod = 'ACH';
    } else if (paymentType === 'card') {
      const card = latestCharge?.payment_method_details?.card;
      if (card?.brand && card?.last4) {
        paymentMethod = `${card.brand.toUpperCase()} **** ${card.last4}`;
      } else {
        paymentMethod = 'Card';
      }
    }

    // Prepare receipt data
    const receiptData = {
      paymentIntentId: paymentIntent.id,
      chargeId,
      receiptNumber,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'Paid',
      created: paymentIntent.created,
      description: paymentIntent.description || 'Payment',
      customerName: customer?.name || 'N/A',
      customerEmail: customer?.email || 'N/A',
      customerAddress: customer?.address ? {
        line1: customer.address.line1 || '',
        line2: customer.address.line2 || '',
        city: customer.address.city || '',
        state: customer.address.state || '',
        postal_code: customer.address.postal_code || '',
        country: customer.address.country || '',
      } : null,
      metadata: paymentIntent.metadata,
      paymentMethod,
    };

    // Generate PDF
    const pdfStream = await renderToStream(
      <ReceiptDocument data={receiptData} />
    );

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${paymentIntentId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating receipt:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      if (error.type === 'StripeInvalidRequestError') {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    );
  }
}

