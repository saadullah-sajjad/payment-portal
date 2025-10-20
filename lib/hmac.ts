import CryptoJS from 'crypto-js';

/**
 * Generate HMAC signature for payment URL parameters
 * @param params - Object containing cid, amt, and currency
 * @returns HMAC signature string
 */
export function generateSignature(params: {
  cid: string;
  amt: string;
  currency: string;
}): string {
  const secret = process.env.HMAC_SECRET || 'default-secret-change-in-production';
  
  // Create a string from sorted parameters
  const message = `cid=${params.cid}&amt=${params.amt}&currency=${params.currency}`;
  
  // Generate HMAC SHA256
  const signature = CryptoJS.HmacSHA256(message, secret).toString(CryptoJS.enc.Hex);
  
  return signature;
}

/**
 * Validate HMAC signature
 * @param params - Object containing cid, amt, currency, and sig
 * @returns boolean indicating if signature is valid
 */
export function validateSignature(params: {
  cid: string;
  amt: string;
  currency: string;
  sig: string;
}): boolean {
  const expectedSignature = generateSignature({
    cid: params.cid,
    amt: params.amt,
    currency: params.currency,
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
  baseUrl?: string;
}): string {
  const baseUrl = params.baseUrl || 'https://pay.cirqley.com';
  const signature = generateSignature({
    cid: params.cid,
    amt: params.amt,
    currency: params.currency,
  });
  
  return `${baseUrl}/pay?cid=${params.cid}&amt=${params.amt}&currency=${params.currency}&sig=${signature}`;
}

