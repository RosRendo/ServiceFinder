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
exports.DisputesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DisputesService = class DisputesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async fileDispute(bookingId, customerId, dto) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { company: true },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.customerId !== customerId)
            throw new common_1.ForbiddenException('Not your booking');
        if (booking.status !== 'completed' && booking.status !== 'in_progress') {
            throw new common_1.BadRequestException('Disputes can only be filed on in-progress or completed bookings');
        }
        const existing = await this.prisma.dispute.findFirst({
            where: { bookingId, customerId },
        });
        if (existing)
            throw new common_1.BadRequestException('A dispute already exists for this booking');
        const frozenAmount = Number(booking.companyEarnings || 0);
        const dispute = await this.prisma.$transaction(async (tx) => {
            const pendingBalance = Number(booking.company.pendingBalance);
            const availableBalance = Number(booking.company.availableBalance);
            let freezeFromPending = 0;
            let freezeFromAvailable = 0;
            if (frozenAmount > 0) {
                if (pendingBalance >= frozenAmount) {
                    freezeFromPending = frozenAmount;
                }
                else {
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
    async getDisputes(role, userId, companyId) {
        const where = {};
        if (role === 'customer')
            where.customerId = userId;
        else if (role === 'company_admin' && companyId)
            where.companyId = companyId;
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
    async getDisputeById(id, userId, role) {
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
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found');
        if (role === 'customer' && dispute.customerId !== userId)
            throw new common_1.ForbiddenException('Access denied');
        return { dispute };
    }
    async respondToDispute(id, companyId, dto) {
        const dispute = await this.prisma.dispute.findUnique({ where: { id } });
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found');
        if (dispute.companyId !== companyId)
            throw new common_1.ForbiddenException('Not your dispute');
        if (dispute.status !== 'open')
            throw new common_1.BadRequestException('Dispute is already resolved or responded');
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
    async resolveDispute(id, dto) {
        const dispute = await this.prisma.dispute.findUnique({
            where: { id },
            include: { booking: true },
        });
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found');
        if (dispute.status === 'resolved')
            throw new common_1.BadRequestException('Dispute already resolved');
        const frozenAmount = Number(dispute.frozenAmount || 0);
        await this.prisma.$transaction(async (tx) => {
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
                }
                else if (dto.decision === 'release' || dto.decision === 'no_action') {
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
};
exports.DisputesService = DisputesService;
exports.DisputesService = DisputesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DisputesService);
//# sourceMappingURL=disputes.service.js.map