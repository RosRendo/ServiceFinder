"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const chat_gateway_1 = require("./chat.gateway");
let ConversationsService = class ConversationsService {
    prisma;
    chatGateway;
    constructor(prisma, chatGateway) {
        this.prisma = prisma;
        this.chatGateway = chatGateway;
    }
    async getOrCreateConversation(userId, dto) {
        let otherUserId;
        let companyIdParam;
        if (dto.targetUserId) {
            otherUserId = BigInt(dto.targetUserId);
        }
        else if (dto.companyId) {
            companyIdParam = BigInt(dto.companyId);
            const company = await this.prisma.company.findUnique({
                where: { id: companyIdParam },
                select: { id: true, name: true, ownerId: true },
            });
            if (!company)
                throw new common_1.NotFoundException('Company not found');
            otherUserId = company.ownerId;
        }
        else {
            throw new common_1.NotFoundException('Must provide companyId or targetUserId');
        }
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
    async getMyConversations(userId) {
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
    async getMessages(conversationId, userId, query) {
        const { page = 1, limit = 50 } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const participant = await this.prisma.conversationParticipant.findUnique({
            where: { conversationId_userId: { conversationId, userId } },
        });
        if (!participant)
            throw new common_1.ForbiddenException('Access denied');
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
    async sendMessage(conversationId, userId, dto) {
        const participant = await this.prisma.conversationParticipant.findUnique({
            where: { conversationId_userId: { conversationId, userId } },
        });
        if (!participant)
            throw new common_1.ForbiddenException('Access denied');
        const message = await this.prisma.message.create({
            data: { conversationId, senderId: userId, content: dto.content },
            include: {
                sender: { select: { id: true, fullName: true, avatar: true } },
            },
        });
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
        this.chatGateway.broadcastNewMessage(conversationId.toString(), response.data);
        return response;
    }
    formatConversation(c, myUserId) {
        const otherParticipant = c.participants.find((p) => p.userId !== myUserId);
        const lastMessage = c.messages?.[0];
        const isCustomerViewingCompany = c.company &&
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
};
exports.ConversationsService = ConversationsService;
exports.ConversationsService = ConversationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_gateway_1.ChatGateway))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chat_gateway_1.ChatGateway])
], ConversationsService);
//# sourceMappingURL=conversations.service.js.map