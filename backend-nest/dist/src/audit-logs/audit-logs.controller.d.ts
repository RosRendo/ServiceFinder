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
                fullName: string;
                email: string | null;
                avatar: string | null;
            } | null;
            createdAt: Date;
            entityType: string | null;
            action: string | null;
            ipAddress: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    deleteLogs(body: {
        ids: string[];
    }): Promise<{
        message: string;
        count: number;
    }>;
}
