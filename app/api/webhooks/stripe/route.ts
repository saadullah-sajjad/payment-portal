import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { generateReceiptPDF, prepareReceiptData } from '@/lib/pdf-generator';
import { emailService } from '@/lib/email-service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Send email with receipt PDF using SendGrid
 */
async function sendReceiptEmail(
  customerEmail: string,
  customerName: string,
  paymentIntentId: string,
  pdfBuffer: Buffer,
  paymentMethod: string,
  amount: number,
  currency: string
) {
  try {
    await emailService.sendReceiptEmail(
      customerEmail,
      customerName,
      paymentIntentId,
      pdfBuffer,
      paymentMethod,
      amount,
      currency
    );
    
    console.log(`Receipt email sent successfully to ${customerEmail}`);
  } catch (error) {
    console.error('Error sending receipt email:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    console.log('Processing webhook event:', event.type);
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        console.log('Customer:', paymentIntent.customer);
        console.log('Amount:', paymentIntent.amount);
        console.log('Currency:', paymentIntent.currency);
        
        try {
          // Retrieve full payment details with expanded data
          const fullPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id, {
            expand: ['latest_charge', 'customer'],
          });

          // Get customer details
          let customer: Stripe.Customer | null = null;
          if (fullPaymentIntent.customer && typeof fullPaymentIntent.customer !== 'string') {
            customer = fullPaymentIntent.customer as Stripe.Customer;
          } else if (fullPaymentIntent.customer) {
            customer = await stripe.customers.retrieve(fullPaymentIntent.customer as string) as Stripe.Customer;
          }

          // Get charge details
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const latestCharge = (fullPaymentIntent as any).latest_charge as Stripe.Charge | null;

          // Only send email if we have customer email
          if (customer && customer.email) {
            console.log('Customer email found:', customer.email);
            console.log('Customer name:', customer.name || 'Valued Customer');
            
            // Prepare receipt data
            const receiptData = prepareReceiptData(fullPaymentIntent, customer, latestCharge);
            console.log('Receipt data prepared:', {
              paymentMethod: receiptData.paymentMethod,
              amount: receiptData.amount,
              currency: receiptData.currency
            });

            // Generate PDF
            console.log('Generating PDF...');
            const pdfBuffer = await generateReceiptPDF(receiptData);
            console.log('PDF generated, size:', pdfBuffer.length, 'bytes');

            // Send email with PDF attachment
            console.log('Sending receipt email...');
            await sendReceiptEmail(
              customer.email,
              customer.name || 'Valued Customer',
              paymentIntent.id,
              pdfBuffer,
              receiptData.paymentMethod,
              paymentIntent.amount,
              paymentIntent.currency
            );

            console.log(`Payment successful and receipt sent to ${customer.email}`);
          } else {
            console.warn('No customer email found, skipping receipt email');
            console.log('Customer object:', customer);
          }
        } catch (emailError) {
          console.error('Error processing payment success email:', emailError);
          // Don't fail the webhook if email fails - payment still succeeded
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent failed:', failedPayment.id);
        console.log('Failure reason:', failedPayment.last_payment_error?.message);
        
        // TODO: Optionally send failure notification email to customer
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
