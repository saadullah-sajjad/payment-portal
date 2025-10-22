import CryptoJS from 'crypto-js';

/**
 * Generate HMAC signature for payment URL parameters
 * @param params - Object containing cid, amt, currency, invoiceDate, and invoiceDesc
 * @returns HMAC signature string
 */
export function generateSignature(params: {
  cid: string;
  amt: string;
  currency: string;
  invoiceDate: string;
  invoiceDesc: string;
}): string {
  const secret = process.env.HMAC_SECRET || 'default-secret-change-in-production';
  
  // Create a string from sorted parameters using URLSearchParams for consistent encoding
  const messageParams = new URLSearchParams({
    cid: params.cid,
    amt: params.amt,
    currency: params.currency,
    invoiceDate: params.invoiceDate,
    invoiceDesc: params.invoiceDesc,
  });
  
  const message = messageParams.toString();
  
  // Generate HMAC SHA256
  const signature = CryptoJS.HmacSHA256(message, secret).toString(CryptoJS.enc.Hex);
  
  return signature;
}

/**
 * Validate HMAC signature
 * @param params - Object containing cid, amt, currency, invoiceDate, invoiceDesc, and sig
 * @returns boolean indicating if signature is valid
 */
export function validateSignature(params: {
  cid: string;
  amt: string;
  currency: string;
  invoiceDate: string;
  invoiceDesc: string;
  sig: string;
}): boolean {
  const expectedSignature = generateSignature({
    cid: params.cid,
    amt: params.amt,
    currency: params.currency,
    invoiceDate: params.invoiceDate,
    invoiceDesc: params.invoiceDesc,
  });
  
  return expectedSignature === params.sig;
}

/**
 * Build payment URL with signature
 */
export function buildPaymentUrl(params: {
  cid: string;
  amt: string;
  currency: string;
  invoiceDate: string;
  invoiceDesc: string;
  baseUrl?: string;
}): string {
  const baseUrl = params.baseUrl || 'https://pay.dubsea.com';
  const signature = generateSignature({
    cid: params.cid,
    amt: params.amt,
    currency: params.currency,
    invoiceDate: params.invoiceDate,
    invoiceDesc: params.invoiceDesc,
  });
  
  // Properly encode all parameters to prevent malformed URLs
  const encodedParams = new URLSearchParams({
    cid: params.cid,
    amt: params.amt,
    currency: params.currency,
    invoiceDate: params.invoiceDate,
    invoiceDesc: params.invoiceDesc,
    sig: signature,
  });
  
  return `${baseUrl}/pay?${encodedParams.toString()}`;
}

