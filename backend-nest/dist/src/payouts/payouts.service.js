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
exports.PayoutsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PayoutsService = class PayoutsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCompanyByOwnerId(ownerId) {
        return this.prisma.company.findFirst({ where: { ownerId } });
    }
    async getPayouts(companyId) {
        try {
            const company = await this.prisma.company.findUnique({
                where: { id: companyId },
                select: { availableBalance: true, pendingBalance: true },
            });
            if (!company)
                throw new common_1.NotFoundException('Company not found');
            const payouts = await this.prisma.payout.findMany({
                where: { companyId },
                orderBy: { requestedAt: 'desc' },
            });
            return {
                payouts,
                availableBalance: Number(company.availableBalance),
                pendingBalance: Number(company.pendingBalance),
            };
        }
        catch (e) {
            throw e;
        }
    }
    async requestPayout(companyId, amount, method) {
        if (amount <= 0)
            throw new common_1.BadRequestException('Amount must be positive');
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: { availableBalance: true, pendingBalance: true },
        });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        const available = Number(company.availableBalance);
        if (amount > available) {
            throw new common_1.BadRequestException(`Insufficient balance. Available: $${available.toFixed(2)}`);
        }
        const payout = await this.prisma.payout.create({
            data: {
                companyId,
                amount,
                method,
                status: 'pending',
                payoutType: 'company',
            },
        });
        return { message: 'Payout request submitted', payout };
    }
    async getStaffPayouts(staffId) {
        const staff = await this.prisma.companyStaff.findUnique({
            where: { id: staffId },
        });
        if (!staff)
            throw new common_1.NotFoundException('Staff not found');
        const payouts = await this.prisma.payout.findMany({
            where: { staffId: staff.id },
            orderBy: { requestedAt: 'desc' },
        });
        const availableBalance = Number(staff.walletBalance);
        return { success: true, payouts, availableBalance };
    }
    async requestStaffPayout(staffId, amount, method) {
        if (amount <= 0)
            throw new common_1.BadRequestException('Amount must be positive');
        const staff = await this.prisma.companyStaff.findUnique({
            where: { id: staffId },
        });
        if (!staff)
            throw new common_1.NotFoundException('Staff not found');
        const available = Number(staff.walletBalance);
        if (amount > available) {
            throw new common_1.BadRequestException(`Insufficient balance. Available: $${available.toFixed(2)}`);
        }
        const payout = await this.prisma.$transaction(async (tx) => {
            const p = await tx.payout.create({
                data: {
                    staffId,
                    amount,
                    method,
                    status: 'pending',
                    payoutType: 'staff',
                },
            });
            await tx.companyStaff.update({
                where: { id: staffId },
                data: { walletBalance: { decrement: amount } },
            });
            await tx.walletTransaction.create({
                data: {
                    staffId,
                    amount,
                    type: 'debit',
                    description: `Payout request to ${method}`,
                },
            });
            return p;
        });
        return { message: 'Payout request submitted', payout };
    }
    async getStaffPayoutsForCompanyMember(staffId, companyId) {
        try {
            const staff = await this.prisma.companyStaff.findFirst({
                where: { id: staffId, companyId },
            });
            if (!staff)
                throw new common_1.ForbiddenException('Staff does not belong to your company');
            const payouts = await this.prisma.payout.findMany({
                where: { staffId, payoutType: 'staff' },
                orderBy: { requestedAt: 'desc' },
            });
            return { payouts };
        }
        catch (e) {
            console.error('\n\n=========================================\nCRITICAL STAFF PAYOUT ERROR:', e, '\n=========================================\n\n');
            throw e;
        }
    }
    async approveStaffPayout(payoutId, companyId) {
        const payout = await this.prisma.payout.findUnique({
            where: { id: payoutId },
            include: { staff: true },
        });
        if (!payout || payout.payoutType !== 'staff' || !payout.staff) {
            throw new common_1.NotFoundException('Payout not found or staff missing');
        }
        if (payout.staff.companyId !== companyId) {
            throw new common_1.ForbiddenException('You cannot approve this payout');
        }
        if (payout.status !== 'pending') {
            throw new common_1.BadRequestException('Payout is not pending');
        }
        const updated = await this.prisma.payout.update({
            where: { id: payoutId },
            data: {
                status: 'completed',
                processedAt: new Date(),
            },
        });
        return { message: 'Payout approved', payout: updated };
    }
    async rejectStaffPayout(payoutId, companyId) {
        const payout = await this.prisma.payout.findUnique({
            where: { id: payoutId },
            include: { staff: true },
        });
        if (!payout || payout.payoutType !== 'staff' || !payout.staff) {
            throw new common_1.NotFoundException('Payout not found or staff missing');
        }
        if (payout.staff.companyId !== companyId) {
            throw new common_1.ForbiddenException('You cannot reject this payout');
        }
        if (payout.status !== 'pending') {
            throw new common_1.BadRequestException('Payout is not pending');
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const p = await tx.payout.update({
                where: { id: payoutId },
                data: {
                    status: 'failed',
                    processedAt: new Date(),
                },
            });
            await tx.companyStaff.update({
                where: { id: payout.staffId },
                data: { walletBalance: { increment: payout.amount } },
            });
            await tx.walletTransaction.create({
                data: {
                    staffId: payout.staffId,
                    amount: payout.amount,
                    type: 'credit',
                    description: `Refund for rejected payout request`,
                },
            });
            return p;
        });
        return { message: 'Payout rejected and refunded', payout: updated };
    }
    async getPaymentMethods(companyId) {
        const methods = await this.prisma.companyPaymentMethod.findMany({
            where: { companyId },
            select: {
                id: true,
                companyId: true,
                type: true,
                accountName: true,
                isDefault: true,
                isVerified: true,
                createdAt: true,
            },
        });
        return { paymentMethods: methods };
    }
    async addPaymentMethod(companyId, dto) {
        if (dto.isDefault) {
            await this.prisma.companyPaymentMethod.updateMany({
                where: { companyId },
                data: { isDefault: false },
            });
        }
        const method = await this.prisma.companyPaymentMethod.create({
            data: {
                companyId,
                type: dto.type,
                accountName: dto.accountName,
                accountNumber: dto.accountNumber,
                routingNumber: dto.routingNumber ?? null,
                isDefault: dto.isDefault ?? false,
            },
            select: {
                id: true,
                companyId: true,
                type: true,
                accountName: true,
                isDefault: true,
                isVerified: true,
                createdAt: true,
            },
        });
        return { message: 'Payment method added', paymentMethod: method };
    }
    async updatePaymentMethod(id, companyId, dto) {
        const method = await this.prisma.companyPaymentMethod.findUnique({
            where: { id },
        });
        if (!method)
            throw new common_1.NotFoundException('Payment method not found');
        if (method.companyId !== companyId)
            throw new common_1.ForbiddenException('Not your payment method');
        if (dto.isDefault) {
            await this.prisma.companyPaymentMethod.updateMany({
                where: { companyId },
                data: { isDefault: false },
            });
        }
        const updated = await this.prisma.companyPaymentMethod.update({
            where: { id },
            data: { accountName: dto.accountName, isDefault: dto.isDefault },
            select: {
                id: true,
                companyId: true,
                type: true,
                accountName: true,
                isDefault: true,
                isVerified: true,
            },
        });
        return { message: 'Payment method updated', paymentMethod: updated };
    }
    async deletePaymentMethod(id, companyId) {
        const method = await this.prisma.companyPaymentMethod.findUnique({
            where: { id },
        });
        if (!method)
            throw new common_1.NotFoundException('Payment method not found');
        if (method.companyId !== companyId)
            throw new common_1.ForbiddenException('Not your payment method');
        await this.prisma.companyPaymentMethod.delete({ where: { id } });
        return { message: 'Payment method deleted' };
    }
    async getStaffPaymentMethods(staffId) {
        const methods = await this.prisma.staffPaymentMethod.findMany({
            where: { staffId },
            select: {
                id: true,
                staffId: true,
                type: true,
                accountName: true,
                accountNumber: true,
                routingNumber: true,
                qrCodeUrl: true,
                isDefault: true,
                isVerified: true,
                createdAt: true,
            },
        });
        return { success: true, paymentMethods: methods };
    }
    async addStaffPaymentMethod(staffId, dto) {
        if (dto.isDefault) {
            await this.prisma.staffPaymentMethod.updateMany({
                where: { staffId },
                data: { isDefault: false },
            });
        }
        const method = await this.prisma.staffPaymentMethod.create({
            data: {
                staffId,
                type: dto.type,
                accountName: dto.accountName,
                accountNumber: dto.accountNumber,
                routingNumber: dto.routingNumber ?? null,
                qrCodeUrl: dto.qrCodeUrl ?? null,
                isDefault: dto.isDefault ?? false,
            },
            select: {
                id: true,
                staffId: true,
                type: true,
                accountName: true,
                accountNumber: true,
                routingNumber: true,
                qrCodeUrl: true,
                isDefault: true,
                isVerified: true,
                createdAt: true,
            },
        });
        return { message: 'Payment method added', paymentMethod: method };
    }
    async updateStaffPaymentMethod(id, staffId, dto) {
        const method = await this.prisma.staffPaymentMethod.findUnique({
            where: { id },
        });
        if (!method)
            throw new common_1.NotFoundException('Payment method not found');
        if (method.staffId !== staffId)
            throw new common_1.ForbiddenException('Not your payment method');
        if (dto.isDefault) {
            await this.prisma.staffPaymentMethod.updateMany({
                where: { staffId },
                data: { isDefault: false },
            });
        }
        const updated = await this.prisma.staffPaymentMethod.update({
            where: { id },
            data: { accountName: dto.accountName, isDefault: dto.isDefault },
            select: {
                id: true,
                staffId: true,
                type: true,
                accountName: true,
                isDefault: true,
                isVerified: true,
            },
        });
        return { message: 'Payment method updated', paymentMethod: updated };
    }
    async deleteStaffPaymentMethod(id, staffId) {
        const method = await this.prisma.staffPaymentMethod.findUnique({
            where: { id },
        });
        if (!method)
            throw new common_1.NotFoundException('Payment method not found');
        if (method.staffId !== staffId)
            throw new common_1.ForbiddenException('Not your payment method');
        await this.prisma.staffPaymentMethod.delete({ where: { id } });
        return { message: 'Payment method deleted' };
    }
    async getAllPayouts(status, type) {
        const where = {};
        if (status)
            where.status = status;
        if (type)
            where.payoutType = type;
        const payouts = await this.prisma.payout.findMany({
            where,
            orderBy: { requestedAt: 'desc' },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        owner: { select: { fullName: true, email: true } },
                        paymentMethods: true,
                    },
                },
                staff: {
                    select: {
                        id: true,
                        user: { select: { fullName: true, email: true } },
                        paymentMethods: true,
                    },
                },
            },
        });
        return { payouts };
    }
    async processPayout(payoutId, adminUserId, transactionId) {
        const payout = await this.prisma.payout.findUnique({
            where: { id: payoutId },
        });
        if (!payout)
            throw new common_1.NotFoundException('Payout not found');
        if (payout.status === 'completed') {
            throw new common_1.BadRequestException('Payout already completed');
        }
        const updated = await this.prisma.payout.update({
            where: { id: payoutId },
            data: {
                status: 'completed',
                processedAt: new Date(),
                transactionId,
            },
        });
        return { message: 'Payout marked as completed', payout: updated };
    }
};
exports.PayoutsService = PayoutsService;
exports.PayoutsService = PayoutsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PayoutsService);
//# sourceMappingURL=payouts.service.js.map