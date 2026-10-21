import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: true, // reflect request origin so credentialed handshakes work
    credentials: true,
  },
})
@Injectable()
export class InstantRequestsGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('InstantRequestsGateway');

  @SubscribeMessage('join_instant_request')
  handleJoin(
    @MessageBody() payload: { requestId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `instant_request_${payload.requestId}`;
    client.join(room);
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(`🔗 Client ${client.id} joined room: ${room}`);
    }
    return { status: 'joined', room };
  }

  @SubscribeMessage('leave_instant_request')
  handleLeave(
    @MessageBody() payload: { requestId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `instant_request_${payload.requestId}`;
    client.leave(room);
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(`🔴 Client ${client.id} left room: ${room}`);
    }
    return { status: 'left', room };
  }

  broadcastBid(requestId: string, bid: any) {
    const room = `instant_request_${requestId}`;
    this.server.to(room).emit('bid_received', bid);
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(
        `📣 Broadcast bid to room ${room}: ${JSON.stringify(bid)}`,
      );
    }
  }

  broadcastNewRequest(request: any) {
    this.server.emit('new_instant_request', request);
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(`📣 Broadcast new_instant_request: ${JSON.stringify(request.id)}`);
    }
  }

  broadcastMatch(requestId: string, matchDetails: any) {
    const room = `instant_request_${requestId}`;
    this.server.to(room).emit('match_confirmed', matchDetails);
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(`📣 Broadcast match_confirmed to room ${room}`);
    }
  }
}
