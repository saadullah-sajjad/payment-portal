import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { ReceiptDocument } from '../app/api/download-receipt/receipt-template';
import Stripe from 'stripe';

interface ReceiptData {
  paymentIntentId: string;
  chargeId: string | null;
  receiptNumber: string | null;
  amount: number;
  currency: string;
  status: string;
  created: number;
  description: string;
  customerName: string;
  customerEmail: string;
  customerAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  } | null;
  metadata: Stripe.Metadata;
  paymentMethod: string;
}

/**
 * Generate a PDF receipt as a Buffer
 * @param receiptData - The receipt data to generate PDF from
 * @returns Buffer containing the PDF
 */
export async function generateReceiptPDF(receiptData: ReceiptData): Promise<Buffer> {
  try {
    // Generate PDF stream
    const pdfStream = await renderToStream(
      <ReceiptDocument data={receiptData} />
    );

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Prepare receipt data from Stripe PaymentIntent
 * @param paymentIntent - Stripe PaymentIntent object
 * @param customer - Stripe Customer object
 * @param latestCharge - Stripe Charge object
 * @returns ReceiptData object
 */
export function prepareReceiptData(
  paymentIntent: Stripe.PaymentIntent,
  customer: Stripe.Customer | null,
  latestCharge: Stripe.Charge | null
): ReceiptData {
  // Determine payment method (matches the logic in download-receipt/route.tsx)
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

  return {
    paymentIntentId: paymentIntent.id,
    chargeId: latestCharge?.id || null,
    receiptNumber: latestCharge?.receipt_number || null,
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
}

