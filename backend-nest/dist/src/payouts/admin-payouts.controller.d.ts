import { PayoutsService } from './payouts.service';
export declare class AdminPayoutsController {
    private readonly payoutsService;
    constructor(payoutsService: PayoutsService);
    getAllPayouts(status?: string, type?: string): Promise<{
        payouts: ({
            staff: {
                id: bigint;
                user: {
                    email: string | null;
                    fullName: string;
                };
                paymentMethods: {
                    id: number;
                    createdAt: Date;
                    staffId: bigint;
                    qrCodeUrl: string | null;
                    type: string;
                    accountName: string;
                    accountNumber: string;
                    routingNumber: string | null;
                    isDefault: boolean;
                    isVerified: boolean;
                }[];
            } | null;
            company: {
                id: bigint;
                name: string;
                owner: {
                    email: string | null;
                    fullName: string;
                };
                paymentMethods: {
                    id: number;
                    createdAt: Date;
                    companyId: bigint;
                    qrCodeUrl: string | null;
                    type: string;
                    accountName: string;
                    accountNumber: string;
                    routingNumber: string | null;
                    isDefault: boolean;
                    isVerified: boolean;
                }[];
            } | null;
        } & {
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
        })[];
    }>;
    processPayout(id: number, req: any, body: {
        transactionId?: string;
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
}
