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
    origin: true, // reflect request origin so credentialed handshakes work
    credentials: true,
  },
})
@Injectable()
export class AdminGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    if (process.env.NODE_ENV === 'development') {
      Logger.log(`🔗 Admin Socket connected: ${client.id}`, 'AdminGateway');
    }
  }

  handleDisconnect(client: Socket) {
    if (process.env.NODE_ENV === 'development') {
      Logger.log(`🔴 Admin Socket disconnected: ${client.id}`, 'AdminGateway');
    }
  }

  @SubscribeMessage('join_admin_dashboard')
  handleJoinAdminDashboard(@ConnectedSocket() client: Socket) {
    client.join('admin_dashboard');
    if (process.env.NODE_ENV === 'development') {
      Logger.log(
        `👑 Admin client ${client.id} joined admin_dashboard`,
        'AdminGateway',
      );
    }
  }

  @SubscribeMessage('leave_admin_dashboard')
  handleLeaveAdminDashboard(@ConnectedSocket() client: Socket) {
    client.leave('admin_dashboard');
    if (process.env.NODE_ENV === 'development') {
      Logger.log(
        `👑 Admin client ${client.id} left admin_dashboard`,
        'AdminGateway',
      );
    }
  }

  // Method to push real-time platform KPI updates
  broadcastKpiUpdate(event: string, data: any) {
    this.server.to('admin_dashboard').emit('kpi_updated', {
      event,
      data,
      timestamp: new Date(),
    });
  }
}
