import { ModerationService } from './moderation.service';
export declare class ModerationController {
    private readonly moderationService;
    constructor(moderationService: ModerationService);
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
    applyAction(id: string, body: {
        action: string;
    }): Promise<{
        success: boolean;
        id: string;
        status: string;
    }>;
}
