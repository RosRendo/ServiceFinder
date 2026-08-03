import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class WalletsService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    calculateCompanyLedgerBalances(companyId: bigint): Promise<{
        pendingBalance: number;
        availableBalance: number;
        outstandingFees: number;
        transactions: {
            id: bigint;
            createdAt: Date;
            description: string;
            ownerId: bigint;
            category: string;
            bookingId: bigint | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            type: string;
            ownerType: string;
        }[];
    }>;
    getMyCompanyWallet(userId: bigint): Promise<{
        payouts: {
            id: string;
            ownerId: string;
            amount: number;
            requestedAt: Date;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            ownerType: string;
            destinationBank: string;
            accountName: string;
            accountNumber: string;
            adminNotes: string | null;
        }[];
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
    requestMyCompanyPayout(userId: bigint, dto: any): Promise<{
        success: boolean;
        request: {
            id: string;
            ownerId: string;
            amount: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            ownerType: string;
            destinationBank: string;
            accountName: string;
            accountNumber: string;
            adminNotes: string | null;
        };
    }>;
    getCompanyWallet(companyId: bigint, userId: bigint): Promise<{
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
    requestDeposit(companyId: bigint, userId: bigint, dto: {
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
            adminNotes: string | null;
            bankName: string;
            proofOfTransferUrl: string;
        };
    }>;
    requestPayout(companyId: bigint, userId: bigint, dto: {
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
            ownerType: string;
            destinationBank: string;
            accountName: string;
            accountNumber: string;
            adminNotes: string | null;
        };
    }>;
    getStaffWallet(staffId: bigint, userId: bigint): Promise<{
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
    requestStaffPayout(staffId: bigint, userId: bigint, dto: {
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
            ownerType: string;
            destinationBank: string;
            accountName: string;
            accountNumber: string;
            adminNotes: string | null;
        };
    }>;
    clearStaffDebt(companyId: bigint, staffId: bigint, userId: bigint, amount: number): Promise<{
        success: boolean;
        message: string;
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
            adminNotes: string | null;
            bankName: string;
            proofOfTransferUrl: string;
        }[];
        payouts: {
            id: string;
            ownerId: string;
            amount: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            ownerType: string;
            destinationBank: string;
            accountName: string;
            accountNumber: string;
            adminNotes: string | null;
        }[];
    }>;
    approveDeposit(id: bigint, adminNotes?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectDeposit(id: bigint, adminNotes?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    approvePayout(id: bigint, adminNotes?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectPayout(id: bigint, adminNotes?: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
