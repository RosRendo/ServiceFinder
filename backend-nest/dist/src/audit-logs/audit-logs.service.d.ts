import { PrismaService } from '../prisma/prisma.service';
export declare class AuditLogsService {
    private prisma;
    constructor(prisma: PrismaService);
    log(params: {
        action: string;
        userId?: bigint | null;
        entityType?: string;
        entityId?: bigint | null;
        ipAddress?: string;
    }): Promise<void>;
    getAllLogs(query: any): Promise<{
        data: {
            id: string;
            userId: string | null;
            entityId: string | null;
            user: {
                id: string;
                fullName: string;
                email: string | null;
                avatar: string | null;
            } | null;
            createdAt: Date;
            action: string | null;
            entityType: string | null;
            ipAddress: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
