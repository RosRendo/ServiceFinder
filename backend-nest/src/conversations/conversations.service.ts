import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { ChatGateway } from './chat.gateway';

// Regex to detect phone numbers shared in chat
// Matches formats like +1 234 567 8901, 012-345-6789, 08012345678, etc.
const PHONE_PATTERN = /(\+?\d[\d\s\-().]{6,}\d)/g;

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {}

  // ── Get or create a conversation ─────────────────────────────────────────
  async getOrCreateConversation(userId: bigint, dto: StartConversationDto) {
    const channelType = dto.type ?? 'support';

    // ── JOB channel: Customer <-> Assigned Staff ──────────────────────────
    if (channelType === 'job') {
      if (!dto.bookingId) {
        throw new BadRequestException(
          'bookingId is required for job conversations',
        );
      }

      const bookingId = BigInt(dto.bookingId);
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          assignedStaff: { include: { user: true } },
          company: { select: { id: true, name: true, logoUrl: true } },
        },
      });

      if (!booking) throw new NotFoundException('Booking not found');
      if (!booking.assignedStaffId || !booking.assignedStaff) {
        throw new BadRequestException(
          'No staff assigned to this booking yet. Job chat opens after staff assignment.',
        );
      }
      if (!['confirmed', 'in_progress', 'completed'].includes(booking.status)) {
        throw new BadRequestException(
          'Job chat is only available for confirmed, in-progress, or recently completed bookings.',
        );
      }

      const staffUserId = booking.assignedStaff.userId;

      // Participants: customer + staff
      const participants = [userId, staffUserId];

      // Find or create the job conversation for this booking
      let existing = await this.prisma.conversation.findFirst({
        where: {
          type: 'job',
          bookingId,
        },
        include: this.conversationInclude(userId),
      });

      if (existing) {
        return { data: this.formatConversation(existing, userId) };
      }

      const conversation = await this.prisma.conversation.create({
        data: {
          type: 'job',
          bookingId,
          participants: {
            create: participants.map((uid) => ({ userId: uid })),
          },
        },
        include: this.conversationInclude(userId),
      });

      return { data: this.formatConversation(conversation, userId) };
    }

    // ── SUPPORT channel: Customer <-> Company ─────────────────────────────
    let otherUserId: bigint;
    let companyIdParam: bigint | undefined;

    if (dto.targetUserId) {
      otherUserId = BigInt(dto.targetUserId);
    } else if (dto.companyId) {
      companyIdParam = BigInt(dto.companyId);
      const company = await this.prisma.company.findUnique({
        where: { id: companyIdParam },
        select: { id: true, name: true, ownerId: true },
      });
      if (!company) throw new NotFoundException('Company not found');
      otherUserId = company.ownerId;
    } else {
      throw new NotFoundException('Must provide companyId or targetUserId');
    }

    // Find existing support conversation
    let existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'support',
        ...(companyIdParam ? { companyId: companyIdParam } : {}),
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
      include: this.conversationInclude(userId),
    });

    // Legacy migration: upgrade companyId-null conversations
    if ((!existing || existing.messages.length === 0) && companyIdParam) {
      const legacyExisting = await this.prisma.conversation.findFirst({
        where: {
          companyId: null,
          AND: [
            { participants: { some: { userId } } },
            { participants: { some: { userId: otherUserId } } },
          ],
        },
      });

      if (legacyExisting) {
        if (existing) {
          await this.prisma.conversationParticipant.deleteMany({
            where: { conversationId: existing.id },
          });
          await this.prisma.conversation.delete({
            where: { id: existing.id },
          });
        }

        existing = await this.prisma.conversation.update({
          where: { id: legacyExisting.id },
          data: { companyId: companyIdParam, type: 'support' },
          include: this.conversationInclude(userId),
        });
      }
    }

    if (existing) {
      return { data: this.formatConversation(existing, userId) };
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type: 'support',
        ...(companyIdParam ? { companyId: companyIdParam } : {}),
        participants: {
          create: [{ userId }, { userId: otherUserId }],
        },
      },
      include: this.conversationInclude(userId),
    });

    return { data: this.formatConversation(conversation, userId) };
  }

  // ── List all conversations for a user ─────────────────────────────────────
  async getMyConversations(userId: bigint) {
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: this.conversationInclude(userId),
      orderBy: { updatedAt: 'desc' },
    });

    return {
      data: conversations.map((c) => this.formatConversation(c, userId)),
    };
  }

  // ── Get unread messages count ──────────────────────────────────────────────
  async getUnreadCount(userId: bigint) {
    const count = await this.prisma.message.count({
      where: {
        conversation: {
          participants: {
            some: { userId },
          },
        },
        senderId: { not: userId },
        read: false,
      },
    });
    return { unreadCount: count };
  }

  // ── Get messages in a conversation ────────────────────────────────────────
  async getMessages(conversationId: bigint, userId: bigint, query: any) {
    const { page = 1, limit = 50 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    // Verify user is a participant
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new ForbiddenException('Access denied');

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: { select: { id: true, fullName: true, avatar: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip: Number(skip),
        take: Number(limit),
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      data: messages.map((m) => ({
        id: m.id.toString(),
        conversationId: m.conversationId.toString(),
        content: m.content,
        createdAt: m.createdAt,
        sender: {
          id: m.sender.id.toString(),
          fullName: m.sender.fullName,
          avatar: m.sender.avatar,
        },
        isMe: m.senderId === userId,
      })),
      pagination: { total, page: Number(page), limit: Number(limit) },
    };
  }

  // ── Send a message ────────────────────────────────────────────────────────
  async sendMessage(
    conversationId: bigint,
    userId: bigint,
    dto: CreateMessageDto,
  ) {
    // Verify user is a participant
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new ForbiddenException('Access denied');

    // Load conversation to check lifecycle
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    // ── Job chat lifecycle enforcement ──────────────────────────────────────
    // Job conversations are archived 24h after booking completion.
    // Once archived, no new messages are allowed.
    if (conversation.type === 'job' && conversation.archivedAt) {
      const now = new Date();
      if (conversation.archivedAt <= now) {
        throw new ForbiddenException(
          'This job chat has been archived. Start a support conversation to contact the company.',
        );
      }
    }

    // ── Phone number soft-warning ───────────────────────────────────────────
    // We do NOT block the message — we flag it for review and warn the sender.
    PHONE_PATTERN.lastIndex = 0;
    const flaggedAsPhone = PHONE_PATTERN.test(dto.content);

    const message = await this.prisma.message.create({
      data: { conversationId, senderId: userId, content: dto.content },
      include: {
        sender: { select: { id: true, fullName: true, avatar: true } },
      },
    });

    // Touch the conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    if (flaggedAsPhone) {
      await this.prisma.moderationLog
        .create({
          data: {
            adminId: userId,
            entityType: 'message',
            entityId: message.id,
            action: 'flagged',
            reason: 'phone_number_detected',
            status: 'pending',
          },
        })
        .catch((e) =>
          console.warn('ModerationLog create failed:', e?.message),
        );
    }

    const response = {
      data: {
        id: message.id.toString(),
        conversationId: message.conversationId.toString(),
        content: message.content,
        createdAt: message.createdAt,
        sender: {
          id: message.sender.id.toString(),
          fullName: message.sender.fullName,
          avatar: message.sender.avatar,
        },
        isMe: true,
        // Returned to the sender so the frontend can show a ⚠️ warning banner
        flaggedAsPhone,
      },
    };

    // Broadcast the message to the conversation room in real-time
    this.chatGateway.broadcastNewMessage(
      conversationId.toString(),
      response.data,
    );

    return response;
  }

  // ── Archive a job conversation (called after booking completion) ───────────
  async archiveJobConversation(bookingId: bigint, holdHours: number) {
    const archivedAt = new Date(Date.now() + holdHours * 60 * 60 * 1000);

    await this.prisma.conversation.updateMany({
      where: { type: 'job', bookingId },
      data: { archivedAt },
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private conversationInclude(userId: bigint) {
    return {
      participants: {
        include: {
          user: {
            select: { id: true, fullName: true, avatar: true, role: true, workingStatus: true, lastSeen: true },
          },
        },
      },
      company: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          ownerId: true,
          staff: {
            where: { userId },
            select: { id: true },
            take: 1,
          },
        },
      },
      booking: {
        select: { id: true, status: true },
      },
      messages: { orderBy: { createdAt: 'desc' as const }, take: 1 },
    };
  }

  private formatConversation(c: any, myUserId: bigint) {
    const otherParticipant = c.participants.find(
      (p: any) => p.userId !== myUserId,
    );
    const lastMessage = c.messages?.[0];

    const isCustomerViewingCompany =
      c.company &&
      c.company.ownerId !== myUserId &&
      (!c.company.staff || c.company.staff.length === 0);

    return {
      id: c.id.toString(),
      type: c.type,
      bookingId: c.bookingId?.toString() ?? null,
      archivedAt: c.archivedAt ?? null,
      updatedAt: c.updatedAt,
      otherUser: isCustomerViewingCompany
        ? {
            id: c.company.id.toString(),
            fullName: c.company.name,
            avatar: c.company.logoUrl,
            workingStatus: 'offline',
            lastSeen: null,
          }
        : otherParticipant
          ? {
              id: `${otherParticipant.user.id.toString()}_${c.company?.id?.toString() || c.bookingId?.toString() || 'direct'}`,
              rawUserId: otherParticipant.user.id.toString(),
              fullName: c.company
                ? `${otherParticipant.user.fullName} (${c.company.name})`
                : otherParticipant.user.fullName,
              avatar: otherParticipant.user.avatar,
              role: otherParticipant.user.role,
              workingStatus: otherParticipant.user.workingStatus || 'offline',
              lastSeen: otherParticipant.user.lastSeen || null,
            }
          : null,
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            isMe: lastMessage.senderId === myUserId,
          }
        : null,
    };
  }
}
