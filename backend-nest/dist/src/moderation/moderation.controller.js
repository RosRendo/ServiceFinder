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
exports.ModerationController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const moderation_service_1 = require("./moderation.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const swagger_1 = require("@nestjs/swagger");
let ModerationController = class ModerationController {
    moderationService;
    constructor(moderationService) {
        this.moderationService = moderationService;
    }
    getLogs(status) {
        return this.moderationService.getLogs(status);
    }
    applyAction(id, body) {
        return this.moderationService.applyAction(Number(id), body.action);
    }
};
exports.ModerationController = ModerationController;
__decorate([
    openapi.ApiQuery({ name: "status", required: false }),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all moderation logs filtered by status' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ModerationController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Post)(':id/action'),
    (0, swagger_1.ApiOperation)({ summary: 'Apply a moderation action (resolve/dismiss/ban)' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ModerationController.prototype, "applyAction", null);
exports.ModerationController = ModerationController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, common_1.Controller)('admin/moderation'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [moderation_service_1.ModerationService])
], ModerationController);
//# sourceMappingURL=moderation.controller.js.map