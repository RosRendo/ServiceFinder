import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: true, // reflect request origin so credentialed handshakes work
    credentials: true,
  },
})
export class PresenceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>(); // socketId -> userId

  constructor(private prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    // Token sources, in order: socket auth payload -> Authorization header -> httpOnly cookie.
    const cookieHeader = client.handshake.headers?.cookie || '';
    const cookieToken = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('token='))
      ?.slice('token='.length);
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace('Bearer ', '') ||
      cookieToken;
    if (!token) return;

    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.userId) {
        const userId = BigInt(decoded.userId);
        this.userSockets.set(client.id, userId.toString());

        await this.prisma.user.update({
          where: { id: userId },
          data: { workingStatus: 'online', lastSeen: new Date() },
        });

        if (process.env.NODE_ENV === 'development') {
          Logger.log(
            `🔗 User ${userId} came online (Socket: ${client.id})`,
            'PresenceGateway',
          );
        }

        // Broadcast to everyone that this user is online
        this.server.emit('user_status_changed', {
          userId: userId.toString(),
          status: 'online',
          lastSeen: new Date(),
        });
      }
    } catch (e) {
      Logger.error('Failed to parse token in PresenceGateway', e);
    }
  }

  async handleDisconnect(client: Socket) {
    const userIdStr = this.userSockets.get(client.id);
    if (userIdStr) {
      this.userSockets.delete(client.id);

      const userId = BigInt(userIdStr);
      await this.prisma.user.update({
        where: { id: userId },
        data: { workingStatus: 'offline', lastSeen: new Date() },
      });

      if (process.env.NODE_ENV === 'development') {
        Logger.log(
          `🔴 User ${userId} went offline (Socket: ${client.id})`,
          'PresenceGateway',
        );
      }

      this.server.emit('user_status_changed', {
        userId: userId.toString(),
        status: 'offline',
        lastSeen: new Date(),
      });
    }
  }
}
