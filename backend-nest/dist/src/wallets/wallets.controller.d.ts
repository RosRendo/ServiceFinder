import { WalletsService } from './wallets.service';
export declare class WalletsController {
    private readonly walletsService;
    constructor(walletsService: WalletsService);
    getCompanyWallet(id: string, req: any): Promise<{
        balance: number;
        pendingBalance: number;
        availableBalance: number;
        outstandingFees: number;
        totalPaidOut: number;
        transactions: {
            id: string;
            ownerId: string;
            bookingId: string | undefined;
            amount: number;
            createdAt: Date;
            description: string;
            category: string;
            type: string;
            ownerType: string;
        }[];
    }>;
    requestDeposit(id: string, req: any, dto: {
        amount: number;
        bankName: string;
        proofOfTransferUrl: string;
    }): Promise<{
        success: boolean;
        request: {
            id: string;
            ownerId: string;
            amount: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            ownerType: string;
            bankName: string;
            proofOfTransferUrl: string;
            adminNotes: string | null;
        };
    }>;
    requestPayout(id: string, req: any, dto: {
        amount: number;
        destinationBank: string;
        accountName: string;
        accountNumber: string;
    }): Promise<{
        success: boolean;
        request: {
            id: string;
            ownerId: string;
            amount: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            accountName: string;
            accountNumber: string;
            ownerType: string;
            adminNotes: string | null;
            destinationBank: string;
        };
    }>;
    clearStaffDebt(id: string, staffId: string, req: any, dto: {
        amount: number;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getStaffWallet(id: string, req: any): Promise<{
        success: boolean;
        balance: import("@prisma/client/runtime/library").Decimal;
        transactions: {
            id: string;
            staffId: string;
            bookingId: string | undefined;
            amount: number;
            createdAt: Date;
            description: string | null;
            type: string;
        }[];
    }>;
    requestStaffPayout(id: string, req: any, dto: {
        amount: number;
        destinationBank: string;
        accountName: string;
        accountNumber: string;
    }): Promise<{
        success: boolean;
        request: {
            id: string;
            ownerId: string;
            amount: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            accountName: string;
            accountNumber: string;
            ownerType: string;
            adminNotes: string | null;
            destinationBank: string;
        };
    }>;
    getAdminPendingRequests(): Promise<{
        deposits: {
            id: string;
            ownerId: string;
            amount: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            ownerType: string;
            bankName: string;
            proofOfTransferUrl: string;
            adminNotes: string | null;
        }[];
        payouts: {
            id: string;
            ownerId: string;
            amount: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            accountName: string;
            accountNumber: string;
            ownerType: string;
            adminNotes: string | null;
            destinationBank: string;
        }[];
    }>;
    approveDeposit(id: string, dto: {
        adminNotes?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectDeposit(id: string, dto: {
        adminNotes?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    approvePayout(id: string, dto: {
        adminNotes?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectPayout(id: string, dto: {
        adminNotes?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
