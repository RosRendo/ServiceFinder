import { PrismaService } from '../prisma/prisma.service';
import { PayoutRequestDto, ProcessPayoutDto } from './dto/financials.dto';
export declare class FinancialsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getWallet(user: any): Promise<{
        balance: number;
        pendingWithdrawals: number;
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
    requestPayout(dto: PayoutRequestDto, user: any): Promise<{
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
    }>;
    getAllPayoutRequests(): Promise<{
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
    }[]>;
    processPayoutRequest(id: bigint, dto: ProcessPayoutDto): Promise<{
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
    }>;
}
