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
exports.PricingRulesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PricingRulesService = class PricingRulesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCompanyOrThrow(ownerId) {
        const company = await this.prisma.company.findFirst({
            where: { ownerId },
        });
        if (!company) {
            throw new common_1.NotFoundException('You do not own a company');
        }
        return company;
    }
    async getPricingRules(ownerId) {
        const company = await this.getCompanyOrThrow(ownerId);
        const rules = await this.prisma.pricingRule.findMany({
            where: { companyId: company.id },
            orderBy: { id: 'desc' },
        });
        return rules.map((r) => ({
            ...r,
            id: r.id.toString(),
            companyId: r.companyId.toString(),
            surchargePercent: Number(r.surchargePercent),
        }));
    }
    async createPricingRule(ownerId, dto) {
        const company = await this.getCompanyOrThrow(ownerId);
        const created = await this.prisma.pricingRule.create({
            data: {
                companyId: company.id,
                name: dto.name,
                dayOfWeek: dto.dayOfWeek !== undefined ? dto.dayOfWeek : null,
                startHour: dto.startHour !== undefined ? dto.startHour : null,
                endHour: dto.endHour !== undefined ? dto.endHour : null,
                surchargePercent: dto.surchargePercent,
                isActive: dto.isActive !== undefined ? dto.isActive : true,
            },
        });
        return {
            ...created,
            id: created.id.toString(),
            companyId: created.companyId.toString(),
            surchargePercent: Number(created.surchargePercent),
        };
    }
    async toggleActive(ownerId, ruleId) {
        const company = await this.getCompanyOrThrow(ownerId);
        const rule = await this.prisma.pricingRule.findUnique({
            where: { id: ruleId },
        });
        if (!rule)
            throw new common_1.NotFoundException('Pricing rule not found');
        if (rule.companyId !== company.id)
            throw new common_1.ForbiddenException('Access denied');
        const updated = await this.prisma.pricingRule.update({
            where: { id: ruleId },
            data: { isActive: !rule.isActive },
        });
        return {
            ...updated,
            id: updated.id.toString(),
            companyId: updated.companyId.toString(),
            surchargePercent: Number(updated.surchargePercent),
        };
    }
    async deletePricingRule(ownerId, ruleId) {
        const company = await this.getCompanyOrThrow(ownerId);
        const rule = await this.prisma.pricingRule.findUnique({
            where: { id: ruleId },
        });
        if (!rule)
            throw new common_1.NotFoundException('Pricing rule not found');
        if (rule.companyId !== company.id)
            throw new common_1.ForbiddenException('Access denied');
        await this.prisma.pricingRule.delete({
            where: { id: ruleId },
        });
        return { success: true, message: 'Pricing rule deleted successfully' };
    }
};
exports.PricingRulesService = PricingRulesService;
exports.PricingRulesService = PricingRulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PricingRulesService);
//# sourceMappingURL=pricing-rules.service.js.map