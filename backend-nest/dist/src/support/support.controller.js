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
exports.SupportController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const support_service_1 = require("./support.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let SupportController = class SupportController {
    supportService;
    constructor(supportService) {
        this.supportService = supportService;
    }
    getTickets(status, page, limit, user) {
        const filterUserId = user.role !== 'admin' ? BigInt(user.id) : undefined;
        return this.supportService.getTickets(status, Number(page) || 1, Number(limit) || 20, filterUserId);
    }
    createTicket(body, user) {
        return this.supportService.createTicket(BigInt(user.id), body.subject, body.message, body.priority);
    }
    updateStatus(id, body, user) {
        return this.supportService.updateTicketStatus(Number(id), body.status, BigInt(user.id), user.role);
    }
    reply(id, body, user) {
        return this.supportService.replyToTicket(Number(id), body.message, BigInt(user.id), user.fullName, user.role);
    }
};
exports.SupportController = SupportController;
__decorate([
    openapi.ApiQuery({ name: "status", required: false }),
    openapi.ApiQuery({ name: "page", required: false }),
    openapi.ApiQuery({ name: "limit", required: false }),
    (0, common_1.Get)('tickets'),
    (0, roles_decorator_1.Roles)('admin', 'company_admin', 'customer'),
    (0, swagger_1.ApiOperation)({ summary: 'Get support tickets' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "getTickets", null);
__decorate([
    (0, common_1.Post)('tickets'),
    (0, roles_decorator_1.Roles)('admin', 'company_admin', 'customer'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a support ticket' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "createTicket", null);
__decorate([
    (0, common_1.Patch)('tickets/:id'),
    (0, roles_decorator_1.Roles)('admin', 'company_admin', 'customer'),
    (0, swagger_1.ApiOperation)({ summary: 'Update support ticket status' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)('tickets/:id/reply'),
    (0, roles_decorator_1.Roles)('admin', 'company_admin', 'customer'),
    (0, swagger_1.ApiOperation)({ summary: 'Reply to a support ticket' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "reply", null);
exports.SupportController = SupportController = __decorate([
    (0, swagger_1.ApiTags)('Support'),
    (0, common_1.Controller)('support'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [support_service_1.SupportService])
], SupportController);
//# sourceMappingURL=support.controller.js.map