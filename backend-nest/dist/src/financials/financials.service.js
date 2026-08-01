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
exports.FinancialsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FinancialsService = class FinancialsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getWallet(user) {
        if (user.role !== 'company_admin') {
            throw new common_1.BadRequestException('Only companies have a wallet.');
        }
        const company = await this.prisma.company.findFirst({
            where: { ownerId: BigInt(user.id) },
        });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        const transactions = await this.prisma.transaction.findMany({
            where: { ownerType: 'company', ownerId: company.id },
            orderBy: { createdAt: 'desc' },
        });
        const balance = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
        const payouts = await this.prisma.payoutRequest.findMany({
            where: { ownerType: 'company', ownerId: company.id },
            orderBy: { createdAt: 'desc' },
        });
        const pendingAmount = payouts
            .filter((p) => p.status === 'pending')
            .reduce((sum, req) => sum + Number(req.amount), 0);
        return {
            balance: Number(company.availableBalance),
            pendingBalance: Number(company.pendingBalance),
            pendingWithdrawals: pendingAmount,
            payouts: payouts.map((p) => ({
                ...p,
                id: p.id.toString(),
                ownerId: p.ownerId.toString(),
                amount: Number(p.amount),
            })),
            transactions: transactions.map((t) => ({
                ...t,
                id: t.id.toString(),
                ownerId: t.ownerId.toString(),
                bookingId: t.bookingId?.toString(),
                amount: Number(t.amount),
            })),
        };
    }
    async requestPayout(dto, user) {
        if (user.role !== 'company_admin') {
            throw new common_1.BadRequestException('Only companies can request payouts.');
        }
        const company = await this.prisma.company.findFirst({
            where: { ownerId: BigInt(user.id) },
        });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        return this.prisma.$transaction(async (tx) => {
            const transactions = await tx.transaction.findMany({
                where: { ownerType: 'company', ownerId: company.id },
            });
            const balance = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
            if (balance < dto.amount) {
                throw new common_1.BadRequestException('Insufficient balance.');
            }
            const request = await tx.payoutRequest.create({
                data: {
                    ownerType: 'company',
                    ownerId: company.id,
                    amount: dto.amount,
                    destinationBank: dto.destinationBank,
                    accountName: dto.accountName,
                    accountNumber: dto.accountNumber,
                    status: 'pending',
                },
            });
            await tx.transaction.create({
                data: {
                    ownerType: 'company',
                    ownerId: company.id,
                    amount: -dto.amount,
                    type: 'debit',
                    category: 'payout',
                    description: `Withdrawal request #${request.id}`,
                },
            });
            return {
                ...request,
                id: request.id.toString(),
                ownerId: request.ownerId.toString(),
                amount: Number(request.amount),
            };
        });
    }
    async getAllPayoutRequests() {
        const requests = await this.prisma.payoutRequest.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return requests.map((r) => ({
            ...r,
            id: r.id.toString(),
            ownerId: r.ownerId.toString(),
            amount: Number(r.amount),
        }));
    }
    async processPayoutRequest(id, dto) {
        const request = await this.prisma.payoutRequest.findUnique({
            where: { id },
        });
        if (!request)
            throw new common_1.NotFoundException('Payout request not found');
        if (request.status !== 'pending') {
            throw new common_1.ConflictException(`Request is already ${request.status}`);
        }
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.payoutRequest.update({
                where: { id },
                data: {
                    status: dto.status,
                    adminNotes: dto.adminNotes,
                },
            });
            if (dto.status === 'rejected') {
                await tx.transaction.create({
                    data: {
                        ownerType: request.ownerType,
                        ownerId: request.ownerId,
                        amount: request.amount,
                        type: 'credit',
                        category: 'refund',
                        description: `Refund for rejected payout request #${request.id}`,
                    },
                });
            }
            return {
                ...updated,
                id: updated.id.toString(),
                ownerId: updated.ownerId.toString(),
                amount: Number(updated.amount),
            };
        });
    }
};
exports.FinancialsService = FinancialsService;
exports.FinancialsService = FinancialsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinancialsService);
//# sourceMappingURL=financials.service.js.map