import { PrismaService } from '../prisma/prisma.service';
import { CreateDisputeDto, RespondToDisputeDto, ResolveDisputeDto } from './dto/dispute.dto';
export declare class DisputesService {
    private prisma;
    constructor(prisma: PrismaService);
    fileDispute(bookingId: bigint, customerId: bigint, dto: CreateDisputeDto): Promise<{
        message: string;
        dispute: {
            id: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: bigint;
            companyId: bigint;
            description: string;
            bookingId: bigint;
            type: string;
            photos: string | null;
            companyResponse: string | null;
            adminDecision: string | null;
            refundAmount: import("@prisma/client/runtime/library").Decimal | null;
            frozenAmount: import("@prisma/client/runtime/library").Decimal | null;
            resolvedAt: Date | null;
        };
    }>;
    getDisputes(role: string, userId: bigint, companyId?: bigint): Promise<{
        disputes: ({
            company: {
                id: bigint;
                name: string;
            };
            customer: {
                id: bigint;
                fullName: string;
                email: string | null;
            };
            booking: {
                id: bigint;
                bookingDate: Date;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: bigint;
            companyId: bigint;
            description: string;
            bookingId: bigint;
            type: string;
            photos: string | null;
            companyResponse: string | null;
            adminDecision: string | null;
            refundAmount: import("@prisma/client/runtime/library").Decimal | null;
            frozenAmount: import("@prisma/client/runtime/library").Decimal | null;
            resolvedAt: Date | null;
        })[];
    }>;
    getDisputeById(id: number, userId: bigint, role: string): Promise<{
        dispute: {
            company: {
                id: bigint;
                name: string;
                logoUrl: string | null;
            };
            customer: {
                id: bigint;
                fullName: string;
                email: string | null;
                avatar: string | null;
            };
            booking: {
                id: bigint;
                bookingDate: Date;
                serviceAddress: string;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: bigint;
            companyId: bigint;
            description: string;
            bookingId: bigint;
            type: string;
            photos: string | null;
            companyResponse: string | null;
            adminDecision: string | null;
            refundAmount: import("@prisma/client/runtime/library").Decimal | null;
            frozenAmount: import("@prisma/client/runtime/library").Decimal | null;
            resolvedAt: Date | null;
        };
    }>;
    respondToDispute(id: number, companyId: bigint, dto: RespondToDisputeDto): Promise<{
        message: string;
        dispute: {
            id: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: bigint;
            companyId: bigint;
            description: string;
            bookingId: bigint;
            type: string;
            photos: string | null;
            companyResponse: string | null;
            adminDecision: string | null;
            refundAmount: import("@prisma/client/runtime/library").Decimal | null;
            frozenAmount: import("@prisma/client/runtime/library").Decimal | null;
            resolvedAt: Date | null;
        };
    }>;
    resolveDispute(id: number, dto: ResolveDisputeDto): Promise<{
        message: string;
        dispute: {
            id: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: bigint;
            companyId: bigint;
            description: string;
            bookingId: bigint;
            type: string;
            photos: string | null;
            companyResponse: string | null;
            adminDecision: string | null;
            refundAmount: import("@prisma/client/runtime/library").Decimal | null;
            frozenAmount: import("@prisma/client/runtime/library").Decimal | null;
            resolvedAt: Date | null;
        } | null;
    }>;
}
