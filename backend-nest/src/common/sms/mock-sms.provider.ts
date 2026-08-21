import { SmsProvider } from './sms-provider.interface';

/**
 * Development provider: prints the code to the server console instead of
 * sending SMS. Zero cost, zero external dependency. Never enable in
 * production — this is why requestOtp messages say "(Sandbox Mock Mode)".
 */
export class MockSmsProvider implements SmsProvider {
  readonly name = 'mock';

  async send(phone: string, message: string): Promise<boolean> {
    console.log(`[SMS MOCK] to ${phone}: ${message}`);
    return true;
  }
}
