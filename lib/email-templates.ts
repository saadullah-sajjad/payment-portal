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
              background-color: #1F2937;
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
            .invoice-details {
              background-color: #F9FAFB;
              padding: 30px;
              border-radius: 12px;
              margin: 30px 0;
              border: 1px solid #E5E7EB;
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
            .amount-highlight {
              background: linear-gradient(135deg, #1F2937 0%, #374151 100%);
              border-radius: 16px;
              padding: 40px 30px;
              text-align: center;
              margin: 30px 0;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            }
            .amount-value {
              font-size: 3rem;
              font-weight: 700;
              color: #FFFFFF;
              margin: 0;
              letter-spacing: -0.025em;
            }
            .amount-label {
              color: #D1D5DB;
              font-size: 1.2rem;
              margin: 8px 0 0 0;
              font-weight: 500;
            }
            .payment-button {
              display: inline-block;
              background: linear-gradient(135deg, #1F2937 0%, #374151 100%);
              color: white;
              padding: 20px 40px;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              font-size: 1.1rem;
              margin: 30px 0;
              text-align: center;
              transition: all 0.3s ease;
              box-shadow: 0 4px 14px 0 rgba(31, 41, 55, 0.3);
              border: none;
              cursor: pointer;
            }
            .payment-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px 0 rgba(31, 41, 55, 0.4);
              background: linear-gradient(135deg, #374151 0%, #4B5563 100%);
            }
            .security-note {
              background-color: #F0FDF4;
              border: 1px solid #BBF7D0;
              border-radius: 12px;
              padding: 20px;
              margin: 30px 0;
            }
            .security-note h4 {
              color: #166534;
              margin: 0 0 12px 0;
              font-size: 1rem;
              font-weight: 600;
            }
            .security-note p {
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
            .expiry-notice {
              background-color: #FEF2F2;
              border: 1px solid #FCA5A5;
              border-radius: 12px;
              padding: 20px;
              margin: 30px 0;
            }
            .expiry-notice h4 {
              color: #DC2626;
              margin: 0 0 12px 0;
              font-size: 1rem;
              font-weight: 600;
            }
            .expiry-notice p {
              color: #DC2626;
              margin: 0;
              font-size: 0.95rem;
              line-height: 1.5;
            }
            @media only screen and (max-width: 600px) {
              .container {
                width: 100% !important;
                max-width: 100% !important;
              }
              .header {
                padding: 30px 20px !important;
                border-radius: 0 !important;
              }
              .logo {
                max-width: 100px !important;
              }
              .content {
                padding: 30px 20px !important;
                border-radius: 0 !important;
              }
              .invoice-details {
                padding: 20px 15px !important;
                margin: 20px 0 !important;
              }
              .detail-row {
                flex-direction: column !important;
                align-items: flex-start !important;
                padding: 12px 0 !important;
              }
              .label {
                margin-bottom: 4px !important;
                font-size: 12px !important;
              }
              .value {
                font-size: 14px !important;
                word-break: break-word !important;
              }
              .amount-highlight {
                padding: 30px 20px !important;
                margin: 20px 0 !important;
                border-radius: 12px !important;
              }
              .amount-value {
                font-size: 2rem !important;
              }
              .amount-label {
                font-size: 1rem !important;
              }
              .payment-button {
                display: block !important;
                width: 100% !important;
                padding: 18px 20px !important;
                font-size: 1rem !important;
                margin: 20px 0 !important;
              }
              .security-note,
              .expiry-notice {
                padding: 15px !important;
                margin: 20px 0 !important;
              }
              .security-note h4,
              .expiry-notice h4 {
                font-size: 0.9rem !important;
              }
              .security-note p,
              .expiry-notice p {
                font-size: 0.85rem !important;
              }
              .footer {
                font-size: 12px !important;
                margin-top: 30px !important;
              }
              h1 {
                font-size: 1.5rem !important;
              }
              p {
                font-size: 14px !important;
              }
              ul {
                padding-left: 20px !important;
              }
              li {
                font-size: 14px !important;
                margin-bottom: 8px !important;
              }
            }
            @media (prefers-color-scheme: dark) {
              body {
                background-color: #111827;
                color: #F9FAFB;
              }
              .container {
                background-color: #111827;
              }
              .header {
                background-color: #1F2937;
                color: #F9FAFB;
              }
              .content {
                background-color: #1F2937;
                color: #F9FAFB;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
              }
              .invoice-details {
                background-color: #374151;
                border-color: #4B5563;
              }
              .detail-row {
                border-bottom-color: #4B5563;
              }
              .label {
                color: #D1D5DB;
              }
              .value {
                color: #F9FAFB;
              }
              .amount-highlight {
                background: linear-gradient(135deg, #374151 0%, #4B5563 100%);
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
              }
              .amount-value {
                color: #FFFFFF;
              }
              .amount-label {
                color: #E5E7EB;
              }
              .payment-button {
                background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
                box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.4);
              }
              .payment-button:hover {
                background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
                box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.5);
              }
              .security-note {
                background-color: #064E3B;
                border-color: #059669;
              }
              .security-note h4 {
                color: #6EE7B7;
              }
              .security-note p {
                color: #A7F3D0;
              }
              .expiry-notice {
                background-color: #7F1D1D;
                border-color: #DC2626;
              }
              .expiry-notice h4 {
                color: #FCA5A5;
              }
              .expiry-notice p {
                color: #FEE2E2;
              }
              .footer {
                color: #9CA3AF;
              }
              p {
                color: #E5E7EB;
              }
              h3 {
                color: #F9FAFB;
              }
              ul {
                color: #E5E7EB;
              }
              li {
                color: #E5E7EB;
              }
            }
            @media only screen and (max-width: 600px) and (prefers-color-scheme: dark) {
              .container {
                width: 100% !important;
                max-width: 100% !important;
              }
              .header {
                padding: 30px 20px !important;
                border-radius: 0 !important;
              }
              .logo {
                max-width: 100px !important;
              }
              .content {
                padding: 30px 20px !important;
                border-radius: 0 !important;
              }
              .invoice-details {
                padding: 20px 15px !important;
                margin: 20px 0 !important;
              }
              .detail-row {
                flex-direction: column !important;
                align-items: flex-start !important;
                padding: 12px 0 !important;
              }
              .label {
                margin-bottom: 4px !important;
                font-size: 12px !important;
              }
              .value {
                font-size: 14px !important;
                word-break: break-word !important;
              }
              .amount-highlight {
                padding: 30px 20px !important;
                margin: 20px 0 !important;
                border-radius: 12px !important;
              }
              .amount-value {
                font-size: 2rem !important;
              }
              .amount-label {
                font-size: 1rem !important;
              }
              .payment-button {
                display: block !important;
                width: 100% !important;
                padding: 18px 20px !important;
                font-size: 1rem !important;
                margin: 20px 0 !important;
              }
              .security-note,
              .expiry-notice {
                padding: 15px !important;
                margin: 20px 0 !important;
              }
              .security-note h4,
              .expiry-notice h4 {
                font-size: 0.9rem !important;
              }
              .security-note p,
              .expiry-notice p {
                font-size: 0.85rem !important;
              }
              .footer {
                font-size: 12px !important;
                margin-top: 30px !important;
              }
              h1 {
                font-size: 1.5rem !important;
              }
              p {
                font-size: 14px !important;
              }
              ul {
                padding-left: 20px !important;
              }
              li {
                font-size: 14px !important;
                margin-bottom: 8px !important;
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
              <h1 style="margin: 0; font-size: 1.8rem; font-weight: 600;">Payment Request</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 1rem;">You have a new invoice to pay</p>
            </div>
            
            <div class="content">
              <p>Dear ${data.customerName},</p>
              <p>You have received a payment request for the following invoice:</p>
              
              <div class="amount-highlight">
                <p class="amount-value">${formattedAmount}</p>
                <p class="amount-label">Amount Due</p>
              </div>
              
              <div class="invoice-details">
                <h3 style="margin-top: 0; color: #111827;">Invoice Details</h3>
                <div class="detail-row">
                  <span class="label">Description:</span>
                  <span class="value">${data.invoiceDescription}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Invoice Date:</span>
                  <span class="value">${this.formatDate(data.invoiceDate)}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Amount:</span>
                  <span class="value">${formattedAmount}</span>
                </div>
                ${data.businessName ? `
                <div class="detail-row">
                  <span class="label">Business:</span>
                  <span class="value">${data.businessName}</span>
                </div>
                ` : ''}
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${safePaymentUrl}" class="payment-button" style="display: inline-block; background: linear-gradient(135deg, #1F2937 0%, #374151 100%); color: white; padding: 20px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 1.1rem; margin: 30px 0; text-align: center; transition: all 0.3s ease; box-shadow: 0 4px 14px 0 rgba(31, 41, 55, 0.3); max-width: 100%; box-sizing: border-box;">
                  Pay ${formattedAmount} Now
                </a>
                <p style="margin: 20px 0 0 0; font-size: 12px; color: #9CA3AF; padding: 0 10px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="margin: 8px 0 0 0; font-size: 11px; color: #6B7280; background-color: #F9FAFB; padding: 8px; border-radius: 6px; font-family: monospace; word-break: break-all; overflow-wrap: break-word; padding: 10px;">${data.paymentUrl}</p>
              </div>
              
              ${data.expiresAt ? `
              <div class="expiry-notice">
                <h4>⚠️ Payment Expires Soon</h4>
                <p>This payment link expires on ${this.formatDate(data.expiresAt)}. Please complete your payment before then.</p>
              </div>
              ` : ''}
              
              <div class="security-note">
                <h4>🔐 Secure Payment</h4>
                <p>This payment is processed securely through Stripe. Your payment information is encrypted and protected.</p>
              </div>
              
              <p><strong>Payment Methods Accepted:</strong></p>
              <ul>
                <li>💳 Credit/Debit Cards (Visa, MasterCard, AmEx) - 3% processing fee</li>
                <li>🏦 ACH Bank Transfer - 0.8% processing fee (max $5)</li>
              </ul>
              
              <p>If you have any questions about this payment, please contact us directly.</p>
              
              <div class="footer">
                <p>This is an automated payment request. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} Dubsea Networks. All rights reserved.</p>
              </div>
            </div>
          </div>
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