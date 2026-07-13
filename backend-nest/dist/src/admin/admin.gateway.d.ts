import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class AdminGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinAdminDashboard(client: Socket): void;
    handleLeaveAdminDashboard(client: Socket): void;
    broadcastKpiUpdate(event: string, data: any): void;
}
