import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

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
    this.defaultFrom = process.env.SENDGRID_FROM_EMAIL || 'noreply@dubsea.com';
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
      console.log('SendGrid: Preparing email to', options.to);
      console.log('SendGrid: Subject:', options.subject);
      console.log('SendGrid: From:', options.from || this.defaultFrom);
      
      const msg: any = {
        to: options.to,
        from: options.from || this.defaultFrom,
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
      
      const response = await sgMail.send(msg);
      console.log(`SendGrid: Email sent successfully to ${options.to}`, response[0].statusCode);
      return true;
    } catch (error: any) {
      console.error('SendGrid: Error sending email:', error);
      if (error.response) {
        console.error('SendGrid: Response body:', error.response.body);
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
        subject: `Payment Receipt - ${formattedAmount}`,
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
              <img src="https://ecwaaazjeds9odhk.public.blob.vercel-storage.com/LogoDubsea/logopng.png" alt="Dubsea Logo" class="logo">
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
                <p>&copy; ${new Date().getFullYear()} Dubsea Payment Portal. All rights reserved.</p>
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

© ${new Date().getFullYear()} Dubsea Payment Portal. All rights reserved.
    `;
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();
