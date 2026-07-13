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
exports.WalletsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let WalletsService = class WalletsService {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async getCompanyWallet(companyId, userId) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        if (company.ownerId !== userId)
            throw new common_1.ForbiddenException('Access denied');
        const transactions = await this.prisma.transaction.findMany({
            where: { ownerType: 'company', ownerId: companyId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return {
            balance: company.walletBalance,
            transactions: transactions.map((t) => ({
                ...t,
                id: t.id.toString(),
                ownerId: t.ownerId.toString(),
                bookingId: t.bookingId?.toString(),
                amount: Number(t.amount),
            })),
        };
    }
    async requestDeposit(companyId, userId, dto) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company || company.ownerId !== userId)
            throw new common_1.ForbiddenException('Access denied');
        const request = await this.prisma.depositRequest.create({
            data: {
                ownerType: 'company',
                ownerId: companyId,
                amount: dto.amount,
                bankName: dto.bankName,
                proofOfTransferUrl: dto.proofOfTransferUrl,
                status: 'pending',
            },
        });
        return {
            success: true,
            request: {
                ...request,
                id: request.id.toString(),
                ownerId: request.ownerId.toString(),
                amount: Number(request.amount),
            },
        };
    }
    async requestPayout(companyId, userId, dto) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company || company.ownerId !== userId)
            throw new common_1.ForbiddenException('Access denied');
        if (Number(company.walletBalance) < dto.amount) {
            throw new common_1.BadRequestException('Insufficient wallet balance');
        }
        const request = await this.prisma.$transaction(async (tx) => {
            await tx.company.update({
                where: { id: companyId },
                data: { walletBalance: { decrement: dto.amount } },
            });
            return tx.payoutRequest.create({
                data: {
                    ownerType: 'company',
                    ownerId: companyId,
                    amount: dto.amount,
                    destinationBank: dto.destinationBank,
                    accountName: dto.accountName,
                    accountNumber: dto.accountNumber,
                    status: 'pending',
                },
            });
        });
        return {
            success: true,
            request: {
                ...request,
                id: request.id.toString(),
                ownerId: request.ownerId.toString(),
                amount: Number(request.amount),
            },
        };
    }
    async getStaffWallet(staffId, userId) {
        const staff = await this.prisma.companyStaff.findUnique({
            where: { id: staffId },
        });
        if (!staff)
            throw new common_1.NotFoundException('Staff not found');
        if (staff.userId !== userId)
            throw new common_1.ForbiddenException('Access denied');
        const transactions = await this.prisma.walletTransaction.findMany({
            where: { staffId: staffId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return {
            balance: staff.walletBalance,
            transactions: transactions.map((t) => ({
                ...t,
                id: t.id.toString(),
                staffId: t.staffId.toString(),
                bookingId: t.bookingId?.toString(),
                amount: Number(t.amount),
            })),
        };
    }
    async requestStaffPayout(staffId, userId, dto) {
        const staff = await this.prisma.companyStaff.findUnique({
            where: { id: staffId },
        });
        if (!staff || staff.userId !== userId)
            throw new common_1.ForbiddenException('Access denied');
        if (Number(staff.walletBalance) < dto.amount) {
            throw new common_1.BadRequestException('Insufficient wallet balance');
        }
        const request = await this.prisma.$transaction(async (tx) => {
            await tx.companyStaff.update({
                where: { id: staffId },
                data: { walletBalance: { decrement: dto.amount } },
            });
            return tx.payoutRequest.create({
                data: {
                    ownerType: 'staff',
                    ownerId: staffId,
                    amount: dto.amount,
                    destinationBank: dto.destinationBank,
                    accountName: dto.accountName,
                    accountNumber: dto.accountNumber,
                    status: 'pending',
                },
            });
        });
        return {
            success: true,
            request: {
                ...request,
                id: request.id.toString(),
                ownerId: request.ownerId.toString(),
                amount: Number(request.amount),
            },
        };
    }
    async clearStaffDebt(companyId, staffId, userId, amount) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company || company.ownerId !== userId)
            throw new common_1.ForbiddenException('Access denied');
        const staff = await this.prisma.companyStaff.findUnique({
            where: { id: staffId },
        });
        if (!staff || staff.companyId !== companyId)
            throw new common_1.NotFoundException('Staff not found');
        await this.prisma.$transaction(async (tx) => {
            await tx.companyStaff.update({
                where: { id: staffId },
                data: { walletBalance: { increment: amount } },
            });
            await tx.walletTransaction.create({
                data: {
                    staffId: staffId,
                    amount: amount,
                    type: 'credit',
                    description: `Cash returned to company, digital debt cleared by manager`,
                },
            });
        });
        return { success: true, message: 'Staff debt cleared successfully' };
    }
    async getAdminPendingRequests() {
        const [deposits, payouts] = await Promise.all([
            this.prisma.depositRequest.findMany({
                where: { status: 'pending' },
                orderBy: { createdAt: 'asc' },
            }),
            this.prisma.payoutRequest.findMany({
                where: { status: 'pending' },
                orderBy: { createdAt: 'asc' },
            }),
        ]);
        return {
            deposits: deposits.map((d) => ({
                ...d,
                id: d.id.toString(),
                ownerId: d.ownerId.toString(),
                amount: Number(d.amount),
            })),
            payouts: payouts.map((p) => ({
                ...p,
                id: p.id.toString(),
                ownerId: p.ownerId.toString(),
                amount: Number(p.amount),
            })),
        };
    }
    async approveDeposit(id, adminNotes) {
        const request = await this.prisma.depositRequest.findUnique({
            where: { id },
        });
        if (!request)
            throw new common_1.NotFoundException('Deposit request not found');
        if (request.status !== 'pending')
            throw new common_1.BadRequestException('Already processed');
        await this.prisma.$transaction(async (tx) => {
            await tx.depositRequest.update({
                where: { id },
                data: { status: 'approved', adminNotes },
            });
            await tx.transaction.create({
                data: {
                    ownerType: request.ownerType,
                    ownerId: request.ownerId,
                    amount: request.amount,
                    type: 'credit',
                    category: 'deposit',
                    description: `Admin approved deposit request #${id}`,
                },
            });
            if (request.ownerType === 'company') {
                await tx.company.update({
                    where: { id: request.ownerId },
                    data: { walletBalance: { increment: request.amount } },
                });
            }
        });
        return { success: true, message: 'Deposit approved' };
    }
    async rejectDeposit(id, adminNotes) {
        const request = await this.prisma.depositRequest.findUnique({
            where: { id },
        });
        if (!request)
            throw new common_1.NotFoundException('Deposit request not found');
        if (request.status !== 'pending')
            throw new common_1.BadRequestException('Already processed');
        await this.prisma.depositRequest.update({
            where: { id },
            data: { status: 'rejected', adminNotes },
        });
        return { success: true, message: 'Deposit rejected' };
    }
    async approvePayout(id, adminNotes) {
        const request = await this.prisma.payoutRequest.findUnique({
            where: { id },
        });
        if (!request)
            throw new common_1.NotFoundException('Payout request not found');
        if (request.status !== 'pending')
            throw new common_1.BadRequestException('Already processed');
        await this.prisma.$transaction(async (tx) => {
            await tx.payoutRequest.update({
                where: { id },
                data: { status: 'approved', adminNotes },
            });
            await tx.transaction.create({
                data: {
                    ownerType: request.ownerType,
                    ownerId: request.ownerId,
                    amount: request.amount,
                    type: 'debit',
                    category: 'payout',
                    description: `Admin approved payout request #${id}`,
                },
            });
        });
        if (request.ownerType === 'company') {
            const company = await this.prisma.company.findUnique({
                where: { id: request.ownerId },
                select: { ownerId: true },
            });
            if (company) {
                await this.notificationsService
                    .notifyPayoutProcessed(company.ownerId, Number(request.amount))
                    .catch((e) => console.warn('Notification failed (payout):', e?.message));
            }
        }
        else if (request.ownerType === 'staff') {
            const staff = await this.prisma.companyStaff.findUnique({
                where: { id: request.ownerId },
                select: { userId: true },
            });
            if (staff) {
                await this.notificationsService
                    .createNotification(staff.userId, 'payout_processed', '💰 Payout Processed', `Your payout of $${Number(request.amount).toFixed(2)} has been processed.`, { amount: Number(request.amount) })
                    .catch((e) => console.warn('Notification failed (payout):', e?.message));
            }
        }
        return { success: true, message: 'Payout approved' };
    }
    async rejectPayout(id, adminNotes) {
        const request = await this.prisma.payoutRequest.findUnique({
            where: { id },
        });
        if (!request)
            throw new common_1.NotFoundException('Payout request not found');
        if (request.status !== 'pending')
            throw new common_1.BadRequestException('Already processed');
        await this.prisma.$transaction(async (tx) => {
            await tx.payoutRequest.update({
                where: { id },
                data: { status: 'rejected', adminNotes },
            });
            if (request.ownerType === 'company') {
                await tx.company.update({
                    where: { id: request.ownerId },
                    data: { walletBalance: { increment: request.amount } },
                });
            }
            else if (request.ownerType === 'staff') {
                await tx.companyStaff.update({
                    where: { id: request.ownerId },
                    data: { walletBalance: { increment: request.amount } },
                });
            }
        });
        return { success: true, message: 'Payout rejected and funds returned' };
    }
};
exports.WalletsService = WalletsService;
exports.WalletsService = WalletsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], WalletsService);
//# sourceMappingURL=wallets.service.js.map