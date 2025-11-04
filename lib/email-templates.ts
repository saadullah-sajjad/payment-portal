export interface PaymentLinkEmailData {
  customerName: string;
  customerEmail: string;
  businessName?: string;
  amount: string;
  currency: string;
  paymentUrl: string;
  invoiceDescription: string;
  invoiceDate: string;
  expiresAt?: string;
}

export interface PaymentFailedEmailData {
  customerName: string;
  customerEmail: string;
  amount: string;
  currency: string;
  paymentIntentId: string;
  failureReason?: string;
  paymentMethod?: string;
  retryUrl?: string;
}

export class EmailTemplates {
  /**
   * Generate payment link email HTML
   */
  static generatePaymentLinkHtml(data: PaymentLinkEmailData): string {
    const formattedAmount = this.formatAmount(data.amount, data.currency);
    const safePaymentUrl = data.paymentUrl.replace(/&/g, '&amp;');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1F2937; margin: 0; padding: 20px; background-color: #F9FAFB;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #F9FAFB;">
            <tr>
              <td>
                <!-- Header -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #1F2937; border-radius: 12px 12px 0 0;">
                  <tr>
                    <td style="padding: 40px 30px; text-align: center;">
                      <img src="https://ecwaaazjeds9odhk.public.blob.vercel-storage.com/LogoDubsea/logo.png" alt="Dubsea Logo" style="max-width: 120px; height: auto; border-radius: 12px; display: block; margin: 0 auto 20px auto; border: 0;">
                      <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #FFFFFF;">Payment Request</h1>
                      <p style="margin: 8px 0 0 0; font-size: 16px; color: #E5E7EB;">You have a new invoice to pay</p>
                    </td>
                  </tr>
                </table>
                
                <!-- Content -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FFFFFF; border-radius: 0 0 12px 12px;">
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 16px 0; font-size: 16px; color: #1F2937;">Dear ${data.customerName},</p>
                      <p style="margin: 0 0 24px 0; font-size: 16px; color: #1F2937;">You have received a payment request for the following invoice:</p>
                      
                      <!-- Amount Highlight -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #1F2937; border-radius: 12px; margin: 30px 0;">
                        <tr>
                          <td style="padding: 40px 30px; text-align: center;">
                            <p style="margin: 0; font-size: 48px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.025em;">${formattedAmount}</p>
                            <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: 500; color: #D1D5DB;">Amount Due</p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Invoice Details -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F9FAFB; border-radius: 12px; border: 1px solid #E5E7EB; margin: 30px 0;">
                        <tr>
                          <td style="padding: 30px;">
                            <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #111827;">Invoice Details</h3>
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                      <td style="font-weight: 600; color: #6B7280; font-size: 14px; padding-bottom: 4px;">Description:</td>
                                    </tr>
                                    <tr>
                                      <td style="color: #1F2937; font-weight: 500; font-size: 14px;">${data.invoiceDescription}</td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                      <td style="font-weight: 600; color: #6B7280; font-size: 14px; padding-bottom: 4px;">Invoice Date:</td>
                                    </tr>
                                    <tr>
                                      <td style="color: #1F2937; font-weight: 500; font-size: 14px;">${this.formatDate(data.invoiceDate)}</td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; ${data.businessName ? 'border-bottom: 1px solid #E5E7EB;' : ''}">
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                      <td style="font-weight: 600; color: #6B7280; font-size: 14px; padding-bottom: 4px;">Amount:</td>
                                    </tr>
                                    <tr>
                                      <td style="color: #1F2937; font-weight: 500; font-size: 14px;">${formattedAmount}</td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              ${data.businessName ? `
                              <tr>
                                <td style="padding: 12px 0;">
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                      <td style="font-weight: 600; color: #6B7280; font-size: 14px; padding-bottom: 4px;">Business:</td>
                                    </tr>
                                    <tr>
                                      <td style="color: #1F2937; font-weight: 500; font-size: 14px;">${data.businessName}</td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              ` : ''}
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Payment Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td style="background-color: #1F2937; border-radius: 12px; text-align: center;">
                                  <a href="${safePaymentUrl}" style="display: inline-block; background-color: #1F2937; color: #FFFFFF; padding: 20px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 18px; border: 0;">
                                    Pay ${formattedAmount} Now
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top: 20px; text-align: center;">
                            <p style="margin: 0 0 8px 0; font-size: 12px; color: #9CA3AF;">If the button doesn't work, copy and paste this link into your browser:</p>
                            <p style="margin: 0; font-size: 11px; color: #6B7280; background-color: #F9FAFB; padding: 10px; border-radius: 6px; font-family: 'Courier New', monospace; word-break: break-all;">${data.paymentUrl}</p>
                          </td>
                        </tr>
                      </table>
                      
                      ${data.expiresAt ? `
                      <!-- Expiry Notice -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 12px; margin: 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #DC2626;">⚠️ Payment Expires Soon</h4>
                            <p style="margin: 0; font-size: 15px; color: #DC2626; line-height: 1.5;">This payment link expires on ${this.formatDate(data.expiresAt)}. Please complete your payment before then.</p>
                          </td>
                        </tr>
                      </table>
                      ` : ''}
                      
                      <!-- Security Note -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; margin: 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #166534;">🔐 Secure Payment</h4>
                            <p style="margin: 0; font-size: 15px; color: #166534; line-height: 1.5;">This payment is processed securely through Stripe. Your payment information is encrypted and protected.</p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Payment Methods -->
                      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1F2937;">Payment Methods Accepted:</p>
                      <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 15px; color: #1F2937;">
                        <li style="margin-bottom: 8px;">💳 Credit/Debit Cards (Visa, MasterCard, AmEx) - 3% processing fee</li>
                        <li style="margin-bottom: 8px;">🏦 ACH Bank Transfer - 0.8% processing fee (max $5)</li>
                      </ul>
                      
                      <p style="margin: 0; font-size: 16px; color: #1F2937;">If you have any questions about this payment, please contact us directly.</p>
                      
                      <!-- Footer -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 40px; border-top: 1px solid #E5E7EB; padding-top: 20px;">
                        <tr>
                          <td style="text-align: center;">
                            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B7280;">This is an automated payment request. Please do not reply to this email.</p>
                            <p style="margin: 0; font-size: 14px; color: #6B7280;">&copy; ${new Date().getFullYear()} Dubsea Networks. All rights reserved.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  /**
   * Generate payment link email text
   */
  static generatePaymentLinkText(data: PaymentLinkEmailData): string {
    const formattedAmount = this.formatAmount(data.amount, data.currency);
    
    return `
Payment Request - ${formattedAmount}

Dear ${data.customerName},

You have received a payment request for the following invoice:

Amount Due: ${formattedAmount}
Description: ${data.invoiceDescription}
Invoice Date: ${this.formatDate(data.invoiceDate)}
${data.businessName ? `Business: ${data.businessName}` : ''}

To pay securely, click the link below:
${data.paymentUrl}

Or copy and paste this URL into your browser:
${data.paymentUrl}

💳 PAY NOW: ${data.paymentUrl}

${data.expiresAt ? `\n⚠️ IMPORTANT: This payment link expires on ${this.formatDate(data.expiresAt)}. Please complete your payment before then.\n` : ''}

Payment Methods Accepted:
- Credit/Debit Cards (Visa, MasterCard, AmEx) - 3% processing fee
- ACH Bank Transfer - 0.8% processing fee (max $5)

This payment is processed securely through Stripe. Your payment information is encrypted and protected.

If you have any questions about this payment, please contact us directly.

This is an automated payment request. Please do not reply to this email.

&copy; ${new Date().getFullYear()} Dubsea Networks. All rights reserved.
    `.trim();
  }

  /**
   * Generate payment failed email HTML
   */
  static generatePaymentFailedHtml(data: PaymentFailedEmailData): string {
    const formattedAmount = this.formatAmount(data.amount, data.currency);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1F2937; margin: 0; padding: 20px; background-color: #F9FAFB;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #F9FAFB;">
            <tr>
              <td>
                <!-- Header -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #1F2937; border-radius: 12px 12px 0 0;">
                  <tr>
                    <td style="padding: 40px 30px; text-align: center;">
                      <img src="https://ecwaaazjeds9odhk.public.blob.vercel-storage.com/LogoDubsea/logo.png" alt="Dubsea Logo" style="max-width: 120px; height: auto; border-radius: 12px; display: block; margin: 0 auto 20px auto; border: 0;">
                      <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #FFFFFF;">Payment Failed</h1>
                      <p style="margin: 8px 0 0 0; font-size: 16px; color: #E5E7EB;">Your payment could not be processed</p>
                    </td>
                  </tr>
                </table>
                
                <!-- Content -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FFFFFF; border-radius: 0 0 12px 12px;">
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 16px 0; font-size: 16px; color: #1F2937;">Dear ${data.customerName},</p>
                      <p style="margin: 0 0 24px 0; font-size: 16px; color: #1F2937;">We're sorry to inform you that your recent payment attempt was unsuccessful.</p>
                      
                      <!-- Amount Highlight -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #1F2937; border-radius: 12px; margin: 30px 0;">
                        <tr>
                          <td style="padding: 40px 30px; text-align: center;">
                            <p style="margin: 0; font-size: 48px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.025em;">${formattedAmount}</p>
                            <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: 500; color: #D1D5DB;">Payment Failed</p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Failure Details -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F9FAFB; border-radius: 12px; border: 1px solid #E5E7EB; margin: 30px 0;">
                        <tr>
                          <td style="padding: 30px;">
                            <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #111827;">Failure Details</h3>
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              ${data.failureReason ? `
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                      <td style="font-weight: 600; color: #6B7280; font-size: 14px; padding-bottom: 4px;">Reason:</td>
                                    </tr>
                                    <tr>
                                      <td style="color: #1F2937; font-weight: 500; font-size: 14px;">${data.failureReason}</td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              ` : ''}
                              ${data.paymentMethod ? `
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                      <td style="font-weight: 600; color: #6B7280; font-size: 14px; padding-bottom: 4px;">Payment Method:</td>
                                    </tr>
                                    <tr>
                                      <td style="color: #1F2937; font-weight: 500; font-size: 14px;">${data.paymentMethod}</td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              ` : ''}
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                      <td style="font-weight: 600; color: #6B7280; font-size: 14px; padding-bottom: 4px;">Amount:</td>
                                    </tr>
                                    <tr>
                                      <td style="color: #1F2937; font-weight: 500; font-size: 14px;">${formattedAmount}</td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0;">
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                      <td style="font-weight: 600; color: #6B7280; font-size: 14px; padding-bottom: 4px;">Transaction ID:</td>
                                    </tr>
                                    <tr>
                                      <td style="color: #1F2937; font-weight: 500; font-size: 11px; font-family: 'Courier New', monospace;">${data.paymentIntentId}</td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      ${data.retryUrl ? `
                      <!-- Retry Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td style="background-color: #1F2937; border-radius: 12px; text-align: center;">
                                  <a href="${data.retryUrl}" style="display: inline-block; background-color: #1F2937; color: #FFFFFF; padding: 20px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 18px; border: 0;">
                                    Retry Payment
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      ` : ''}
                      
                      <!-- What to do next -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; margin: 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1E40AF;">What to Do Next</h4>
                            <p style="margin: 0 0 12px 0; font-size: 15px; color: #1E3A8A; line-height: 1.5;">Common reasons for payment failure:</p>
                            <ul style="margin: 0; padding-left: 20px; font-size: 15px; color: #1E3A8A;">
                              <li style="margin-bottom: 8px;">Insufficient funds in your account</li>
                              <li style="margin-bottom: 8px;">Incorrect card or account details</li>
                              <li style="margin-bottom: 8px;">Card expired or blocked by your bank</li>
                              <li style="margin-bottom: 8px;">Payment declined by your financial institution</li>
                            </ul>
                            <p style="margin: 12px 0 0 0; font-size: 15px; color: #1E3A8A; line-height: 1.5;">Please check with your bank or try a different payment method.</p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Support Note -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; margin: 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #166534;">Need Help?</h4>
                            <p style="margin: 0; font-size: 15px; color: #166534; line-height: 1.5;">If you continue to experience issues or have questions about this payment, please contact us directly. We're here to help!</p>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0; font-size: 16px; color: #1F2937;">Thank you for your understanding.</p>
                      
                      <!-- Footer -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 40px; border-top: 1px solid #E5E7EB; padding-top: 20px;">
                        <tr>
                          <td style="text-align: center;">
                            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B7280;">This is an automated payment notification. Please do not reply to this email.</p>
                            <p style="margin: 0; font-size: 14px; color: #6B7280;">&copy; ${new Date().getFullYear()} Dubsea Networks. All rights reserved.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  /**
   * Generate payment failed email text
   */
  static generatePaymentFailedText(data: PaymentFailedEmailData): string {
    const formattedAmount = this.formatAmount(data.amount, data.currency);
    
    return `
Payment Failed - ${formattedAmount}

Dear ${data.customerName},

We're sorry to inform you that your recent payment attempt was unsuccessful.

PAYMENT FAILED: ${formattedAmount}

Failure Details:
${data.failureReason ? `Reason: ${data.failureReason}` : ''}
${data.paymentMethod ? `Payment Method: ${data.paymentMethod}` : ''}
Amount: ${formattedAmount}
Transaction ID: ${data.paymentIntentId}

${data.retryUrl ? `\nTo retry your payment, visit:\n${data.retryUrl}\n` : ''}

WHAT TO DO NEXT

Common reasons for payment failure:
- Insufficient funds in your account
- Incorrect card or account details
- Card expired or blocked by your bank
- Payment declined by your financial institution

Please check with your bank or try a different payment method.

Need Help?
If you continue to experience issues or have questions about this payment, please contact us directly. We're here to help!

Thank you for your understanding.

This is an automated payment notification. Please do not reply to this email.

&copy; ${new Date().getFullYear()} Dubsea Networks. All rights reserved.
    `.trim();
  }

  /**
   * Format amount with currency symbol
   */
  private static formatAmount(amount: string, currency: string): string {
    const num = parseInt(amount);
    const amountInDollars = (num / 100).toFixed(2);
    
    const currencySymbols: Record<string, string> = {
      usd: '$',
      eur: '&euro;',
      gbp: '&pound;',
      jpy: '&yen;',
      cad: 'CA$',
      aud: 'A$',
    };
    
    const symbol = currencySymbols[currency.toLowerCase()] || currency.toUpperCase();
    return `${symbol}${amountInDollars}`;
  }

  /**
   * Format date for display
   */
  private static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  }
}