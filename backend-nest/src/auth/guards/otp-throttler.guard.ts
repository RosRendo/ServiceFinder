import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { normalizePhone } from '../../common/utils/phone.util';

/**
 * Throttler keyed by the PHONE NUMBER from the request body instead of the IP.
 *
 * This is the money-saver: Twilio charges per verification attempt, so the
 * limit that matters is per-number, not per-IP. Falls back to the client IP
 * when the phone is missing or invalid (so invalid-number spam still gets
 * throttled by IP).
 */
@Injectable()
export class OtpThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const rawPhone = req?.body?.phone;
    const normalized =
      typeof rawPhone === 'string' ? normalizePhone(rawPhone) : null;
    return normalized || req?.ip || 'unknown';
  }
}
