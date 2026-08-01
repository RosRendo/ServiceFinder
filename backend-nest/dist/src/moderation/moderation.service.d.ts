import { PrismaService } from '../prisma/prisma.service';
export declare class ModerationService {
    private prisma;
    constructor(prisma: PrismaService);
    getLogs(status?: string): Promise<{
        success: boolean;
        data: {
            id: string;
            type: string;
            reportedBy: {
                id: string;
                name: string;
            };
            targetId: string;
            targetName: string;
            reason: string;
            details: string;
            status: string;
            createdAt: string;
        }[];
    }>;
    applyAction(id: number, action: string): Promise<{
        success: boolean;
        id: string;
        status: string;
    }>;
}
