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
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const conversations_service_1 = require("./conversations.service");
let ChatGateway = class ChatGateway {
    conversationsService;
    server;
    constructor(conversationsService) {
        this.conversationsService = conversationsService;
    }
    handleConnection(client) {
        if (process.env.NODE_ENV === 'development') {
            common_1.Logger.log(`🔗 Chat connected: ${client.id}`, 'ChatGateway');
        }
    }
    handleDisconnect(client) {
        if (process.env.NODE_ENV === 'development') {
            common_1.Logger.log(`🔴 Chat disconnected: ${client.id}`, 'ChatGateway');
        }
    }
    handleJoinConversation(conversationId, client) {
        const room = `conversation_${conversationId}`;
        client.join(room);
        if (process.env.NODE_ENV === 'development') {
            common_1.Logger.log(`👤 User joined room ${room}`, 'ChatGateway');
        }
    }
    handleLeaveConversation(conversationId, client) {
        const room = `conversation_${conversationId}`;
        client.leave(room);
        if (process.env.NODE_ENV === 'development') {
            common_1.Logger.log(`👤 User left room ${room}`, 'ChatGateway');
        }
    }
    handleTypingStart(data, client) {
        const room = `conversation_${data.conversationId}`;
        client.to(room).emit('typing:start', {
            conversationId: data.conversationId,
            senderName: data.senderName || 'Someone',
        });
    }
    handleTypingStop(data, client) {
        const room = `conversation_${data.conversationId}`;
        client.to(room).emit('typing:stop', {
            conversationId: data.conversationId,
        });
    }
    async handleMessageRead(data, client) {
        const room = `conversation_${data.conversationId}`;
        client.to(room).emit('message:read', {
            conversationId: data.conversationId,
            messageId: data.messageId,
        });
    }
    broadcastNewMessage(conversationId, message) {
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
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_conversation'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleJoinConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_conversation'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing:start'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTypingStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing:stop'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTypingStop", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('message:read'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessageRead", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => conversations_service_1.ConversationsService))),
    __metadata("design:paramtypes", [conversations_service_1.ConversationsService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map