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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SupportService = class SupportService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTickets(status, page = 1, limit = 20, userId) {
        const where = {};
        if (status && status !== 'all')
            where.status = status;
        if (userId)
            where.userId = userId;
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
    async updateTicketStatus(id, status, userId, userRole) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: BigInt(id) },
        });
        if (!ticket)
            throw new common_1.NotFoundException('Support ticket not found');
        if (userRole !== 'admin' && ticket.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied: You do not own this ticket');
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
    async replyToTicket(id, message, senderId, senderName, senderRole) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: BigInt(id) },
        });
        if (!ticket)
            throw new common_1.NotFoundException('Support ticket not found');
        if (senderRole !== 'admin' && ticket.userId !== senderId) {
            throw new common_1.ForbiddenException('Access denied: You do not own this ticket');
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
    async createTicket(userId, subject, description, priority = 'medium') {
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
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportService);
//# sourceMappingURL=support.service.js.map