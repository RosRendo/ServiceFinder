import { PricingRulesService } from './pricing-rules.service';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';
export declare class PricingRulesController {
    private readonly pricingRulesService;
    constructor(pricingRulesService: PricingRulesService);
    getPricingRules(user: any): Promise<{
        id: string;
        companyId: string;
        surchargePercent: number;
        name: string;
        isActive: boolean;
        dayOfWeek: number | null;
        startHour: number | null;
        endHour: number | null;
    }[]>;
    createPricingRule(dto: CreatePricingRuleDto, user: any): Promise<{
        id: string;
        companyId: string;
        surchargePercent: number;
        name: string;
        isActive: boolean;
        dayOfWeek: number | null;
        startHour: number | null;
        endHour: number | null;
    }>;
    toggleActive(id: string, user: any): Promise<{
        id: string;
        companyId: string;
        surchargePercent: number;
        name: string;
        isActive: boolean;
        dayOfWeek: number | null;
        startHour: number | null;
        endHour: number | null;
    }>;
    deletePricingRule(id: string, user: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
