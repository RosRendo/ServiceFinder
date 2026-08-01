import { ComplianceService } from './compliance.service';
export declare class ComplianceController {
    private readonly complianceService;
    constructor(complianceService: ComplianceService);
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
    updateStatus(id: string, body: {
        status: string;
    }): Promise<{
        success: boolean;
        id: string;
        status: string;
    }>;
}
