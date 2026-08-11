import { PrismaService } from '../prisma/prisma.service';
export declare class SupportService {
    private prisma;
    constructor(prisma: PrismaService);
    getTickets(status?: string, page?: number, limit?: number, userId?: bigint): Promise<{
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
            messages: {
                id: string;
                senderId: string;
                senderName: string;
                senderRole: string;
                content: string;
                createdAt: string;
            }[];
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    updateTicketStatus(id: number, status: string, userId: bigint, userRole: string): Promise<{
        success: boolean;
        id: string;
        status: string;
    }>;
    replyToTicket(id: number, message: string, senderId: bigint, senderName: string, senderRole: string): Promise<{
        success: boolean;
        message: string;
        ticketId: string;
    }>;
    createTicket(userId: bigint, subject: string, description: string, priority?: string): Promise<{
        id: string;
        userId: string;
        subject: string;
        description: string;
        status: string;
        priority: string;
        createdAt: string;
        updatedAt: string;
        messages: {
            id: string;
            senderId: string;
            senderName: string;
            senderRole: string;
            content: string;
            createdAt: string;
        }[];
    }>;
}
