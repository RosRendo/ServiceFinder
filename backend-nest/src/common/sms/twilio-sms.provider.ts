import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { SmsProvider } from './sms-provider.interface';

/**
 * Twilio Messages API (plain SMS — NOT Verify).
 *
 * With self-managed OTP codes (stored + verified in our DB), the code never
 * needs to round-trip through Twilio, so the cheaper Messages API is enough.
 */
export class TwilioSmsProvider implements SmsProvider {
  readonly name = 'twilio';

  constructor(private readonly config: ConfigService) {}

  async send(phone: string, message: string): Promise<boolean> {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.config.get<string>('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !from) return false;

    try {
      const client = new Twilio(accountSid, authToken);
      await client.messages.create({ body: message, from, to: phone });
      return true;
    } catch (err: any) {
      console.error('[SMS:twilio] send failed:', err.message || err);
      return false;
    }
  }
}
