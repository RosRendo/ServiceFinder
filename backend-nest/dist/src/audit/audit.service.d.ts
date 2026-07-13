import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    logAction(userId: bigint | null, action: string, entityType: string, entityId: bigint | null, ipAddress?: string, details?: any): Promise<{
        id: bigint;
        createdAt: Date;
        userId: bigint | null;
        action: string | null;
        entityType: string | null;
        entityId: bigint | null;
        ipAddress: string | null;
    }>;
}
