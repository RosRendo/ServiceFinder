import { ConfigService } from '@nestjs/config';
import { SmsProvider } from './sms-provider.interface';
import { TwilioSmsProvider } from './twilio-sms.provider';
import { HttpSmsProvider } from './http-sms.provider';
import { MockSmsProvider } from './mock-sms.provider';

/** Injection token for the active SMS provider. */
export const SMS_PROVIDER = 'SMS_PROVIDER';

/**
 * Factory: picks the SMS provider from the SMS_PROVIDER env var.
 *   - 'twilio' (default) — Twilio Messages
 *   - 'http'             — config-driven local gateway (Seatel/Smart/…)
 *   - 'mock'             — log to console (dev only)
 *   - anything else      — Twilio
 */
export const smsProviderFactory = {
  provide: SMS_PROVIDER,
  inject: [ConfigService],
  useFactory: (config: ConfigService): SmsProvider => {
    const provider = (
      config.get<string>('SMS_PROVIDER') || 'twilio'
    ).toLowerCase();
    switch (provider) {
      case 'http':
        return new HttpSmsProvider(config);
      case 'mock':
        return new MockSmsProvider();
      case 'twilio':
      default:
        return new TwilioSmsProvider(config);
    }
  },
};
