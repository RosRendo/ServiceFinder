import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, forwardRef, Inject, Logger } from '@nestjs/common';
import { ConversationsService } from './conversations.service';

@WebSocketGateway({
  cors: {
    origin: true, // reflect request origin so credentialed handshakes work
    credentials: true,
  },
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => ConversationsService))
    private conversationsService: ConversationsService,
  ) {}

  handleConnection(client: Socket) {
    if (process.env.NODE_ENV === 'development') {
      Logger.log(`🔗 Chat connected: ${client.id}`, 'ChatGateway');
    }
  }

  handleDisconnect(client: Socket) {
    if (process.env.NODE_ENV === 'development') {
      Logger.log(`🔴 Chat disconnected: ${client.id}`, 'ChatGateway');
    }
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `conversation_${conversationId}`;
    client.join(room);
    if (process.env.NODE_ENV === 'development') {
      Logger.log(`👤 User joined room ${room}`, 'ChatGateway');
    }
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `conversation_${conversationId}`;
    client.leave(room);
    if (process.env.NODE_ENV === 'development') {
      Logger.log(`👤 User left room ${room}`, 'ChatGateway');
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @MessageBody() data: { conversationId: string; senderName?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `conversation_${data.conversationId}`;
    client.to(room).emit('typing:start', {
      conversationId: data.conversationId,
      senderName: data.senderName || 'Someone',
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `conversation_${data.conversationId}`;
    client.to(room).emit('typing:stop', {
      conversationId: data.conversationId,
    });
  }

  @SubscribeMessage('message:read')
  async handleMessageRead(
    @MessageBody() data: { conversationId: string; messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `conversation_${data.conversationId}`;
    client.to(room).emit('message:read', {
      conversationId: data.conversationId,
      messageId: data.messageId,
    });
  }

  // Method to broadcast message from REST controller context
  broadcastNewMessage(conversationId: string, message: any) {
    const room = `conversation_${conversationId}`;
    this.server.to(room).emit('receive_message', {
      id: message.id,
      conversationId: conversationId,
      senderId: message.sender?.id || message.senderId,
      senderName: message.sender?.fullName || '',
      text: message.content,
      timestamp: message.createdAt,
    });
  }
}
