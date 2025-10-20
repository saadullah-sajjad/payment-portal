import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoice_id');
    const paymentIntentId = searchParams.get('payment_intent_id');

    if (!invoiceId && !paymentIntentId) {
      return NextResponse.json(
        { error: 'invoice_id or payment_intent_id is required' },
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

    let invoice: Stripe.Invoice;

    if (invoiceId) {
      // Fetch invoice directly
      invoice = await stripe.invoices.retrieve(invoiceId);
    } else if (paymentIntentId) {
      // Fetch payment intent and find associated invoice
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Search for invoices with this payment intent in metadata
      const invoices = await stripe.invoices.list({
        customer: paymentIntent.customer as string,
        limit: 100,
      });
      
      // Find the invoice that has this payment intent ID in metadata
      const associatedInvoice = invoices.data.find(
        inv => inv.metadata?.payment_intent_id === paymentIntentId
      );
      
      if (!associatedInvoice) {
        return NextResponse.json(
          { error: 'Invoice not found for this payment. Please wait a moment and try again.' },
          { status: 404 }
        );
      }
      
      invoice = associatedInvoice;
    } else {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Check if invoice is draft (payment succeeded but invoice not finalized)
    if (invoice.status === 'draft') {
      console.log(`Invoice ${invoice.id} is in draft status, attempting to finalize...`);
      
      // Try to finalize the invoice if payment succeeded
      try {
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
        console.log(`Invoice ${invoice.id} finalized successfully, status: ${finalizedInvoice.status}`);
        
        // Get payment intent metadata for fee breakdown
        let baseAmount: number | undefined;
        let processingFee: number | undefined;
        
        if (paymentIntentId) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.metadata?.base_amount) {
              baseAmount = parseInt(paymentIntent.metadata.base_amount);
            }
            if (paymentIntent.metadata?.processing_fee) {
              processingFee = parseInt(paymentIntent.metadata.processing_fee);
            }
          } catch (err) {
            console.error('Error fetching payment intent metadata:', err);
          }
        }
        
        // Use amount_due or total instead of amount_paid (since payment was via payment intent)
        const displayAmount = finalizedInvoice.amount_due || finalizedInvoice.total || finalizedInvoice.amount_paid;

        return NextResponse.json({
          invoiceId: finalizedInvoice.id,
          invoicePdf: finalizedInvoice.invoice_pdf,
          hostedInvoiceUrl: finalizedInvoice.hosted_invoice_url,
          status: finalizedInvoice.status,
          amountPaid: displayAmount,
          currency: finalizedInvoice.currency,
          customerEmail: finalizedInvoice.customer_email,
          created: finalizedInvoice.created,
          baseAmount,
          processingFee,
        });
      } catch (err) {
        console.error('Error finalizing invoice:', err);
        
        // Check if the invoice has any line items
        if (invoice.lines?.data.length === 0) {
          console.error('Invoice has no line items, cannot finalize');
          return NextResponse.json(
            { error: 'Invoice is not ready yet. Please wait a moment and refresh.' },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { error: 'Invoice is not ready yet. Please wait a moment and refresh.' },
          { status: 400 }
        );
      }
    }

    // Handle open status (invoice is finalized but not yet marked as paid)
    if (invoice.status === 'open') {
      console.log(`Invoice ${invoice.id} is in open status, payment succeeded via payment intent`);
      
      // Get payment intent metadata for fee breakdown
      let baseAmount: number | undefined;
      let processingFee: number | undefined;
      
      if (paymentIntentId) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          if (paymentIntent.metadata?.base_amount) {
            baseAmount = parseInt(paymentIntent.metadata.base_amount);
          }
          if (paymentIntent.metadata?.processing_fee) {
            processingFee = parseInt(paymentIntent.metadata.processing_fee);
          }
        } catch (err) {
          console.error('Error fetching payment intent metadata:', err);
        }
      }
      
      // Use amount_due or total for open invoices
      const displayAmount = invoice.amount_due || invoice.total || invoice.amount_paid;

      return NextResponse.json({
        invoiceId: invoice.id,
        invoicePdf: invoice.invoice_pdf,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        status: invoice.status,
        amountPaid: displayAmount,
        currency: invoice.currency,
        customerEmail: invoice.customer_email,
        created: invoice.created,
        baseAmount,
        processingFee,
      });
    }

    // If invoice is not paid, return error
    if (invoice.status !== 'paid') {
      return NextResponse.json(
        { error: 'Invoice is not paid yet' },
        { status: 400 }
      );
    }

    // Get payment intent metadata for fee breakdown
    let baseAmount: number | undefined;
    let processingFee: number | undefined;
    
    if (paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.metadata?.base_amount) {
          baseAmount = parseInt(paymentIntent.metadata.base_amount);
        }
        if (paymentIntent.metadata?.processing_fee) {
          processingFee = parseInt(paymentIntent.metadata.processing_fee);
        }
      } catch (err) {
        console.error('Error fetching payment intent metadata:', err);
      }
    }

    // Use amount_due or total instead of amount_paid (since payment was via payment intent)
    const displayAmount = invoice.amount_due || invoice.total || invoice.amount_paid;

    return NextResponse.json({
      invoiceId: invoice.id,
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      status: invoice.status,
      amountPaid: displayAmount,
      currency: invoice.currency,
      customerEmail: invoice.customer_email,
      created: invoice.created,
      baseAmount,
      processingFee,
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      if (error.type === 'StripeInvalidRequestError') {
        return NextResponse.json(
          { error: 'Invoice not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}
