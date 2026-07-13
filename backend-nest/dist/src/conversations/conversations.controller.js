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
exports.ConversationsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const conversations_service_1 = require("./conversations.service");
const start_conversation_dto_1 = require("./dto/start-conversation.dto");
const create_message_dto_1 = require("./dto/create-message.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let ConversationsController = class ConversationsController {
    service;
    constructor(service) {
        this.service = service;
    }
    startConversation(req, dto) {
        return this.service.getOrCreateConversation(BigInt(req.user.id), dto);
    }
    async getMyConversations(req) {
        const res = await this.service.getMyConversations(BigInt(req.user.id));
        common_1.Logger.log('RETURNING ' +
            JSON.stringify(res, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 2), 'ConversationsController');
        return res;
    }
    async getMessages(id, req, query) {
        common_1.Logger.log(`GET /api/conversations/${id}/messages called by user ${req.user.id}`, 'ConversationsController');
        const res = await this.service.getMessages(BigInt(id), BigInt(req.user.id), query);
        common_1.Logger.log(`getMessages returned ${res.data.length} messages for conv ${id}`, 'ConversationsController');
        return res;
    }
    sendMessage(id, req, dto) {
        return this.service.sendMessage(BigInt(id), BigInt(req.user.id), dto);
    }
};
exports.ConversationsController = ConversationsController;
__decorate([
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, start_conversation_dto_1.StartConversationDto]),
    __metadata("design:returntype", void 0)
], ConversationsController.prototype, "startConversation", null);
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "getMyConversations", null);
__decorate([
    (0, common_1.Get)(':id/messages'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_message_dto_1.CreateMessageDto]),
    __metadata("design:returntype", void 0)
], ConversationsController.prototype, "sendMessage", null);
exports.ConversationsController = ConversationsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('conversations'),
    __metadata("design:paramtypes", [conversations_service_1.ConversationsService])
], ConversationsController);
//# sourceMappingURL=conversations.controller.js.map