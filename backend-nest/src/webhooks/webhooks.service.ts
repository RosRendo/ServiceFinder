import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleKhqrPayment(payload: any) {
    this.logger.log(`Received KHQR Webhook payload: ${JSON.stringify(payload)}`);
    
    // In a real scenario, you'd verify the signature of the webhook here.
    const { bookingId, transactionRef, status, amount } = payload;

    if (!bookingId || status !== 'SUCCESS') {
      this.logger.warn('Invalid or unsuccessful payment payload ignored.');
      return { received: true, status: 'ignored' };
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Find the Booking and Payment
      const booking = await tx.booking.findUnique({
        where: { id: BigInt(bookingId) },
        include: { company: true }
      });

      if (!booking) {
        throw new NotFoundException(`Booking ${bookingId} not found`);
      }

      const payment = await tx.payment.findUnique({
        where: { bookingId: booking.id }
      });

      if (!payment) {
         this.logger.error(`No payment record found for booking ${bookingId}`);
         return { received: true, status: 'error' };
      }

      if (payment.status === 'paid') {
         this.logger.log(`Payment for booking ${bookingId} is already paid.`);
         return { received: true, status: 'already_processed' };
      }

      // 2. Mark Payment as Paid
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'paid',
          transactionRef: transactionRef || `KHQR-${Date.now()}`,
          paidAt: new Date(),
        }
      });

      // 3. Mark Booking as Confirmed
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'confirmed' }
      });

      // 4. Credit the Company's Wallet (e.g., 90% goes to the company, 10% platform fee)
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
        }
      });

      this.logger.log(`Successfully processed KHQR payment for booking ${booking.id}. Credited $${companyShare} to Company ${booking.companyId}.`);
      return { received: true, status: 'processed' };
    });
  }
}
