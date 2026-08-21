/**
 * SMS provider abstraction — send OTP / notification SMS through any gateway.
 *
 * Providers:
 *  - twilio (default): Twilio Messages API (works out of the box)
 *  - http: config-driven generic HTTP gateway (Seatel / Smart / Cellcard /
 *    MyTel / any provider with a JSON API — adjust the payload shape in
 *    http-sms.provider.ts to match their docs, then set env vars)
 *  - mock: logs the code to the server console (development only, no cost)
 *
 * Selected via SMS_PROVIDER env var. When a provider returns false (not
 * configured / failed), callers fall back to mock mode so development keeps
 * working without credentials.
 */
export interface SmsProvider {
  readonly name: string;
  /** Send an SMS. Returns false when the provider is unavailable. */
  send(phone: string, message: string): Promise<boolean>;
}
