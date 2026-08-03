import { PrismaService } from '../prisma/prisma.service';
import { PayoutRequestDto, ProcessPayoutDto } from './dto/financials.dto';
export declare class FinancialsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getWallet(user: any): Promise<{
        balance: number;
        pendingBalance: number;
        pendingWithdrawals: number;
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
    requestPayout(dto: PayoutRequestDto, user: any): Promise<{
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
    }>;
    getAllPayoutRequests(): Promise<{
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
    }[]>;
    processPayoutRequest(id: bigint, dto: ProcessPayoutDto): Promise<{
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
    }>;
}
