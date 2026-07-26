import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class WalletsService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    getCompanyWallet(companyId: bigint, userId: bigint): Promise<{
        balance: import("@prisma/client/runtime/library").Decimal;
        transactions: {
            id: string;
            ownerId: string;
            bookingId: string | undefined;
            amount: number;
            description: string;
            createdAt: Date;
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
            bankName: string;
            proofOfTransferUrl: string;
            adminNotes: string | null;
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
            accountName: string;
            accountNumber: string;
            adminNotes: string | null;
            destinationBank: string;
        };
    }>;
    getStaffWallet(staffId: bigint, userId: bigint): Promise<{
        balance: import("@prisma/client/runtime/library").Decimal;
        transactions: {
            id: string;
            staffId: string;
            bookingId: string | undefined;
            amount: number;
            description: string | null;
            createdAt: Date;
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
            accountName: string;
            accountNumber: string;
            adminNotes: string | null;
            destinationBank: string;
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
            ownerType: string;
            accountName: string;
            accountNumber: string;
            adminNotes: string | null;
            destinationBank: string;
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
