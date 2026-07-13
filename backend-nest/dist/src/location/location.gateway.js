"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let LocationGateway = class LocationGateway {
    server;
    handleConnection(client) {
        if (process.env.NODE_ENV === 'development') {
            common_1.Logger.log(`🔗 Client connected: ${client.id}`, 'LocationGateway');
        }
    }
    handleDisconnect(client) {
        if (process.env.NODE_ENV === 'development') {
            common_1.Logger.log(`🔴 Client disconnected: ${client.id}`, 'LocationGateway');
        }
    }
    handleJoinBooking(bookingId, client) {
        const room = `booking_${bookingId}`;
        client.join(room);
        if (process.env.NODE_ENV === 'development') {
            common_1.Logger.log(`👤 Client ${client.id} joined room ${room}`, 'LocationGateway');
        }
    }
    handleLeaveBooking(bookingId, client) {
        const room = `booking_${bookingId}`;
        client.leave(room);
        if (process.env.NODE_ENV === 'development') {
            common_1.Logger.log(`👤 Client ${client.id} left room ${room}`, 'LocationGateway');
        }
    }
    handleStaffLocationUpdate(data, client) {
        const room = `booking_${data.bookingId}`;
        client.to(room).emit('staff_location_updated', {
            latitude: data.latitude,
            longitude: data.longitude,
        });
    }
};
exports.LocationGateway = LocationGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], LocationGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_booking'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], LocationGateway.prototype, "handleJoinBooking", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_booking'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], LocationGateway.prototype, "handleLeaveBooking", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('staff_location_update'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], LocationGateway.prototype, "handleStaffLocationUpdate", null);
exports.LocationGateway = LocationGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    })
], LocationGateway);
//# sourceMappingURL=location.gateway.js.map