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

    const dispute = await this.prisma.dispute.create({
      data: {
        bookingId,
        customerId,
        companyId: booking.companyId,
        type: dto.type,
        description: dto.description,
        photos: dto.photos ? JSON.stringify(dto.photos) : null,
        status: 'open',
      },
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
    const dispute = await this.prisma.dispute.findUnique({ where: { id } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.status === 'resolved')
      throw new BadRequestException('Dispute already resolved');

    const updated = await this.prisma.dispute.update({
      where: { id },
      data: {
        adminDecision: dto.decision,
        refundAmount: dto.refundAmount ?? null,
        status: 'resolved',
        resolvedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { message: 'Dispute resolved', dispute: updated };
  }
}
