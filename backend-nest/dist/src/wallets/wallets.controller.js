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
exports.WalletsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const wallets_service_1 = require("./wallets.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let WalletsController = class WalletsController {
    walletsService;
    constructor(walletsService) {
        this.walletsService = walletsService;
    }
    async getMyCompanyWallet(req) {
        return this.walletsService.getMyCompanyWallet(BigInt(req.user.id));
    }
    async requestMyCompanyPayout(req, dto) {
        return this.walletsService.requestMyCompanyPayout(BigInt(req.user.id), dto);
    }
    getCompanyWallet(id, req) {
        return this.walletsService.getCompanyWallet(BigInt(id), BigInt(req.user.id));
    }
    requestDeposit(id, req, dto) {
        return this.walletsService.requestDeposit(BigInt(id), BigInt(req.user.id), dto);
    }
    requestPayout(id, req, dto) {
        return this.walletsService.requestPayout(BigInt(id), BigInt(req.user.id), dto);
    }
    clearStaffDebt(id, staffId, req, dto) {
        return this.walletsService.clearStaffDebt(BigInt(id), BigInt(staffId), BigInt(req.user.id), dto.amount);
    }
    getStaffWallet(id, req) {
        return this.walletsService.getStaffWallet(BigInt(id), BigInt(req.user.id));
    }
    requestStaffPayout(id, req, dto) {
        return this.walletsService.requestStaffPayout(BigInt(id), BigInt(req.user.id), dto);
    }
    getAdminPendingRequests() {
        return this.walletsService.getAdminPendingRequests();
    }
    approveDeposit(id, dto) {
        return this.walletsService.approveDeposit(BigInt(id), dto.adminNotes);
    }
    rejectDeposit(id, dto) {
        return this.walletsService.rejectDeposit(BigInt(id), dto.adminNotes);
    }
    approvePayout(id, dto) {
        return this.walletsService.approvePayout(BigInt(id), dto.adminNotes);
    }
    rejectPayout(id, dto) {
        return this.walletsService.rejectPayout(BigInt(id), dto.adminNotes);
    }
};
exports.WalletsController = WalletsController;
__decorate([
    (0, common_1.Get)('my-company'),
    (0, roles_decorator_1.Roles)('company_admin'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "getMyCompanyWallet", null);
__decorate([
    (0, common_1.Post)('my-company/payout'),
    (0, roles_decorator_1.Roles)('company_admin'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "requestMyCompanyPayout", null);
__decorate([
    (0, common_1.Get)('company/:id'),
    (0, roles_decorator_1.Roles)('company_admin'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WalletsController.prototype, "getCompanyWallet", null);
__decorate([
    (0, common_1.Post)('company/:id/deposit'),
    (0, roles_decorator_1.Roles)('company_admin'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], WalletsController.prototype, "requestDeposit", null);
__decorate([
    (0, common_1.Post)('company/:id/payout'),
    (0, roles_decorator_1.Roles)('company_admin'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], WalletsController.prototype, "requestPayout", null);
__decorate([
    (0, common_1.Post)('company/:id/staff/:staffId/clear-debt'),
    (0, roles_decorator_1.Roles)('company_admin'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('staffId')),
    __param(2, (0, common_1.Request)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], WalletsController.prototype, "clearStaffDebt", null);
__decorate([
    (0, common_1.Get)('staff/:id'),
    (0, roles_decorator_1.Roles)('staff'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WalletsController.prototype, "getStaffWallet", null);
__decorate([
    (0, common_1.Post)('staff/:id/payout'),
    (0, roles_decorator_1.Roles)('staff'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], WalletsController.prototype, "requestStaffPayout", null);
__decorate([
    (0, common_1.Get)('admin/requests'),
    (0, roles_decorator_1.Roles)('admin'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WalletsController.prototype, "getAdminPendingRequests", null);
__decorate([
    (0, common_1.Patch)('admin/deposits/:id/approve'),
    (0, roles_decorator_1.Roles)('admin'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WalletsController.prototype, "approveDeposit", null);
__decorate([
    (0, common_1.Patch)('admin/deposits/:id/reject'),
    (0, roles_decorator_1.Roles)('admin'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WalletsController.prototype, "rejectDeposit", null);
__decorate([
    (0, common_1.Patch)('admin/payouts/:id/approve'),
    (0, roles_decorator_1.Roles)('admin'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WalletsController.prototype, "approvePayout", null);
__decorate([
    (0, common_1.Patch)('admin/payouts/:id/reject'),
    (0, roles_decorator_1.Roles)('admin'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WalletsController.prototype, "rejectPayout", null);
exports.WalletsController = WalletsController = __decorate([
    (0, common_1.Controller)('wallets'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [wallets_service_1.WalletsService])
], WalletsController);
//# sourceMappingURL=wallets.controller.js.map