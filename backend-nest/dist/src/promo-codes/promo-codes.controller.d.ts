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
        expiresAt: Date | null;
        maxUses: number | null;
        usedCount: number;
    }[]>;
    createPromoCode(dto: CreatePromoCodeDto): Promise<{
        id: string;
        discountPercent: number;
        createdAt: Date;
        isActive: boolean;
        code: string;
        expiresAt: Date | null;
        maxUses: number | null;
        usedCount: number;
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
        expiresAt: Date | null;
        maxUses: number | null;
        usedCount: number;
    }>;
    deletePromoCode(id: string): Promise<{
        message: string;
    }>;
}
