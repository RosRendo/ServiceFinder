import * as crypto from 'crypto';

/**
 * Generates the ABA PayWay Hash based on their required HMAC-SHA512 algorithm.
 *
 * @param reqTime YYYYMMDDHHMMSS format string
 * @param merchantId ABA Merchant ID
 * @param tranId Unique transaction ID
 * @param amount Amount in USD formatted as string (e.g. "15.00")
 * @param items Base64 encoded JSON string of items (optional, but must be empty string if omitted)
 * @param shipping Shipping fee (optional)
 * @param firstname Customer Firstname
 * @param lastname Customer Lastname
 * @param email Customer Email
 * @param phone Customer Phone
 * @param type Payment Type (e.g. "purchase")
 * @param paymentOption "cards", "abapay", or "abapay_deeplink"
 * @param returnUrl URL to redirect to after payment (base64 encoded)
 * @param cancelUrl URL to redirect to if cancelled (base64 encoded)
 * @param continueSuccessUrl URL to continue on success (base64 encoded)
 * @param returnParams Custom parameters to return (optional)
 * @param apiKey The private ABA PayWay API Key
 */
export function generateAbaHash(
  params: {
    req_time: string;
    merchant_id: string;
    tran_id: string;
    amount: string;
    items?: string;
    shipping?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    type?: string;
    payment_option?: string;
    return_url?: string;
    cancel_url?: string;
    continue_success_url?: string;
    return_params?: string;
  },
  apiKey: string,
): string {
  // ABA strictly requires the string to be concatenated in exactly this order:
  const hashString =
    (params.req_time || '') +
    (params.merchant_id || '') +
    (params.tran_id || '') +
    (params.amount || '') +
    (params.items || '') +
    (params.shipping || '') +
    (params.firstname || '') +
    (params.lastname || '') +
    (params.email || '') +
    (params.phone || '') +
    (params.type || '') +
    (params.payment_option || '') +
    (params.return_url || '') +
    (params.cancel_url || '') +
    (params.continue_success_url || '') +
    (params.return_params || '');

  const hmac = crypto.createHmac('sha512', apiKey);
  hmac.update(hashString);
  return hmac.digest('base64');
}
