import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDisputeDto,
  RespondToDisputeDto,
  ResolveDisputeDto,
} from './dto/dispute.dto';

@Injectable()
export class DisputesService {
  constructor(private prisma: PrismaService) {}

  async fileDispute(
    bookingId: bigint,
    customerId: bigint,
    dto: CreateDisputeDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { company: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== customerId)
      throw new ForbiddenException('Not your booking');
    if (booking.status !== 'completed' && booking.status !== 'in_progress') {
      throw new BadRequestException(
        'Disputes can only be filed on in-progress or completed bookings',
      );
    }

    const existing = await this.prisma.dispute.findFirst({
      where: { bookingId, customerId },
    });
    if (existing)
      throw new BadRequestException(
        'A dispute already exists for this booking',
      );

    // ── Freeze only this booking's company earnings ──────────────────────
    // We freeze from pendingBalance first; fall back to availableBalance.
    const frozenAmount = Number(booking.companyEarnings || 0);

    const dispute = await this.prisma.$transaction(async (tx) => {
      let pendingBalance = Number(booking.company.pendingBalance);
      let availableBalance = Number(booking.company.availableBalance);

      let freezeFromPending = 0;
      let freezeFromAvailable = 0;

      if (frozenAmount > 0) {
        if (pendingBalance >= frozenAmount) {
          freezeFromPending = frozenAmount;
        } else {
          freezeFromPending = pendingBalance;
          freezeFromAvailable = frozenAmount - pendingBalance;
        }

        await tx.company.update({
          where: { id: booking.companyId },
          data: {
            pendingBalance: { decrement: freezeFromPending },
            availableBalance: { decrement: freezeFromAvailable },
          },
        });

        // Audit trail
        await tx.transaction.create({
          data: {
            ownerType: 'company',
            ownerId: booking.companyId,
            amount: frozenAmount,
            type: 'debit',
            category: 'dispute_freeze',
            description: `Earnings frozen for dispute on booking #${bookingId}`,
            bookingId,
          },
        });
      }

      return tx.dispute.create({
        data: {
          bookingId,
          customerId,
          companyId: booking.companyId,
          type: dto.type,
          description: dto.description,
          photos: dto.photos ? JSON.stringify(dto.photos) : null,
          status: 'open',
          frozenAmount: frozenAmount > 0 ? frozenAmount : null,
        },
      });
    });

    return { message: 'Dispute filed successfully', dispute };
  }

  async getDisputes(role: string, userId: bigint, companyId?: bigint) {
    const where: any = {};

    if (role === 'customer') where.customerId = userId;
    else if (role === 'company_admin' && companyId) where.companyId = companyId;
    // admin sees all

    const disputes = await this.prisma.dispute.findMany({
      where,
      include: {
        booking: { select: { id: true, bookingDate: true, totalPrice: true } },
        customer: { select: { id: true, fullName: true, email: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { disputes };
  }

  async getDisputeById(id: number, userId: bigint, role: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            bookingDate: true,
            totalPrice: true,
            serviceAddress: true,
          },
        },
        customer: {
          select: { id: true, fullName: true, email: true, avatar: true },
        },
        company: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    if (!dispute) throw new NotFoundException('Dispute not found');

    if (role === 'customer' && dispute.customerId !== userId)
      throw new ForbiddenException('Access denied');

    return { dispute };
  }

  async respondToDispute(
    id: number,
    companyId: bigint,
    dto: RespondToDisputeDto,
  ) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.companyId !== companyId)
      throw new ForbiddenException('Not your dispute');
    if (dispute.status !== 'open')
      throw new BadRequestException('Dispute is already resolved or responded');

    const updated = await this.prisma.dispute.update({
      where: { id },
      data: {
        companyResponse: dto.response,
        status: 'responded',
        updatedAt: new Date(),
      },
    });

    return { message: 'Response submitted', dispute: updated };
  }

  async resolveDispute(id: number, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: { booking: true },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.status === 'resolved')
      throw new BadRequestException('Dispute already resolved');

    const frozenAmount = Number(dispute.frozenAmount || 0);

    await this.prisma.$transaction(async (tx) => {
      // Mark dispute resolved first
      await tx.dispute.update({
        where: { id },
        data: {
          adminDecision: dto.decision,
          refundAmount: dto.refundAmount ?? null,
          status: 'resolved',
          resolvedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      if (frozenAmount > 0) {
        if (dto.decision === 'refund') {
          // Frozen funds are NOT returned to the company — they are forfeited.
          // The actual refund to the customer is handled by the payment/billing system.
          await tx.transaction.create({
            data: {
              ownerType: 'company',
              ownerId: dispute.companyId,
              amount: frozenAmount,
              type: 'debit',
              category: 'dispute_refund',
              description: `Frozen earnings forfeited due to refund decision on dispute #${id}`,
              bookingId: dispute.bookingId,
            },
          });
        } else if (dto.decision === 'release' || dto.decision === 'no_action') {
          // Release frozen funds back to company's available balance
          await tx.company.update({
            where: { id: dispute.companyId },
            data: { availableBalance: { increment: frozenAmount } },
          });

          await tx.transaction.create({
            data: {
              ownerType: 'company',
              ownerId: dispute.companyId,
              amount: frozenAmount,
              type: 'credit',
              category: 'dispute_release',
              description: `Frozen earnings released to available balance after dispute #${id} resolved`,
              bookingId: dispute.bookingId,
            },
          });
        }
      }
    });

    const updated = await this.prisma.dispute.findUnique({ where: { id } });
    return { message: 'Dispute resolved', dispute: updated };
  }
}
