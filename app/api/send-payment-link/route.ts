import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';
import { EmailTemplates, PaymentLinkEmailData } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      customerEmail, 
      customerName, 
      businessName, 
      amount, 
      currency, 
      paymentUrl, 
      invoiceDescription, 
      invoiceDate,
      expiresAt 
    } = body;

    // Validate required fields
    if (!customerEmail || !customerName || !amount || !currency || !paymentUrl || !invoiceDescription || !invoiceDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Debug: Log the received payment URL
    console.log('Received payment URL:', paymentUrl);
    console.log('URL type:', typeof paymentUrl);
    console.log('URL length:', paymentUrl?.length);
    
    // Ensure URL is properly handled - check for double encoding
    let cleanPaymentUrl = paymentUrl;
    
    // Check if URL is double-encoded
    if (paymentUrl.includes('%25')) {
      console.log('URL appears to be double-encoded, decoding...');
      cleanPaymentUrl = decodeURIComponent(paymentUrl);
    }
    
    console.log('Final URL to use:', cleanPaymentUrl);

    // Prepare email data
    const emailData: PaymentLinkEmailData = {
      customerName,
      customerEmail,
      businessName,
      amount,
      currency,
      paymentUrl: cleanPaymentUrl,
      invoiceDescription,
      invoiceDate,
      expiresAt,
    };

    // Generate email content
    console.log('Email data payment URL:', emailData.paymentUrl);
    const emailHtml = EmailTemplates.generatePaymentLinkHtml(emailData);
    const emailText = EmailTemplates.generatePaymentLinkText(emailData);
    
    // Debug: Check if URL is corrupted in email content
    console.log('Email HTML contains original URL:', emailHtml.includes(paymentUrl));
    console.log('Email HTML contains clean URL:', emailHtml.includes(cleanPaymentUrl));
    console.log('Email text contains original URL:', emailText.includes(paymentUrl));
    console.log('Email text contains clean URL:', emailText.includes(cleanPaymentUrl));
    
    // Extract URL from email content to check for corruption
    const urlInHtml = emailHtml.match(/href="([^"]+)"/);
    if (urlInHtml) {
      console.log('URL found in HTML:', urlInHtml[1]);
      console.log('URL matches original:', urlInHtml[1] === paymentUrl);
      console.log('URL matches clean:', urlInHtml[1] === cleanPaymentUrl);
    }

    // Send email
    const success = await emailService.sendEmail({
      to: customerEmail,
      subject: `Payment Request - ${EmailTemplates['formatAmount'](amount, currency)}`,
      text: emailText,
      html: emailHtml,
    });

    if (success) {
      console.log(`Payment link email sent successfully to ${customerEmail}`);
      return NextResponse.json({ success: true });
    } else {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('Error sending payment link email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send payment link email' 
      },
      { status: 500 }
    );
  }
}
