import { PrismaService } from '../prisma/prisma.service';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';
export declare class PricingRulesService {
    private prisma;
    constructor(prisma: PrismaService);
    private getCompanyOrThrow;
    getPricingRules(ownerId: bigint): Promise<{
        id: string;
        companyId: string;
        surchargePercent: number;
        name: string;
        isActive: boolean;
        dayOfWeek: number | null;
        startHour: number | null;
        endHour: number | null;
    }[]>;
    createPricingRule(ownerId: bigint, dto: CreatePricingRuleDto): Promise<{
        id: string;
        companyId: string;
        surchargePercent: number;
        name: string;
        isActive: boolean;
        dayOfWeek: number | null;
        startHour: number | null;
        endHour: number | null;
    }>;
    toggleActive(ownerId: bigint, ruleId: number): Promise<{
        id: string;
        companyId: string;
        surchargePercent: number;
        name: string;
        isActive: boolean;
        dayOfWeek: number | null;
        startHour: number | null;
        endHour: number | null;
    }>;
    deletePricingRule(ownerId: bigint, ruleId: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
