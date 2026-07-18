import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify the KHQR webhook signature using HMAC-SHA256.
   * The KHQR provider signs the raw request body with your shared secret.
   * We re-compute the signature and compare — if it doesn't match, the
   * request is rejected as a forgery attempt.
   *
   * @param rawBody   The raw, unparsed request body string (from rawBody: true in main.ts)
   * @param signature The 'x-khqr-signature' header value sent by the KHQR provider
   */
  verifyKhqrSignature(rawBody: string, signature: string): void {
    const secret = process.env.KHQR_WEBHOOK_SECRET;

    if (!secret) {
      this.logger.error(
        '❌ KHQR_WEBHOOK_SECRET is not configured in environment variables. Rejecting all KHQR webhooks for security.',
      );
      throw new UnauthorizedException(
        'Webhook secret is not configured on the server.',
      );
    }

    if (!signature) {
      this.logger.warn('⚠️ KHQR webhook received with no signature header.');
      throw new UnauthorizedException('Missing webhook signature header.');
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    // Use timingSafeEqual to prevent timing-based attacks
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      this.logger.warn(
        `⚠️ Invalid KHQR signature. Expected: ${expectedSignature}, Got: ${signature}`,
      );
      throw new UnauthorizedException(
        'Invalid webhook signature. Possible forgery attempt.',
      );
    }

    this.logger.log('✅ KHQR webhook signature verified successfully.');
  }

  async handleKhqrPayment(payload: any, rawBody: string, signature: string) {
    // 🔐 Step 1: Verify the signature BEFORE processing anything
    this.verifyKhqrSignature(rawBody, signature);

    this.logger.log(
      `Received verified KHQR Webhook payload: ${JSON.stringify(payload)}`,
    );

    const { bookingId, transactionRef, status, amount } = payload;

    if (!bookingId || status !== 'SUCCESS') {
      this.logger.warn('Invalid or unsuccessful payment payload ignored.');
      return { received: true, status: 'ignored' };
    }

    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: BigInt(bookingId) },
        include: { company: true },
      });

      if (!booking) {
        throw new NotFoundException(`Booking ${bookingId} not found`);
      }

      const payment = await tx.payment.findUnique({
        where: { bookingId: booking.id },
      });

      if (!payment) {
        this.logger.error(`No payment record found for booking ${bookingId}`);
        return { received: true, status: 'error' };
      }

      if (payment.status === 'paid') {
        this.logger.log(`Payment for booking ${bookingId} is already paid.`);
        return { received: true, status: 'already_processed' };
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'paid',
          transactionRef: transactionRef || `KHQR-${Date.now()}`,
          paidAt: new Date(),
        },
      });

      await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'confirmed' },
      });

      const totalAmount = Number(payment.amount);
      const companyShare = totalAmount * 0.9;

      await tx.transaction.create({
        data: {
          ownerType: 'company',
          ownerId: booking.companyId,
          amount: companyShare,
          type: 'credit',
          category: 'booking_revenue',
          description: `Revenue from booking #${booking.id} (after 10% commission)`,
          bookingId: booking.id,
        },
      });

      this.logger.log(
        `Successfully processed KHQR payment for booking ${booking.id}. Credited $${companyShare} to Company ${booking.companyId}.`,
      );
      return { received: true, status: 'processed' };
    });
  }
}

