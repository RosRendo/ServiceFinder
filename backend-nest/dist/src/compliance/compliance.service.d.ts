import { PrismaService } from '../prisma/prisma.service';
export declare class ComplianceService {
    private prisma;
    constructor(prisma: PrismaService);
    getReports(status?: string): Promise<{
        success: boolean;
        data: {
            id: string;
            companyId: string;
            companyName: string;
            documentType: string;
            documentUrl: string;
            status: string;
            submittedAt: string;
            notes: string;
        }[];
    }>;
    updateStatus(id: number, status: string): Promise<{
        success: boolean;
        id: string;
        status: string;
    }>;
}
