import { ConversationsService } from './conversations.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
export declare class ConversationsController {
    private readonly service;
    constructor(service: ConversationsService);
    startConversation(req: any, dto: StartConversationDto): Promise<{
        data: {
            id: any;
            updatedAt: any;
            otherUser: {
                id: any;
                fullName: any;
                avatar: any;
                role?: undefined;
            } | {
                id: string;
                fullName: any;
                avatar: any;
                role: any;
            } | null;
            lastMessage: {
                content: any;
                createdAt: any;
                isMe: boolean;
            } | null;
        };
    }>;
    getUnreadCount(req: any): Promise<{
        unreadCount: number;
    }>;
    getMyConversations(req: any): Promise<{
        data: {
            id: any;
            updatedAt: any;
            otherUser: {
                id: any;
                fullName: any;
                avatar: any;
                role?: undefined;
            } | {
                id: string;
                fullName: any;
                avatar: any;
                role: any;
            } | null;
            lastMessage: {
                content: any;
                createdAt: any;
                isMe: boolean;
            } | null;
        }[];
    }>;
    getMessages(id: string, req: any, query: any): Promise<{
        data: {
            id: string;
            conversationId: string;
            content: string;
            createdAt: Date;
            sender: {
                id: string;
                fullName: string;
                avatar: string | null;
            };
            isMe: boolean;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    sendMessage(id: string, req: any, dto: CreateMessageDto): Promise<{
        data: {
            id: string;
            conversationId: string;
            content: string;
            createdAt: Date;
            sender: {
                id: string;
                fullName: string;
                avatar: string | null;
            };
            isMe: boolean;
        };
    }>;
}
