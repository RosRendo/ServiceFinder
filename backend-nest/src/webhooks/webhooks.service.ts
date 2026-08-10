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
   * Verify the ABA PayWay webhook signature using HMAC-SHA512.
   * ABA PayWay signs the payload using your ABA_API_KEY.
   */
  verifyAbaSignature(tran_id: string, status: string, hash: string): void {
    const apiKey = process.env.ABA_API_KEY;

    if (!apiKey) {
      this.logger.error(
        '❌ ABA_API_KEY is not configured in environment variables. Rejecting all webhooks for security.',
      );
      throw new UnauthorizedException(
        'Webhook secret is not configured on the server.',
      );
    }

    if (!hash) {
      this.logger.warn('⚠️ ABA webhook received with no hash.');
      throw new UnauthorizedException('Missing webhook hash.');
    }

    const expectedHashString = (tran_id || '') + (status || '');
    const expectedHash = crypto
      .createHmac('sha512', apiKey)
      .update(expectedHashString)
      .digest('base64');

    if (hash !== expectedHash) {
      this.logger.warn(
        `⚠️ Invalid ABA signature. Expected: ${expectedHash}, Got: ${hash}`,
      );
      throw new UnauthorizedException(
        'Invalid webhook signature. Possible forgery attempt.',
      );
    }

    this.logger.log('✅ ABA PayWay webhook signature verified successfully.');
  }

  async handleAbaPayment(payload: any) {
    const { tran_id, status, hash } = payload;

    // 🔐 Step 1: Verify the signature BEFORE processing anything
    this.verifyAbaSignature(tran_id, status, hash);

    this.logger.log(
      `Received verified ABA Webhook payload: ${JSON.stringify(payload)}`,
    );

    // If ABA status is not 0 (Approved), we ignore it or mark as failed
    if (status !== '0' && status !== 'APPROVED') {
      this.logger.warn(`Payment failed or declined. Status: ${status}`);
      return { received: true, status: 'ignored' };
    }

    return this.prisma.$transaction(async (tx) => {
      // Find the payment by the unique ABA tran_id
      const payment = await tx.payment.findFirst({
        where: { transactionRef: tran_id },
      });

      if (!payment) {
        this.logger.error(`No payment record found for tran_id ${tran_id}`);
        return { received: true, status: 'error' };
      }

      if (payment.status === 'paid') {
        this.logger.log(`Payment for tran_id ${tran_id} is already paid.`);
        return { received: true, status: 'already_processed' };
      }

      const booking = await tx.booking.findUnique({
        where: { id: payment.bookingId },
        include: { company: true },
      });

      if (!booking) {
        throw new NotFoundException(`Booking ${payment.bookingId} not found`);
      }

      // Update payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
      });

      // Update booking
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'confirmed' },
      });

      // Calculate company revenue share (90%)
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
        `Successfully processed ABA payment for booking ${booking.id}. Credited $${companyShare} to Company ${booking.companyId}.`,
      );
      return { received: true, status: 'processed' };
    });
  }
}
