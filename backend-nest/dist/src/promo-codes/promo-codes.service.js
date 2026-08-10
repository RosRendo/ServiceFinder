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
exports.PromoCodesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PromoCodesService = class PromoCodesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllPromoCodes() {
        const codes = await this.prisma.promoCode.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return codes.map((c) => ({
            ...c,
            id: c.id.toString(),
            discountPercent: Number(c.discountPercent),
        }));
    }
    async createPromoCode(dto) {
        const existing = await this.prisma.promoCode.findUnique({
            where: { code: dto.code.toUpperCase() },
        });
        if (existing) {
            throw new common_1.BadRequestException('Promo code already exists');
        }
        const created = await this.prisma.promoCode.create({
            data: {
                code: dto.code.toUpperCase(),
                discountPercent: dto.discountPercent,
                maxUses: dto.maxUses || null,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                isActive: dto.isActive !== undefined ? dto.isActive : true,
            },
        });
        return {
            ...created,
            id: created.id.toString(),
            discountPercent: Number(created.discountPercent),
        };
    }
    async validatePromoCode(code) {
        const promo = await this.prisma.promoCode.findUnique({
            where: { code: code.toUpperCase() },
        });
        if (!promo) {
            throw new common_1.NotFoundException('Invalid promo code');
        }
        if (!promo.isActive) {
            throw new common_1.BadRequestException('Promo code is inactive');
        }
        if (promo.expiresAt && new Date() > promo.expiresAt) {
            throw new common_1.BadRequestException('Promo code has expired');
        }
        if (promo.maxUses && promo.usedCount >= promo.maxUses) {
            throw new common_1.BadRequestException('Promo code usage limit reached');
        }
        return {
            valid: true,
            id: promo.id.toString(),
            code: promo.code,
            discountPercent: Number(promo.discountPercent),
        };
    }
    async toggleActive(id) {
        const promo = await this.prisma.promoCode.findUnique({ where: { id } });
        if (!promo)
            throw new common_1.NotFoundException('Promo code not found');
        const updated = await this.prisma.promoCode.update({
            where: { id },
            data: { isActive: !promo.isActive },
        });
        return {
            ...updated,
            id: updated.id.toString(),
            discountPercent: Number(updated.discountPercent),
        };
    }
    async deletePromoCode(id) {
        const promo = await this.prisma.promoCode.findUnique({ where: { id } });
        if (!promo)
            throw new common_1.NotFoundException('Promo code not found');
        await this.prisma.promoCode.delete({ where: { id } });
        return { message: 'Promo code deleted successfully' };
    }
};
exports.PromoCodesService = PromoCodesService;
exports.PromoCodesService = PromoCodesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PromoCodesService);
//# sourceMappingURL=promo-codes.service.js.map