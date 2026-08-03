import { PayoutsService } from './payouts.service';
export declare class AdminPayoutsController {
    private readonly payoutsService;
    constructor(payoutsService: PayoutsService);
    getAllPayouts(status?: string, type?: string): Promise<{
        payouts: ({
            company: {
                id: bigint;
                paymentMethods: {
                    id: number;
                    createdAt: Date;
                    companyId: bigint;
                    type: string;
                    accountName: string;
                    accountNumber: string;
                    qrCodeUrl: string | null;
                    routingNumber: string | null;
                    isDefault: boolean;
                    isVerified: boolean;
                }[];
                name: string;
                owner: {
                    fullName: string;
                    email: string | null;
                };
            } | null;
            staff: {
                id: bigint;
                user: {
                    fullName: string;
                    email: string | null;
                };
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
