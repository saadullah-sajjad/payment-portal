import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'paymentIntentId is required' },
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

    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment intent is not succeeded' },
        { status: 400 }
      );
    }

    console.log('Creating invoice for payment intent:', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      customer: paymentIntent.customer,
    });

    // Create invoice with the amount directly
    const invoice = await stripe.invoices.create({
      customer: paymentIntent.customer as string,
      collection_method: 'charge_automatically',
      auto_advance: false, // Don't auto-finalize
      description: paymentIntent.description || 'Invoice',
      metadata: {
        payment_intent_id: paymentIntent.id,
        source: 'payment_portal',
      },
    });

    console.log('Invoice created (before adding item):', {
      invoiceId: invoice.id,
      subtotal: invoice.subtotal,
      total: invoice.total,
    });

    // Add invoice item to the invoice
    const invoiceItem = await stripe.invoiceItems.create({
      customer: paymentIntent.customer as string,
      invoice: invoice.id, // Explicitly attach to this invoice
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      description: paymentIntent.description || 'Payment',
    });

    console.log('Invoice item added:', {
      invoiceItemId: invoiceItem.id,
      amount: invoiceItem.amount,
      invoice: invoiceItem.invoice,
    });

    // Finalize the invoice to generate the PDF
    let finalizedInvoice;
    try {
      finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
      
      console.log('Invoice finalized successfully:', {
        invoiceId: finalizedInvoice.id,
        subtotal: finalizedInvoice.subtotal,
        total: finalizedInvoice.total,
        amountDue: finalizedInvoice.amount_due,
        amountPaid: finalizedInvoice.amount_paid,
        status: finalizedInvoice.status,
      });
    } catch (finalizeError) {
      console.error('Error finalizing invoice:', finalizeError);
      
      // If finalization fails, try to retrieve the invoice
      const retrievedInvoice = await stripe.invoices.retrieve(invoice.id);
      console.log('Retrieved invoice after finalization error:', {
        invoiceId: retrievedInvoice.id,
        subtotal: retrievedInvoice.subtotal,
        total: retrievedInvoice.total,
        amountDue: retrievedInvoice.amount_due,
        status: retrievedInvoice.status,
      });
      
      finalizedInvoice = retrievedInvoice;
    }

    // Mark the invoice as paid to create a receipt (payment already made via payment intent)
    try {
      const paidInvoice = await stripe.invoices.pay(finalizedInvoice.id, {
        paid_out_of_band: true,
      });
      
      console.log('Invoice marked as paid (receipt created):', {
        invoiceId: paidInvoice.id,
        status: paidInvoice.status,
        amountPaid: paidInvoice.amount_paid,
      });
      
      return NextResponse.json({
        invoiceId: paidInvoice.id,
        invoicePdf: paidInvoice.invoice_pdf,
        hostedInvoiceUrl: paidInvoice.hosted_invoice_url,
      });
    } catch (payError) {
      console.error('Error marking invoice as paid:', payError);
      // Return the finalized invoice even if marking as paid fails
      return NextResponse.json({
        invoiceId: finalizedInvoice.id,
        invoicePdf: finalizedInvoice.invoice_pdf,
        hostedInvoiceUrl: finalizedInvoice.hosted_invoice_url,
      });
    }
  } catch (error) {
    console.error('Error creating invoice:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
