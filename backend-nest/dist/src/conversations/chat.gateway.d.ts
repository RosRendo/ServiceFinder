import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConversationsService } from './conversations.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private conversationsService;
    server: Server;
    constructor(conversationsService: ConversationsService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinConversation(conversationId: string, client: Socket): void;
    handleLeaveConversation(conversationId: string, client: Socket): void;
    handleTypingStart(data: {
        conversationId: string;
        senderName?: string;
    }, client: Socket): void;
    handleTypingStop(data: {
        conversationId: string;
    }, client: Socket): void;
    handleMessageRead(data: {
        conversationId: string;
        messageId: string;
    }, client: Socket): Promise<void>;
    broadcastNewMessage(conversationId: string, message: any): void;
}
