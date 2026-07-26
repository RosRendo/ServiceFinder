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
exports.PayoutsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payouts_service_1 = require("./payouts.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let PayoutsController = class PayoutsController {
    payoutsService;
    constructor(payoutsService) {
        this.payoutsService = payoutsService;
    }
    async getCompanyId(req) {
        if (req.user.companyId)
            return BigInt(req.user.companyId);
        const company = await this.payoutsService.getCompanyByOwnerId(BigInt(req.user.id));
        const fs = require('fs');
        fs.writeFileSync('debug_payouts.json', JSON.stringify({
            userId: req.user.id.toString(),
            userRole: req.user.role,
            companyFound: company ? company.id.toString() : null,
        }, null, 2));
        if (!company) {
            throw new common_1.NotFoundException('No company associated with this user');
        }
        return company.id;
    }
    async getPayouts(req) {
        const companyId = await this.getCompanyId(req);
        return this.payoutsService.getPayouts(companyId);
    }
    async requestPayout(req, body) {
        const companyId = await this.getCompanyId(req);
        return this.payoutsService.requestPayout(companyId, body.amount, body.method);
    }
    async getStaffPayouts(staffId, req) {
        try {
            const companyId = await this.getCompanyId(req);
            return await this.payoutsService.getStaffPayoutsForCompanyMember(BigInt(staffId), companyId);
        }
        catch (e) {
            console.error('\n\n=========================================\nCRITICAL CONTROLLER ERROR:', e, '\n=========================================\n\n');
            throw e;
        }
    }
    async approveStaffPayout(id, req) {
        const companyId = await this.getCompanyId(req);
        return this.payoutsService.approveStaffPayout(id, companyId);
    }
    async rejectStaffPayout(id, req) {
        const companyId = await this.getCompanyId(req);
        return this.payoutsService.rejectStaffPayout(id, companyId);
    }
    async getPaymentMethods(req) {
        const companyId = await this.getCompanyId(req);
        return this.payoutsService.getPaymentMethods(companyId);
    }
    async addPaymentMethod(req, body) {
        const companyId = await this.getCompanyId(req);
        return this.payoutsService.addPaymentMethod(companyId, body);
    }
    async updatePaymentMethod(id, req, body) {
        const companyId = await this.getCompanyId(req);
        return this.payoutsService.updatePaymentMethod(id, companyId, body);
    }
    async deletePaymentMethod(id, req) {
        const companyId = await this.getCompanyId(req);
        return this.payoutsService.deletePaymentMethod(id, companyId);
    }
};
exports.PayoutsController = PayoutsController;
__decorate([
    (0, common_1.Get)('payouts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get payout history for company' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "getPayouts", null);
__decorate([
    (0, common_1.Post)('payouts/request'),
    (0, swagger_1.ApiOperation)({ summary: 'Request a payout' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "requestPayout", null);
__decorate([
    (0, common_1.Get)('staff/:staffId/payouts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get payout requests from a specific staff member' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('staffId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "getStaffPayouts", null);
__decorate([
    (0, common_1.Patch)('payouts/:id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a staff payout request' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "approveStaffPayout", null);
__decorate([
    (0, common_1.Patch)('payouts/:id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a staff payout request' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "rejectStaffPayout", null);
__decorate([
    (0, common_1.Get)('payment-methods'),
    (0, swagger_1.ApiOperation)({ summary: 'Get saved payment methods' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "getPaymentMethods", null);
__decorate([
    (0, common_1.Post)('payment-methods'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a payment method' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "addPaymentMethod", null);
__decorate([
    (0, common_1.Patch)('payment-methods/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a payment method' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "updatePaymentMethod", null);
__decorate([
    (0, common_1.Delete)('payment-methods/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a payment method' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "deletePaymentMethod", null);
exports.PayoutsController = PayoutsController = __decorate([
    (0, swagger_1.ApiTags)('Company Payouts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin'),
    (0, common_1.Controller)('company'),
    __metadata("design:paramtypes", [payouts_service_1.PayoutsService])
], PayoutsController);
//# sourceMappingURL=payouts.controller.js.map