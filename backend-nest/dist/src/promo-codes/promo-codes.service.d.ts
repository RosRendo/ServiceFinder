import { PrismaService } from '../prisma/prisma.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
export declare class PromoCodesService {
    private prisma;
    constructor(prisma: PrismaService);
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
    toggleActive(id: number): Promise<{
        id: string;
        discountPercent: number;
        createdAt: Date;
        isActive: boolean;
        code: string;
        expiresAt: Date | null;
        maxUses: number | null;
        usedCount: number;
    }>;
    deletePromoCode(id: number): Promise<{
        message: string;
    }>;
}
