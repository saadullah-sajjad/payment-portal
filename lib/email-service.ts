import sgMail from '@sendgrid/mail';

// Initialize SendGrid with validation
const sendGridApiKey = process.env.SENDGRID_API_KEY;
if (!sendGridApiKey) {
  console.error('SENDGRID_API_KEY environment variable is not set');
} else {
  console.log('SendGrid API key configured:', sendGridApiKey.substring(0, 10) + '...');
  sgMail.setApiKey(sendGridApiKey);
}

export interface EmailAttachment {
  content: string; // base64 encoded content
  filename: string;
  type?: string;
  disposition?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachment?: EmailAttachment;
  from?: string;
}

export class EmailService {
  private static instance: EmailService;
  private defaultFrom: string;

  private constructor() {
    // Use sender name format: "Name" <email@domain.com>
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@dubsea.com';
    this.defaultFrom = `Dubsea Networks <${fromEmail}>`;
    console.log('Email service initialized with from address:', this.defaultFrom);
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send email using SendGrid
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Validate environment variables
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SENDGRID_API_KEY environment variable is not configured');
      }
      
      console.log('SendGrid: Preparing email to', options.to);
      console.log('SendGrid: Subject:', options.subject);
      console.log('SendGrid: From:', options.from || this.defaultFrom);
      console.log('SendGrid: API Key configured:', !!process.env.SENDGRID_API_KEY);
      
      const msg: {
        to: string;
        from: string;
        replyTo?: string;
        subject: string;
        text: string;
        html: string;
        content_type: string;
        attachments?: Array<{
          content: string;
          filename: string;
          type: string;
          disposition: string;
        }>;
      } = {
        to: options.to,
        from: options.from || this.defaultFrom,
        replyTo: process.env.SENDGRID_REPLY_TO || process.env.SENDGRID_FROM_EMAIL || 'contact@dubsea.com',
        subject: options.subject,
        text: options.text || '',
        html: options.html || '',
        content_type: 'text/html; charset=utf-8',
      };

      // Add attachment if provided
      if (options.attachment) {
        console.log('SendGrid: Adding attachment:', options.attachment.filename);
        msg.attachments = [
          {
            content: options.attachment.content,
            filename: options.attachment.filename,
            type: options.attachment.type || 'application/pdf',
            disposition: options.attachment.disposition || 'attachment',
          },
        ];
      }

      console.log('SendGrid: Sending email...');
      console.log('SendGrid: Email HTML length:', options.html?.length);
      console.log('SendGrid: Email text length:', options.text?.length);
      
      // Check if URL is in the email content
      if (options.html && options.html.includes('http')) {
        const urlMatch = options.html.match(/href="([^"]+)"/);
        if (urlMatch) {
          console.log('SendGrid: URL found in HTML:', urlMatch[1]);
          console.log('SendGrid: URL contains special chars:', /[^\x00-\x7F]/.test(urlMatch[1]));
          console.log('SendGrid: URL length:', urlMatch[1].length);
        }
      }
      
      console.log('SendGrid: Sending email...');
      const response = await sgMail.send(msg);
      console.log(`SendGrid: Email sent successfully to ${options.to}`, response[0].statusCode);
      console.log('SendGrid: Response headers:', response[0].headers);
      return true;
    } catch (error: unknown) {
      console.error('SendGrid: Error sending email:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const errorWithResponse = error as { response: { body: unknown } };
        console.error('SendGrid: Response body:', errorWithResponse.response.body);
      }
      if (error && typeof error === 'object' && 'message' in error) {
        console.error('SendGrid: Error message:', (error as { message: string }).message);
      }
      throw error;
    }
  }

  /**
   * Send receipt email with PDF attachment
   */
  async sendReceiptEmail(
    customerEmail: string,
    customerName: string,
    paymentIntentId: string,
    pdfBuffer: Buffer,
    paymentMethod: string,
    amount: number,
    currency: string
  ): Promise<boolean> {
    try {
      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
      }).format(amount / 100);

      const emailHtml = this.generateReceiptHtml(
        customerName,
        formattedAmount,
        paymentMethod,
        paymentIntentId
      );

      const emailText = this.generateReceiptText(
        customerName,
        formattedAmount,
        paymentMethod,
        paymentIntentId
      );

      // Convert PDF buffer to base64
      const pdfBase64 = pdfBuffer.toString('base64');

      return await this.sendEmail({
        to: customerEmail,
        subject: `Dubsea Payment Receipt - ${formattedAmount}`,
        text: emailText,
        html: emailHtml,
        attachment: {
          content: pdfBase64,
          filename: `receipt-${paymentIntentId}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      });
    } catch (error) {
      console.error('Error sending receipt email:', error);
      throw error;
    }
  }

  /**
   * Generate HTML content for receipt email
   */
  private generateReceiptHtml(
    customerName: string,
    formattedAmount: string,
    paymentMethod: string,
    paymentIntentId: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #1F2937;
              margin: 0;
              padding: 0;
              background-color: #F9FAFB;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 0;
            }
            .header {
              background: linear-gradient(135deg, #1F2937 0%, #374151 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              border-radius: 12px 12px 0 0;
            }
            .logo {
              max-width: 120px;
              height: auto;
              margin-bottom: 20px;
              border-radius: 12px;
            }
            .content {
              background-color: #FFFFFF;
              padding: 40px 30px;
              border-radius: 0 0 12px 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .success-badge {
              background: linear-gradient(135deg, #10B981 0%, #059669 100%);
              color: white;
              padding: 12px 24px;
              border-radius: 50px;
              display: inline-block;
              font-weight: 600;
              font-size: 14px;
              margin-bottom: 30px;
            }
            .amount-highlight {
              background: linear-gradient(135deg, #1F2937 0%, #374151 100%);
              border-radius: 16px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            }
            .amount-value {
              font-size: 2.5rem;
              font-weight: 700;
              color: #FFFFFF;
              margin: 0;
              letter-spacing: -0.025em;
            }
            .amount-label {
              color: #D1D5DB;
              font-size: 1.1rem;
              margin: 8px 0 0 0;
              font-weight: 500;
            }
            .details {
              background-color: #F9FAFB;
              padding: 30px;
              border-radius: 12px;
              margin: 30px 0;
              border: 1px solid #E5E7EB;
            }
            .details h3 {
              margin: 0 0 20px 0;
              color: #1F2937;
              font-size: 1.2rem;
              font-weight: 600;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 16px 0;
              border-bottom: 1px solid #E5E7EB;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #6B7280;
              font-size: 14px;
            }
            .value {
              color: #1F2937;
              font-weight: 500;
              font-size: 14px;
            }
            .note {
              background-color: #F0FDF4;
              border: 1px solid #BBF7D0;
              border-radius: 12px;
              padding: 20px;
              margin: 30px 0;
            }
            .note h4 {
              color: #166534;
              margin: 0 0 8px 0;
              font-size: 1rem;
              font-weight: 600;
            }
            .note p {
              color: #166534;
              margin: 0;
              font-size: 0.95rem;
              line-height: 1.5;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              color: #6B7280;
              font-size: 14px;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <img src="https://ecwaaazjeds9odhk.public.blob.vercel-storage.com/LogoDubsea/logo.png" alt="Dubsea Logo" class="logo" style="max-width: 120px; height: auto; border-radius: 12px; display: block; width: 120px; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;">
                  </td>
                </tr>
              </table>
              <h1 style="margin: 0; font-size: 1.8rem; font-weight: 600;">Payment Received!</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 1rem;">Your transaction has been completed successfully</p>
            </div>
            
            <div class="content">
              <div class="success-badge">✓ Payment Successful</div>
              
              <p>Dear ${customerName},</p>
              <p>Thank you for your payment. Your transaction has been completed successfully and your receipt is attached to this email.</p>
              
              <div class="amount-highlight">
                <p class="amount-value">${formattedAmount}</p>
                <p class="amount-label">Amount Paid</p>
              </div>
              
              <div class="details">
                <h3>Transaction Details</h3>
                <div class="detail-row">
                  <span class="label">Amount Paid:</span>
                  <span class="value">${formattedAmount}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Payment Method:</span>
                  <span class="value">${paymentMethod}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Transaction ID:</span>
                  <span class="value">${paymentIntentId}</span>
                </div>
              </div>

              <p>A detailed receipt is attached to this email for your records.</p>
              
              ${paymentMethod.includes('ACH') ? 
                `<div class="note">
                  <h4>Processing Information</h4>
                  <p>ACH bank transfers may take 2-3 business days to fully process. You will receive a separate notification if there are any issues with the transfer.</p>
                </div>` 
                : ''}

              <div class="footer">
                <p>If you have any questions, please contact our support team.</p>
                <p>&copy; ${new Date().getFullYear()} Dubsea Networks. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate text content for receipt email
   */
  private generateReceiptText(
    customerName: string,
    formattedAmount: string,
    paymentMethod: string,
    paymentIntentId: string
  ): string {
    return `
PAYMENT RECEIVED - ${formattedAmount}

Dear ${customerName},

✓ Payment Successful! Your transaction has been completed successfully.

Amount Paid: ${formattedAmount}

Transaction Details:
- Amount Paid: ${formattedAmount}
- Payment Method: ${paymentMethod}
- Transaction ID: ${paymentIntentId}

A detailed receipt is attached to this email for your records.

${paymentMethod.includes('ACH') ? 'Processing Information: ACH bank transfers may take 2-3 business days to fully process. You will receive a separate notification if there are any issues with the transfer.' : ''}

If you have any questions, please contact our support team.

© ${new Date().getFullYear()} Dubsea Networks. All rights reserved.
    `;
  }

  /**
   * Format amount for display
   */
  private formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }

  /**
   * Send payment processing email (for ACH payments)
   */
  async sendProcessingEmail(
    customerEmail: string,
    customerName: string,
    paymentIntentId: string,
    amount: number,
    currency: string
  ): Promise<boolean> {
    const formattedAmount = this.formatAmount(amount, currency);
    const html = this.generateProcessingHtml(customerName, formattedAmount, paymentIntentId);
    const text = this.generateProcessingText(customerName, formattedAmount, paymentIntentId);

    return this.sendEmail({
      to: customerEmail,
      subject: `Your ACH payment is being processed - ${formattedAmount}`,
      text,
      html,
    });
  }

  /**
   * Generate HTML content for processing email
   */
  private generateProcessingHtml(
    customerName: string,
    formattedAmount: string,
    paymentIntentId: string
  ): string {
    const formatDate = (timestamp: number) => {
      const date = new Date(timestamp * 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'America/Los_Angeles'
      });
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="light dark">
          <meta name="supported-color-schemes" content="light dark">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #1F2937;
              margin: 0;
              padding: 0;
              background-color: #F9FAFB;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 0;
            }
            .header {
              background: linear-gradient(135deg, #1F2937 0%, #374151 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              border-radius: 12px 12px 0 0;
            }
            .logo {
              max-width: 120px;
              height: auto;
              margin-bottom: 20px;
              border-radius: 12px;
            }
            .content {
              background-color: #FFFFFF;
              padding: 40px 30px;
              border-radius: 0 0 12px 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .processing-badge {
              background: linear-gradient(135deg, #1F2937 0%, #374151 100%);
              color: white;
              padding: 12px 24px;
              border-radius: 50px;
              display: inline-block;
              font-weight: 600;
              font-size: 14px;
              margin-bottom: 30px;
            }
            .amount-highlight {
              background: linear-gradient(135deg, #1F2937 0%, #374151 100%);
              border-radius: 16px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            }
            .amount-value {
              font-size: 2.5rem;
              font-weight: 700;
              color: #FFFFFF;
              margin: 0;
              letter-spacing: -0.025em;
            }
            .amount-label {
              color: #D1D5DB;
              font-size: 1.1rem;
              margin: 8px 0 0 0;
              font-weight: 500;
            }
            .details {
              background-color: #F9FAFB;
              padding: 30px;
              border-radius: 12px;
              margin: 30px 0;
              border: 1px solid #E5E7EB;
            }
            .details h3 {
              margin: 0 0 20px 0;
              color: #1F2937;
              font-size: 1.2rem;
              font-weight: 600;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 16px 0;
              border-bottom: 1px solid #E5E7EB;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #6B7280;
              font-size: 14px;
            }
            .value {
              color: #1F2937;
              font-weight: 500;
              font-size: 14px;
            }
            .note {
              background-color: #F9FAFB;
              border: 1px solid #E5E7EB;
              border-radius: 12px;
              padding: 20px;
              margin: 30px 0;
            }
            .note h4 {
              color: #1F2937;
              margin: 0 0 8px 0;
              font-size: 1rem;
              font-weight: 600;
            }
            .note p {
              color: #6B7280;
              margin: 0;
              font-size: 0.95rem;
              line-height: 1.5;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              color: #6B7280;
              font-size: 14px;
              line-height: 1.6;
            }
            @media (prefers-color-scheme: dark) {
              body {
                background-color: #111827;
                color: #F9FAFB;
              }
              .content {
                background-color: #1F2937;
                color: #F9FAFB;
              }
              .details {
                background-color: #374151;
                border-color: #4B5563;
              }
              .label {
                color: #9CA3AF;
              }
              .value {
                color: #F9FAFB;
              }
            }
            @media only screen and (max-width: 600px) {
              .container {
                width: 100% !important;
                padding: 0 !important;
              }
              .header, .content {
                padding: 20px !important;
              }
              .amount-value {
                font-size: 2rem !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <img src="https://ecwaaazjeds9odhk.public.blob.vercel-storage.com/LogoDubsea/logo.png" alt="Dubsea Logo" class="logo" style="max-width: 120px; height: auto; border-radius: 12px; display: block; width: 120px; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;">
                  </td>
                </tr>
              </table>
              <h1 style="margin: 0; font-size: 1.8rem; font-weight: 600;">Payment Processing</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 1rem;">Your ACH payment is being processed</p>
            </div>
            
            <div class="content">
              <div class="processing-badge">⏳ Payment Processing</div>
              
              <p>Dear ${customerName},</p>
              <p>We've received your ACH payment request and it's currently being processed. Your payment will typically complete within 1-3 business days.</p>
              
              <div class="amount-highlight">
                <p class="amount-value">${formattedAmount}</p>
                <p class="amount-label">Amount Processing</p>
              </div>
              
              <div class="details">
                <h3>Transaction Details</h3>
                <div class="detail-row">
                  <span class="label">Amount:</span>
                  <span class="value">${formattedAmount}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Payment Method:</span>
                  <span class="value">ACH Bank Transfer</span>
                </div>
                <div class="detail-row">
                  <span class="label">Transaction ID:</span>
                  <span class="value">${paymentIntentId}</span>
                </div>
              </div>

              <div class="note">
                <h4>⏳ Processing Timeline</h4>
                <p>ACH bank transfers typically take 1-3 business days to complete. You will receive a confirmation email with your receipt once the payment has been successfully processed. If there are any issues with the transfer, we'll notify you immediately.</p>
              </div>
              
              <div class="footer">
                <p>If you have any questions, please contact our support team.</p>
                <p>&copy; ${new Date().getFullYear()} Dubsea Networks. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate text content for processing email
   */
  private generateProcessingText(
    customerName: string,
    formattedAmount: string,
    paymentIntentId: string
  ): string {
    return `
PAYMENT PROCESSING - ${formattedAmount}

Dear ${customerName},

⏳ Payment Processing - We've received your ACH payment request and it's currently being processed.

Amount: ${formattedAmount}
Payment Method: ACH Bank Transfer
Transaction ID: ${paymentIntentId}

Processing Timeline:
ACH bank transfers typically take 1-3 business days to complete. You will receive a confirmation email with your receipt once the payment has been successfully processed. If there are any issues with the transfer, we'll notify you immediately.

If you have any questions, please contact our support team.

© ${new Date().getFullYear()} Dubsea Networks. All rights reserved.
    `;
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();
              // <img src="https://ecwaaazjeds9odhk.public.blob.vercel-storage.com/LogoDubsea/logopng.png" alt="Dubsea Logo" class="logo">
