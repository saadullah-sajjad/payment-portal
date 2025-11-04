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
  console.log('\n========== WEBHOOK RECEIVED ==========');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Environment check:');
  console.log('- SENDGRID_API_KEY configured:', !!process.env.SENDGRID_API_KEY);
  console.log('- SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || 'NOT SET');
  console.log('- STRIPE_SECRET_KEY configured:', !!process.env.STRIPE_SECRET_KEY);
  console.log('- STRIPE_WEBHOOK_SECRET configured:', !!webhookSecret);
  console.log('- STRIPE_WEBHOOK_SECRET length:', webhookSecret.length);
  
  try {
    const body = await request.text();
    console.log('Request body length:', body.length);
    
    const signature = request.headers.get('stripe-signature');
    console.log('Stripe signature present:', !!signature);
    console.log('Stripe signature length:', signature?.length || 0);

    if (!signature) {
      console.error('❌ Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      console.log('🔐 Verifying webhook signature...');
      console.log('Using webhook secret (first 10 chars):', webhookSecret.substring(0, 10) + '...');
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Webhook signature verified successfully');
      console.log('Event type:', event.type);
      console.log('Event ID:', event.id);
    } catch (err) {
      console.error('❌ Webhook signature verification failed!');
      console.error('Error:', err instanceof Error ? err.message : String(err));
      console.error('Webhook secret configured:', !!webhookSecret);
      console.error('Webhook secret value (first 20 chars):', webhookSecret.substring(0, 20));
      console.error('\n💡 TIP: Make sure STRIPE_WEBHOOK_SECRET in your .env matches the secret from:');
      console.error('   stripe listen --forward-to localhost:3000/api/webhooks/stripe');
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    console.log('Processing webhook event:', event.type);
    switch (event.type) {
      case 'payment_intent.processing':
        // Handle ACH payment processing status
        const processingPaymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent processing:', processingPaymentIntent.id);
        console.log('Payment method types:', processingPaymentIntent.payment_method_types);
        
        try {
          // Check if this is an ACH payment
          const isACH = processingPaymentIntent.payment_method_types?.includes('us_bank_account') || false;
          
          if (isACH) {
            console.log('ACH payment detected, sending processing email...');
            
            // Retrieve customer details
            let customer: Stripe.Customer | null = null;
            if (processingPaymentIntent.customer && typeof processingPaymentIntent.customer !== 'string') {
              customer = processingPaymentIntent.customer as Stripe.Customer;
            } else if (processingPaymentIntent.customer) {
              customer = await stripe.customers.retrieve(processingPaymentIntent.customer as string) as Stripe.Customer;
            }

            // Only send email if we have customer email
            if (customer && customer.email) {
              console.log('Customer email found:', customer.email);
              console.log('Sending processing email for ACH payment...');
              
              try {
                // Check SendGrid configuration
                if (!process.env.SENDGRID_API_KEY) {
                  throw new Error('SENDGRID_API_KEY is not configured in environment variables');
                }
                if (!process.env.SENDGRID_FROM_EMAIL) {
                  throw new Error('SENDGRID_FROM_EMAIL is not configured in environment variables');
                }

                await emailService.sendProcessingEmail(
                  customer.email,
                  customer.name || 'Valued Customer',
                  processingPaymentIntent.id,
                  processingPaymentIntent.amount,
                  processingPaymentIntent.currency
                );
                
                console.log('✅ ========== PROCESSING EMAIL SENT SUCCESSFULLY ==========');
                console.log(`📧 Processing email sent to: ${customer.email}`);
                console.log(`📄 Payment Intent: ${processingPaymentIntent.id}`);
              } catch (emailSendError) {
                console.error('❌ ========== PROCESSING EMAIL SENDING FAILED ==========');
                console.error('Error type:', emailSendError?.constructor?.name);
                console.error('Error message:', emailSendError instanceof Error ? emailSendError.message : String(emailSendError));
                
                // Check if it's a SendGrid error
                if (emailSendError && typeof emailSendError === 'object' && 'response' in emailSendError) {
                  const sgError = emailSendError as { response: { body: unknown; statusCode: number } };
                  console.error('SendGrid Status Code:', sgError.response?.statusCode);
                  console.error('SendGrid Response Body:', JSON.stringify(sgError.response?.body, null, 2));
                }
                
                if (emailSendError instanceof Error && emailSendError.stack) {
                  console.error('Stack trace:', emailSendError.stack);
                }
              }
            } else {
              console.warn('No customer email found, skipping processing email');
              console.log('Customer object:', customer);
              console.log('Customer email:', customer?.email);
            }
          } else {
            console.log('Non-ACH payment, skipping processing email');
          }
        } catch (emailError) {
          console.error('=== ERROR PROCESSING ACH PROCESSING EMAIL ===');
          console.error('Error type:', emailError?.constructor?.name);
          console.error('Error message:', emailError instanceof Error ? emailError.message : String(emailError));
          console.error('Error stack:', emailError instanceof Error ? emailError.stack : 'No stack trace');
          // Log but don't fail the webhook
        }
        break;

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
              currency: receiptData.currency,
              baseAmount: receiptData.baseAmount,
              processingFee: receiptData.processingFee,
            });

            // Generate PDF
            console.log('Generating PDF...');
            const pdfBuffer = await generateReceiptPDF(receiptData);
            console.log('PDF generated, size:', pdfBuffer.length, 'bytes');

            // Send email with PDF attachment
            console.log('=== EMAIL SENDING START ===');
            console.log('Sending receipt email to:', customer.email);
            console.log('Customer name:', customer.name || 'Valued Customer');
            console.log('Payment intent ID:', paymentIntent.id);
            console.log('PDF buffer size:', pdfBuffer.length, 'bytes');
            console.log('SendGrid API Key configured:', !!process.env.SENDGRID_API_KEY);
            console.log('SendGrid From Email:', process.env.SENDGRID_FROM_EMAIL);
            
            try {
              // Check SendGrid configuration before attempting to send
              if (!process.env.SENDGRID_API_KEY) {
                throw new Error('SENDGRID_API_KEY is not configured in environment variables');
              }
              if (!process.env.SENDGRID_FROM_EMAIL) {
                throw new Error('SENDGRID_FROM_EMAIL is not configured in environment variables');
              }

              await sendReceiptEmail(
                customer.email,
                customer.name || 'Valued Customer',
                paymentIntent.id,
                pdfBuffer,
                receiptData.paymentMethod,
                paymentIntent.amount,
                paymentIntent.currency
              );
              console.log('✅ ========== EMAIL SENT SUCCESSFULLY ==========');
              console.log(`📧 Receipt sent to: ${customer.email}`);
              console.log(`📄 Payment Intent: ${paymentIntent.id}`);
            } catch (emailSendError) {
              console.error('❌ ========== EMAIL SENDING FAILED ==========');
              console.error('Error type:', emailSendError?.constructor?.name);
              console.error('Error message:', emailSendError instanceof Error ? emailSendError.message : String(emailSendError));
              
              // Check if it's a SendGrid error
              if (emailSendError && typeof emailSendError === 'object' && 'response' in emailSendError) {
                const sgError = emailSendError as { response: { body: unknown; statusCode: number } };
                console.error('SendGrid Status Code:', sgError.response?.statusCode);
                console.error('SendGrid Response Body:', JSON.stringify(sgError.response?.body, null, 2));
              }
              
              if (emailSendError instanceof Error && emailSendError.stack) {
                console.error('Stack trace:', emailSendError.stack);
              }
              
              console.error('\n💡 TROUBLESHOOTING:');
              console.error('1. Check that SENDGRID_API_KEY is set in your .env file');
              console.error('2. Check that SENDGRID_FROM_EMAIL is set and verified in SendGrid');
              console.error('3. Verify your SendGrid API key is valid');
              console.error('4. Check SendGrid dashboard for any account issues');
              
              // Re-throw to ensure we see the error in logs
              throw emailSendError;
            }
          } else {
            console.warn('No customer email found, skipping receipt email');
            console.log('Customer object:', customer);
            console.log('Customer email:', customer?.email);
            console.log('Customer ID:', paymentIntent.customer);
          }
        } catch (emailError) {
          console.error('=== ERROR PROCESSING PAYMENT SUCCESS EMAIL ===');
          console.error('Error type:', emailError?.constructor?.name);
          console.error('Error message:', emailError instanceof Error ? emailError.message : String(emailError));
          console.error('Error stack:', emailError instanceof Error ? emailError.stack : 'No stack trace');
          // Log but don't fail the webhook - payment still succeeded
          // This ensures Stripe doesn't retry the webhook unnecessarily
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

    console.log('=== WEBHOOK SUCCESS ===');
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('=== WEBHOOK ERROR ===');
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
