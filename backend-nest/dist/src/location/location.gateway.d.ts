import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class LocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinBooking(bookingId: string, client: Socket): void;
    handleLeaveBooking(bookingId: string, client: Socket): void;
    handleStaffLocationUpdate(data: {
        bookingId: string;
        latitude: number;
        longitude: number;
    }, client: Socket): void;
}
