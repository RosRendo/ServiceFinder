import { PayoutsService } from './payouts.service';
export declare class PayoutsController {
    private readonly payoutsService;
    constructor(payoutsService: PayoutsService);
    private getCompanyId;
    getPayouts(req: any): Promise<{
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
    getStaffPayouts(staffId: string, req: any): Promise<{
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
    }>;
    approveStaffPayout(id: number, req: any): Promise<{
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
    rejectStaffPayout(id: number, req: any): Promise<{
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
        paymentMethods: {
            id: number;
            createdAt: Date;
            companyId: bigint;
            type: string;
            accountName: string;
            isDefault: boolean;
            isVerified: boolean;
        }[];
    }>;
    addPaymentMethod(req: any, body: any): Promise<{
        message: string;
        paymentMethod: {
            id: number;
            createdAt: Date;
            companyId: bigint;
            type: string;
            accountName: string;
            isDefault: boolean;
            isVerified: boolean;
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
