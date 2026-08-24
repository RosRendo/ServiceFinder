import { ConfigService } from '@nestjs/config';
import { SmsProvider } from './sms-provider.interface';

/**
 * Config-driven generic HTTP SMS gateway.
 *
 * For Cambodian local carriers (Seatel, Smart Axiata, Cellcard, MyTel) that
 * expose a JSON API. Get their API spec + credentials, then configure:
 *
 *   SMS_PROVIDER=http
 *   SMS_HTTP_URL=https://your-provider.example/api/sms/send
 *   SMS_HTTP_API_KEY=your_api_key
 *   SMS_HTTP_SENDER_ID=ServiceFinder
 *
 * The request body below follows the common shape used by Cambodian gateways
 * (api key + sender + recipient + message). If your provider differs, adjust
 * the `payload` object + headers in send() — it's the only place to change.
 *
 * Local carriers typically cost ~10-20x less than Twilio per SMS.
 */
export class HttpSmsProvider implements SmsProvider {
  readonly name = 'http';

  constructor(private readonly config: ConfigService) {}

  async send(phone: string, message: string): Promise<boolean> {
    const url = this.config.get<string>('SMS_HTTP_URL');
    const apiKey = this.config.get<string>('SMS_HTTP_API_KEY');
    const senderId = this.config.get<string>('SMS_HTTP_SENDER_ID');

    if (!url || !apiKey) {
      console.warn('[SMS:http] SMS_HTTP_URL / SMS_HTTP_API_KEY not configured');
      return false;
    }

    try {
      // Adjust payload field names to match your provider's documentation.
      const payload = {
        api_key: apiKey,
        sender_id: senderId || 'ServiceFinder',
        phone, // or "to" / "msisdn" depending on the provider
        message,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Some gateways expect the key here instead of the body:
          ...(this.config.get('SMS_HTTP_API_KEY_HEADER')
            ? { 'X-API-Key': apiKey }
            : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error(`[SMS:http] ${response.status} ${text.slice(0, 300)}`);
        return false;
      }
      return true;
    } catch (err: any) {
      console.error('[SMS:http] send failed:', err.message || err);
      return false;
    }
  }
}
