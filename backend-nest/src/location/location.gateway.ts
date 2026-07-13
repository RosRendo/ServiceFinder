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
import { Logger } from '@nestjs/common';
@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins for dev. For production, restrict to frontend URL
  },
})
export class LocationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    if (process.env.NODE_ENV === 'development') {
      Logger.log(`🔗 Client connected: ${client.id}`, 'LocationGateway');
    }
  }

  handleDisconnect(client: Socket) {
    if (process.env.NODE_ENV === 'development') {
      Logger.log(`🔴 Client disconnected: ${client.id}`, 'LocationGateway');
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
      Logger.log(
        `👤 Client ${client.id} joined room ${room}`,
        'LocationGateway',
      );
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
      Logger.log(`👤 Client ${client.id} left room ${room}`, 'LocationGateway');
    }
  }

  @SubscribeMessage('staff_location_update')
  handleStaffLocationUpdate(
    @MessageBody()
    data: { bookingId: string; latitude: number; longitude: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `booking_${data.bookingId}`;
    // Broadcast to everyone else in the room
    client.to(room).emit('staff_location_updated', {
      latitude: data.latitude,
      longitude: data.longitude,
    });
  }
}
