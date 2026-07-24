import { PayoutsService } from './payouts.service';
export declare class PayoutsController {
    private readonly payoutsService;
    constructor(payoutsService: PayoutsService);
    private getCompanyId;
    getPayouts(req: any): Promise<{
        payouts: {
            id: number;
            companyId: bigint | null;
            staffId: bigint | null;
            payoutType: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            status: string;
            method: string;
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
            companyId: bigint | null;
            staffId: bigint | null;
            payoutType: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            status: string;
            method: string;
            transactionId: string | null;
            requestedAt: Date;
            processedAt: Date | null;
        };
    }>;
    getStaffPayouts(staffId: string, req: any): Promise<{
        payouts: {
            id: number;
            companyId: bigint | null;
            staffId: bigint | null;
            payoutType: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            status: string;
            method: string;
            transactionId: string | null;
            requestedAt: Date;
            processedAt: Date | null;
        }[];
    }>;
    approveStaffPayout(id: number, req: any): Promise<{
        message: string;
        payout: {
            id: number;
            companyId: bigint | null;
            staffId: bigint | null;
            payoutType: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            status: string;
            method: string;
            transactionId: string | null;
            requestedAt: Date;
            processedAt: Date | null;
        };
    }>;
    rejectStaffPayout(id: number, req: any): Promise<{
        message: string;
        payout: {
            id: number;
            companyId: bigint | null;
            staffId: bigint | null;
            payoutType: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            status: string;
            method: string;
            transactionId: string | null;
            requestedAt: Date;
            processedAt: Date | null;
        };
    }>;
    getPaymentMethods(req: any): Promise<{
        paymentMethods: {
            id: number;
            companyId: bigint;
            type: string;
            accountName: string;
            isDefault: boolean;
            isVerified: boolean;
            createdAt: Date;
        }[];
    }>;
    addPaymentMethod(req: any, body: any): Promise<{
        message: string;
        paymentMethod: {
            id: number;
            companyId: bigint;
            type: string;
            accountName: string;
            isDefault: boolean;
            isVerified: boolean;
            createdAt: Date;
        };
    }>;
    updatePaymentMethod(id: number, req: any, body: any): Promise<{
        message: string;
        paymentMethod: {
            id: number;
            companyId: bigint;
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
