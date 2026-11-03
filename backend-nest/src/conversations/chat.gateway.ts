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
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationsService } from './conversations.service';
import { socketCorsOptions } from '../common/utils/socket-cors.util';

@WebSocketGateway({
  cors: socketCorsOptions(),
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private socketUsers = new Map<string, { userId: string; role?: string }>();

  constructor(
    @Inject(forwardRef(() => ConversationsService))
    private conversationsService: ConversationsService,
    private prisma: PrismaService,
  ) {}

  private extractToken(client: Socket): string | null {
    const cookieHeader = client.handshake.headers?.cookie || '';
    const cookieToken = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('token='))
      ?.slice('token='.length);
    return (
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace('Bearer ', '') ||
      cookieToken ||
      null
    );
  }

  private getUserId(client: Socket): string | null {
    return this.socketUsers.get(client.id)?.userId || null;
  }

  private async isParticipant(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const isNumeric = /^\d+$/.test(conversationId);
    if (!isNumeric) return false;
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: BigInt(conversationId),
          userId: BigInt(userId),
        },
      },
    });
    return !!participant;
  }

  handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.userId) {
        client.disconnect(true);
        return;
      }
      this.socketUsers.set(client.id, {
        userId: decoded.userId.toString(),
        role: decoded.role,
      });
      if (process.env.NODE_ENV === 'development') {
        Logger.log(
          `🔗 Chat connected: ${client.id} (user ${decoded.userId})`,
          'ChatGateway',
        );
      }
    } catch (e) {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.socketUsers.delete(client.id);
    if (process.env.NODE_ENV === 'development') {
      Logger.log(`🔴 Chat disconnected: ${client.id}`, 'ChatGateway');
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserId(client);
    if (!userId) return;
    if (!(await this.isParticipant(conversationId, userId))) return;

    const room = `conversation_${conversationId}`;
    client.join(room);
    if (process.env.NODE_ENV === 'development') {
      Logger.log(`👤 User joined room ${room}`, 'ChatGateway');
    }
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserId(client);
    if (!userId) return;
    if (!(await this.isParticipant(conversationId, userId))) return;

    const room = `conversation_${conversationId}`;
    client.leave(room);
    if (process.env.NODE_ENV === 'development') {
      Logger.log(`👤 User left room ${room}`, 'ChatGateway');
    }
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @MessageBody() data: { conversationId: string; senderName?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserId(client);
    if (!userId) return;
    if (!(await this.isParticipant(data.conversationId, userId))) return;

    const room = `conversation_${data.conversationId}`;
    client.to(room).emit('typing:start', {
      conversationId: data.conversationId,
      senderName: data.senderName || 'Someone',
    });
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserId(client);
    if (!userId) return;
    if (!(await this.isParticipant(data.conversationId, userId))) return;

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
    const userId = this.getUserId(client);
    if (!userId) return;
    if (!(await this.isParticipant(data.conversationId, userId))) return;

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
