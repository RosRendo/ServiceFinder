import { SupportService } from './support.service';
export declare class SupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    getTickets(status?: string, page?: string, limit?: string, user?: any): Promise<{
        success: boolean;
        data: {
            id: string;
            userId: string;
            subject: string;
            description: string;
            status: string;
            priority: string;
            createdAt: string;
            updatedAt: string;
            resolvedAt: string | null;
            user: {
                id: string;
                fullName: string;
                email: string | null;
            } | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    createTicket(body: {
        subject: string;
        message: string;
        priority?: string;
    }, user: any): Promise<{
        id: string;
        userId: string;
        subject: string;
        description: string;
        status: string;
        priority: string;
        createdAt: string;
        updatedAt: string;
    }>;
    updateStatus(id: string, body: {
        status: string;
    }): Promise<{
        success: boolean;
        id: string;
        status: string;
    }>;
    reply(id: string, body: {
        message: string;
    }): Promise<{
        success: boolean;
        message: string;
        ticketId: string;
    }>;
}
