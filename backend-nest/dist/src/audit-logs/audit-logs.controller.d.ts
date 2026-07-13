import { AuditLogsService } from './audit-logs.service';
export declare class AuditLogsController {
    private readonly auditLogsService;
    constructor(auditLogsService: AuditLogsService);
    getAllLogs(query: any): Promise<{
        data: {
            id: string;
            userId: string | null;
            entityId: string | null;
            user: {
                id: string;
                email: string | null;
                fullName: string;
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
