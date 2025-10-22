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
    this.defaultFrom = process.env.SENDGRID_FROM_EMAIL || 'noreply@cirqley.com';
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
      const response = await sgMail.send(msg);
      console.log(`SendGrid: Email sent successfully to ${options.to}`, response[0].statusCode);
      return true;
    } catch (error) {
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
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #4F46E5;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .details {
              background-color: white;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: bold;
              color: #666;
            }
            .value {
              color: #333;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Received!</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p>Thank you for your payment. Your transaction has been completed successfully.</p>
              
              <div class="details">
                <h3>Payment Details</h3>
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
                '<p><strong>Note:</strong> ACH bank transfers may take 2-3 business days to fully process. You will receive a separate notification if there are any issues with the transfer.</p>' 
                : ''}

              <div class="footer">
                <p>If you have any questions, please contact our support team.</p>
                <p>&copy; ${new Date().getFullYear()} Cirqley Payment Portal. All rights reserved.</p>
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
Dear ${customerName},

Thank you for your payment. Your transaction has been completed successfully.

Payment Details:
- Amount Paid: ${formattedAmount}
- Payment Method: ${paymentMethod}
- Transaction ID: ${paymentIntentId}

A detailed receipt is attached to this email for your records.

${paymentMethod.includes('ACH') ? 'Note: ACH bank transfers may take 2-3 business days to fully process. You will receive a separate notification if there are any issues with the transfer.' : ''}

If you have any questions, please contact our support team.

© ${new Date().getFullYear()} Cirqley Payment Portal. All rights reserved.
    `;
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();
