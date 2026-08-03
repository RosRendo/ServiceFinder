import { PromoCodesService } from './promo-codes.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
export declare class PromoCodesController {
    private readonly promoCodesService;
    constructor(promoCodesService: PromoCodesService);
    getAllPromoCodes(): Promise<{
        id: string;
        discountPercent: number;
        createdAt: Date;
        isActive: boolean;
        code: string;
        maxUses: number | null;
        usedCount: number;
        expiresAt: Date | null;
    }[]>;
    createPromoCode(dto: CreatePromoCodeDto): Promise<{
        id: string;
        discountPercent: number;
        createdAt: Date;
        isActive: boolean;
        code: string;
        maxUses: number | null;
        usedCount: number;
        expiresAt: Date | null;
    }>;
    validatePromoCode(code: string): Promise<{
        valid: boolean;
        id: string;
        code: string;
        discountPercent: number;
    }>;
    toggleActive(id: string): Promise<{
        id: string;
        discountPercent: number;
        createdAt: Date;
        isActive: boolean;
        code: string;
        maxUses: number | null;
        usedCount: number;
        expiresAt: Date | null;
    }>;
    deletePromoCode(id: string): Promise<{
        message: string;
    }>;
}
