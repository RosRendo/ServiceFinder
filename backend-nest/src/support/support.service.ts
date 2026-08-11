import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async getTickets(status?: string, page = 1, limit = 20, userId?: bigint) {
    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (userId) where.userId = userId;

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
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
          ? {
              id: t.user.id.toString(),
              fullName: t.user.fullName,
              email: t.user.email,
            }
          : null,
        messages: t.messages.map((m) => ({
          id: m.id.toString(),
          senderId: m.senderId.toString(),
          senderName: m.senderName,
          senderRole: m.senderRole,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        })),
      })),
      meta: { total, page, limit },
    };
  }

  async updateTicketStatus(
    id: number,
    status: string,
    userId: bigint,
    userRole: string,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: BigInt(id) },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');

    if (userRole !== 'admin' && ticket.userId !== userId) {
      throw new ForbiddenException('Access denied: You do not own this ticket');
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: BigInt(id) },
      data: {
        status,
        resolvedAt: status === 'resolved' ? new Date() : undefined,
      },
    });
    return { success: true, id: updated.id.toString(), status: updated.status };
  }

  async replyToTicket(
    id: number,
    message: string,
    senderId: bigint,
    senderName: string,
    senderRole: string,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: BigInt(id) },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');

    if (senderRole !== 'admin' && ticket.userId !== senderId) {
      throw new ForbiddenException('Access denied: You do not own this ticket');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.supportTicket.update({
        where: { id: BigInt(id) },
        data: { status: 'in_progress' },
      });

      await tx.supportTicketMessage.create({
        data: {
          ticketId: BigInt(id),
          senderId,
          senderName,
          senderRole,
          content: message,
        },
      });
    });

    return {
      success: true,
      message: 'Reply logged. (Ticket marked in_progress)',
      ticketId: id.toString(),
    };
  }

  async createTicket(
    userId: bigint,
    subject: string,
    description: string,
    priority = 'medium',
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, role: true },
    });
    const senderName = user ? user.fullName : 'User';
    const senderRole = user ? user.role.toLowerCase() : 'customer';

    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId,
        subject,
        description,
        status: 'open',
        priority,
        messages: {
          create: {
            senderId: userId,
            senderName,
            senderRole,
            content: description,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    return {
      id: ticket.id.toString(),
      userId: ticket.userId.toString(),
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      messages: ticket.messages.map((m) => ({
        id: m.id.toString(),
        senderId: m.senderId.toString(),
        senderName: m.senderName,
        senderRole: m.senderRole,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }
}

