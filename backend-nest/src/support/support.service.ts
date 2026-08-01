import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async getTickets(status?: string, page = 1, limit = 20) {
    const where: any = {};
    if (status && status !== 'all') where.status = status;

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: { user: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    // Return with success: true so TransformInterceptor passes through without double-wrapping
    return {
      success: true,
      data: tickets.map((t) => ({
        id: t.id.toString(),
        userId: t.userId.toString(),
        subject: t.subject,
        description: t.description,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        resolvedAt: t.resolvedAt?.toISOString() ?? null,
        user: t.user
          ? { id: t.user.id.toString(), fullName: t.user.fullName, email: t.user.email }
          : null,
      })),
      meta: { total, page, limit },
    };
  }

  async updateTicketStatus(id: number, status: string) {
    const updated = await this.prisma.supportTicket.update({
      where: { id: BigInt(id) },
      data: {
        status,
        resolvedAt: status === 'resolved' ? new Date() : undefined,
      },
    });
    return { success: true, id: updated.id.toString(), status: updated.status };
  }

  async replyToTicket(id: number, message: string) {
    await this.prisma.supportTicket.update({
      where: { id: BigInt(id) },
      data: { status: 'in_progress' },
    });
    return { success: true, message: 'Reply logged. (Ticket marked in_progress)', ticketId: id.toString() };
  }
}
