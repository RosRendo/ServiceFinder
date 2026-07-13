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
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class BookingsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    if (process.env.NODE_ENV === 'development') {
      Logger.log(
        `🔗 Booking Socket connected: ${client.id}`,
        'BookingsGateway',
      );
    }
  }

  handleDisconnect(client: Socket) {
    if (process.env.NODE_ENV === 'development') {
      Logger.log(
        `🔴 Booking Socket disconnected: ${client.id}`,
        'BookingsGateway',
      );
    }
  }

  @SubscribeMessage('join_booking')
  handleJoinBooking(
    @MessageBody() bookingId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `booking_${bookingId}`;
    client.join(room);
    if (process.env.NODE_ENV === 'development') {
      Logger.log(`👤 Client joined room ${room}`, 'BookingsGateway');
    }
  }

  @SubscribeMessage('leave_booking')
  handleLeaveBooking(
    @MessageBody() bookingId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `booking_${bookingId}`;
    client.leave(room);
    if (process.env.NODE_ENV === 'development') {
      Logger.log(`👤 Client left room ${room}`, 'BookingsGateway');
    }
  }

  // Real-time GPS Tracking Update
  @SubscribeMessage('staff_location_update')
  handleStaffLocationUpdate(
    @MessageBody()
    data: { bookingId: string; latitude: number; longitude: number },
    @ConnectedSocket() client: Socket,
  ) {
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
