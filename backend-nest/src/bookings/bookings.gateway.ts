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
import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { socketCorsOptions } from '../common/utils/socket-cors.util';

@WebSocketGateway({
  cors: socketCorsOptions(),
})
@Injectable()
export class BookingsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private socketUsers = new Map<string, { userId: string; role?: string }>();

  constructor(private prisma: PrismaService) {}

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

  private getConnection(client: Socket) {
    return this.socketUsers.get(client.id) || null;
  }

  private async isBookingParticipant(
    bookingId: string,
    conn: { userId: string; role?: string },
  ): Promise<boolean> {
    const isNumeric = /^\d+$/.test(bookingId);
    if (!isNumeric) return false;
    if (conn.role === 'admin') return true;

    const booking = await this.prisma.booking.findUnique({
      where: { id: BigInt(bookingId) },
      select: {
        customerId: true,
        companyId: true,
        assignedStaff: { select: { userId: true } },
      },
    });
    if (!booking) return false;

    if (booking.customerId.toString() === conn.userId) return true;
    if (booking.assignedStaff?.userId.toString() === conn.userId) return true;

    const staffRecord = await this.prisma.companyStaff.findFirst({
      where: { userId: BigInt(conn.userId) },
      select: { companyId: true },
    });
    if (staffRecord && staffRecord.companyId === booking.companyId) return true;

    return false;
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
          `🔗 Booking Socket connected: ${client.id} (user ${decoded.userId})`,
          'BookingsGateway',
        );
      }
    } catch (e) {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.socketUsers.delete(client.id);
    if (process.env.NODE_ENV === 'development') {
      Logger.log(`🔴 Booking Socket disconnected: ${client.id}`, 'BookingsGateway');
    }
  }

  @SubscribeMessage('join_booking')
  async handleJoinBooking(
    @MessageBody() bookingId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const conn = this.getConnection(client);
    if (!conn) return;
    if (!(await this.isBookingParticipant(bookingId, conn))) return;

    const room = `booking_${bookingId}`;
    client.join(room);
    if (process.env.NODE_ENV === 'development') {
      Logger.log(`👤 Client joined room ${room}`, 'BookingsGateway');
    }
  }

  @SubscribeMessage('leave_booking')
  async handleLeaveBooking(
    @MessageBody() bookingId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const conn = this.getConnection(client);
    if (!conn) return;
    if (!(await this.isBookingParticipant(bookingId, conn))) return;

    const room = `booking_${bookingId}`;
    client.leave(room);
    if (process.env.NODE_ENV === 'development') {
      Logger.log(`👤 Client left room ${room}`, 'BookingsGateway');
    }
  }

  @SubscribeMessage('staff_location_update')
  async handleStaffLocationUpdate(
    @MessageBody()
    data: { bookingId: string; latitude: number; longitude: number },
    @ConnectedSocket() client: Socket,
  ) {
    const conn = this.getConnection(client);
    if (!conn) return;
    if (!(await this.isBookingParticipant(data.bookingId, conn))) return;

    const room = `booking_${data.bookingId}`;
    client.to(room).emit('staff_location_updated', {
      bookingId: data.bookingId,
      latitude: data.latitude,
      longitude: data.longitude,
    });
  }

  // Broadcast any status change (REST backend -> WS client)
  broadcastBookingUpdate(bookingId: string, status: string, payload: any) {
    const room = `booking_${bookingId}`;
    this.server.to(room).emit('booking_updated', {
      bookingId,
      status,
      payload,
    });
  }
}
