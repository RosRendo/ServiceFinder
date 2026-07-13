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
exports.StaffPayoutsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payouts_service_1 = require("./payouts.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
let StaffPayoutsController = class StaffPayoutsController {
    payoutsService;
    prisma;
    constructor(payoutsService, prisma) {
        this.payoutsService = payoutsService;
        this.prisma = prisma;
    }
    async getStaffId(req) {
        const staff = await this.prisma.companyStaff.findFirst({
            where: { userId: BigInt(req.user.id) },
        });
        if (!staff)
            throw new common_1.NotFoundException('You are not registered as staff');
        return staff.id;
    }
    async getPayouts(req) {
        const staffId = await this.getStaffId(req);
        return this.payoutsService.getStaffPayouts(staffId);
    }
    async requestPayout(req, body) {
        const staffId = await this.getStaffId(req);
        return this.payoutsService.requestStaffPayout(staffId, body.amount, body.method);
    }
    async getPaymentMethods(req) {
        const staffId = await this.getStaffId(req);
        return this.payoutsService.getStaffPaymentMethods(staffId);
    }
    async addPaymentMethod(req, body) {
        const staffId = await this.getStaffId(req);
        return this.payoutsService.addStaffPaymentMethod(staffId, body);
    }
    async updatePaymentMethod(id, req, body) {
        const staffId = await this.getStaffId(req);
        return this.payoutsService.updateStaffPaymentMethod(id, staffId, body);
    }
    async deletePaymentMethod(id, req) {
        const staffId = await this.getStaffId(req);
        return this.payoutsService.deleteStaffPaymentMethod(id, staffId);
    }
};
exports.StaffPayoutsController = StaffPayoutsController;
__decorate([
    (0, common_1.Get)('payouts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get payout history for staff' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StaffPayoutsController.prototype, "getPayouts", null);
__decorate([
    (0, common_1.Post)('payouts/request'),
    (0, swagger_1.ApiOperation)({ summary: 'Request a payout' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StaffPayoutsController.prototype, "requestPayout", null);
__decorate([
    (0, common_1.Get)('payment-methods'),
    (0, swagger_1.ApiOperation)({ summary: 'Get saved payment methods' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StaffPayoutsController.prototype, "getPaymentMethods", null);
__decorate([
    (0, common_1.Post)('payment-methods'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a payment method' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StaffPayoutsController.prototype, "addPaymentMethod", null);
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
], StaffPayoutsController.prototype, "updatePaymentMethod", null);
__decorate([
    (0, common_1.Delete)('payment-methods/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a payment method' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], StaffPayoutsController.prototype, "deletePaymentMethod", null);
exports.StaffPayoutsController = StaffPayoutsController = __decorate([
    (0, swagger_1.ApiTags)('Staff Payouts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('staff'),
    (0, common_1.Controller)('staff'),
    __metadata("design:paramtypes", [payouts_service_1.PayoutsService,
        prisma_service_1.PrismaService])
], StaffPayoutsController);
//# sourceMappingURL=staff-payouts.controller.js.map