"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt = __importStar(require("jsonwebtoken"));
const prisma_service_1 = require("../prisma/prisma.service");
let PresenceGateway = class PresenceGateway {
    prisma;
    server;
    userSockets = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleConnection(client) {
        const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
        if (!token)
            return;
        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.sub) {
                const userId = BigInt(decoded.sub);
                this.userSockets.set(client.id, userId.toString());
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { workingStatus: 'online', lastSeen: new Date() },
                });
                if (process.env.NODE_ENV === 'development') {
                    common_1.Logger.log(`🔗 User ${userId} came online (Socket: ${client.id})`, 'PresenceGateway');
                }
                this.server.emit('user_status_changed', {
                    userId: userId.toString(),
                    status: 'online',
                    lastSeen: new Date(),
                });
            }
        }
        catch (e) {
            common_1.Logger.error('Failed to parse token in PresenceGateway', e);
        }
    }
    async handleDisconnect(client) {
        const userIdStr = this.userSockets.get(client.id);
        if (userIdStr) {
            this.userSockets.delete(client.id);
            const userId = BigInt(userIdStr);
            await this.prisma.user.update({
                where: { id: userId },
                data: { workingStatus: 'offline', lastSeen: new Date() },
            });
            if (process.env.NODE_ENV === 'development') {
                common_1.Logger.log(`🔴 User ${userId} went offline (Socket: ${client.id})`, 'PresenceGateway');
            }
            this.server.emit('user_status_changed', {
                userId: userId.toString(),
                status: 'offline',
                lastSeen: new Date(),
            });
        }
    }
};
exports.PresenceGateway = PresenceGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], PresenceGateway.prototype, "server", void 0);
exports.PresenceGateway = PresenceGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PresenceGateway);
//# sourceMappingURL=presence.gateway.js.map