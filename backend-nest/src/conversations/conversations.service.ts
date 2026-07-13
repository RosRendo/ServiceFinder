import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {}

  // ── Get or create a conversation between users ──────────
  async getOrCreateConversation(userId: bigint, dto: StartConversationDto) {
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

    // Find existing conversation between these two users for this company
    let existing = await this.prisma.conversation.findFirst({
      where: {
        ...(companyIdParam ? { companyId: companyIdParam } : {}),
        participants: {
          every: {
            userId: { in: [userId, otherUserId] },
          },
        },
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, fullName: true, avatar: true, role: true },
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
        messages: { orderBy: { createdAt: 'asc' }, take: 1 },
      },
    });

    // Fallback: If no company-specific conversation exists, or an empty one was created,
    // check if there's an old legacy conversation (companyId = null) between these two exact users.
    // If so, update it to belong to this company so chat history isn't lost.
    if ((!existing || existing.messages.length === 0) && companyIdParam) {
      const legacyExisting = await this.prisma.conversation.findFirst({
        where: {
          companyId: null,
          participants: {
            every: {
              userId: { in: [userId, otherUserId] },
            },
          },
          AND: [
            { participants: { some: { userId } } },
            { participants: { some: { userId: otherUserId } } },
          ],
        },
      });

      if (legacyExisting) {
        // If a blank company conversation was already created, delete it to prevent duplicates
        if (existing) {
          await this.prisma.conversationParticipant.deleteMany({
            where: { conversationId: existing.id },
          });
          await this.prisma.conversation.delete({
            where: { id: existing.id },
          });
        }

        // Upgrade legacy conversation to be linked to this company
        existing = await this.prisma.conversation.update({
          where: { id: legacyExisting.id },
          data: { companyId: companyIdParam },
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    avatar: true,
                    role: true,
                  },
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
            messages: { orderBy: { createdAt: 'asc' }, take: 1 },
          },
        });
      }
    }

    if (existing) {
      return { data: this.formatConversation(existing, userId) };
    }

    // Create new conversation
    const conversation = await this.prisma.conversation.create({
      data: {
        ...(companyIdParam ? { companyId: companyIdParam } : {}),
        participants: {
          create: [{ userId }, { userId: otherUserId }],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, fullName: true, avatar: true, role: true },
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
        messages: { orderBy: { createdAt: 'asc' }, take: 1 },
      },
    });

    return { data: this.formatConversation(conversation, userId) };
  }

  // ── List all conversations for a user ────────────────────────────────────
  async getMyConversations(userId: bigint) {
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, fullName: true, avatar: true, role: true },
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
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      data: conversations.map((c) => this.formatConversation(c, userId)),
    };
  }

  // ── Get messages in a conversation ───────────────────────────────────────
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

  // ── Send a message ───────────────────────────────────────────────────────
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
      },
    };

    // Broadcast the message to the conversation room in real-time
    this.chatGateway.broadcastNewMessage(
      conversationId.toString(),
      response.data,
    );

    return response;
  }

  // ── Private helper ───────────────────────────────────────────────────────
  private formatConversation(c: any, myUserId: bigint) {
    const otherParticipant = c.participants.find(
      (p: any) => p.userId !== myUserId,
    );
    const lastMessage = c.messages?.[0];

    // If there's a company associated, and the current user is NOT the owner
    // and NOT a staff member of that company, they are the customer,
    // so show the company name/logo.
    // Otherwise (owner/staff), show the other participant's name/avatar.
    const isCustomerViewingCompany =
      c.company &&
      c.company.ownerId !== myUserId &&
      (!c.company.staff || c.company.staff.length === 0);

    return {
      id: c.id.toString(),
      updatedAt: c.updatedAt,
      otherUser: isCustomerViewingCompany
        ? {
            id: c.company.id.toString(),
            fullName: c.company.name,
            avatar: c.company.logoUrl,
          }
        : otherParticipant
          ? {
              id: `${otherParticipant.user.id.toString()}_${c.company?.id?.toString() || 'legacy'}`,
              fullName: c.company
                ? `${otherParticipant.user.fullName} (${c.company.name})`
                : otherParticipant.user.fullName,
              avatar: otherParticipant.user.avatar,
              role: otherParticipant.user.role,
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
