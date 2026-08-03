import { PayoutsService } from './payouts.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class StaffPayoutsController {
    private readonly payoutsService;
    private readonly prisma;
    constructor(payoutsService: PayoutsService, prisma: PrismaService);
    private getStaffId;
    getPayouts(req: any): Promise<{
        success: boolean;
        payouts: {
            id: number;
            status: string;
            companyId: bigint | null;
            method: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            staffId: bigint | null;
            payoutType: string;
            transactionId: string | null;
            requestedAt: Date;
            processedAt: Date | null;
        }[];
        availableBalance: number;
    }>;
    requestPayout(req: any, body: {
        amount: number;
        method: string;
    }): Promise<{
        message: string;
        payout: {
            id: number;
            status: string;
            companyId: bigint | null;
            method: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            staffId: bigint | null;
            payoutType: string;
            transactionId: string | null;
            requestedAt: Date;
            processedAt: Date | null;
        };
    }>;
    getPaymentMethods(req: any): Promise<{
        success: boolean;
        paymentMethods: {
            id: number;
            createdAt: Date;
            staffId: bigint;
            type: string;
            accountName: string;
            accountNumber: string;
            qrCodeUrl: string | null;
            routingNumber: string | null;
            isDefault: boolean;
            isVerified: boolean;
        }[];
    }>;
    addPaymentMethod(req: any, body: any): Promise<{
        message: string;
        paymentMethod: {
            id: number;
            createdAt: Date;
            staffId: bigint;
            type: string;
            accountName: string;
            accountNumber: string;
            qrCodeUrl: string | null;
            routingNumber: string | null;
            isDefault: boolean;
            isVerified: boolean;
        };
    }>;
    updatePaymentMethod(id: number, req: any, body: any): Promise<{
        message: string;
        paymentMethod: {
            id: number;
            staffId: bigint;
            type: string;
            accountName: string;
            isDefault: boolean;
            isVerified: boolean;
        };
    }>;
    deletePaymentMethod(id: number, req: any): Promise<{
        message: string;
    }>;
}
