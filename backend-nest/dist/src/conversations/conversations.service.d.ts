import { PrismaService } from '../prisma/prisma.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { ChatGateway } from './chat.gateway';
export declare class ConversationsService {
    private prisma;
    private chatGateway;
    constructor(prisma: PrismaService, chatGateway: ChatGateway);
    getOrCreateConversation(userId: bigint, dto: StartConversationDto): Promise<{
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
    getMyConversations(userId: bigint): Promise<{
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
    getMessages(conversationId: bigint, userId: bigint, query: any): Promise<{
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
    sendMessage(conversationId: bigint, userId: bigint, dto: CreateMessageDto): Promise<{
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
    private formatConversation;
}
