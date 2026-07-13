import { PrismaService } from '../prisma/prisma.service';
import { CreateDisputeDto, RespondToDisputeDto, ResolveDisputeDto } from './dto/dispute.dto';
export declare class DisputesService {
    private prisma;
    constructor(prisma: PrismaService);
    fileDispute(bookingId: bigint, customerId: bigint, dto: CreateDisputeDto): Promise<{
        message: string;
        dispute: {
            id: number;
            description: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: bigint;
            customerId: bigint;
            bookingId: bigint;
            type: string;
            photos: string | null;
            companyResponse: string | null;
            adminDecision: string | null;
            refundAmount: import("@prisma/client/runtime/library").Decimal | null;
            resolvedAt: Date | null;
        };
    }>;
    getDisputes(role: string, userId: bigint, companyId?: bigint): Promise<{
        disputes: ({
            customer: {
                id: bigint;
                email: string | null;
                fullName: string;
            };
            company: {
                id: bigint;
                name: string;
            };
            booking: {
                id: bigint;
                bookingDate: Date;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: number;
            description: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: bigint;
            customerId: bigint;
            bookingId: bigint;
            type: string;
            photos: string | null;
            companyResponse: string | null;
            adminDecision: string | null;
            refundAmount: import("@prisma/client/runtime/library").Decimal | null;
            resolvedAt: Date | null;
        })[];
    }>;
    getDisputeById(id: number, userId: bigint, role: string): Promise<{
        dispute: {
            customer: {
                id: bigint;
                email: string | null;
                fullName: string;
                avatar: string | null;
            };
            company: {
                id: bigint;
                name: string;
                logoUrl: string | null;
            };
            booking: {
                id: bigint;
                bookingDate: Date;
                serviceAddress: string;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: number;
            description: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: bigint;
            customerId: bigint;
            bookingId: bigint;
            type: string;
            photos: string | null;
            companyResponse: string | null;
            adminDecision: string | null;
            refundAmount: import("@prisma/client/runtime/library").Decimal | null;
            resolvedAt: Date | null;
        };
    }>;
    respondToDispute(id: number, companyId: bigint, dto: RespondToDisputeDto): Promise<{
        message: string;
        dispute: {
            id: number;
            description: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: bigint;
            customerId: bigint;
            bookingId: bigint;
            type: string;
            photos: string | null;
            companyResponse: string | null;
            adminDecision: string | null;
            refundAmount: import("@prisma/client/runtime/library").Decimal | null;
            resolvedAt: Date | null;
        };
    }>;
    resolveDispute(id: number, dto: ResolveDisputeDto): Promise<{
        message: string;
        dispute: {
            id: number;
            description: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: bigint;
            customerId: bigint;
            bookingId: bigint;
            type: string;
            photos: string | null;
            companyResponse: string | null;
            adminDecision: string | null;
            refundAmount: import("@prisma/client/runtime/library").Decimal | null;
            resolvedAt: Date | null;
        };
    }>;
}
