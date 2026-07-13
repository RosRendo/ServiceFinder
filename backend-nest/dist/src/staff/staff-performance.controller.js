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
exports.StaffPerformanceController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const staff_performance_service_1 = require("./staff-performance.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let StaffPerformanceController = class StaffPerformanceController {
    staffPerformanceService;
    constructor(staffPerformanceService) {
        this.staffPerformanceService = staffPerformanceService;
    }
    getMyPerformance(req) {
        return this.staffPerformanceService.getPerformance(BigInt(req.user.id));
    }
    getMyWallet(req) {
        return this.staffPerformanceService.getWallet(BigInt(req.user.id));
    }
    getStaffPerformance(id) {
        return this.staffPerformanceService.getPerformance(BigInt(id));
    }
    getStaffAvailability(req, id) {
        const companyId = req.user.companyId || req.user.id;
        return this.staffPerformanceService.getStaffAvailabilityForCompany(BigInt(req.user.id), id);
    }
    getMyReviews(req, page = '1', limit = '10') {
        return this.staffPerformanceService.getStaffReviews(BigInt(req.user.id), +page, +limit);
    }
    getMyAvailability(req) {
        return this.staffPerformanceService.getAvailability(BigInt(req.user.id));
    }
    updateMyAvailability(req, body) {
        return this.staffPerformanceService.updateAvailability(BigInt(req.user.id), body.slots);
    }
};
exports.StaffPerformanceController = StaffPerformanceController;
__decorate([
    (0, common_1.Get)('performance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get own performance metrics' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StaffPerformanceController.prototype, "getMyPerformance", null);
__decorate([
    (0, common_1.Get)('wallet'),
    (0, swagger_1.ApiOperation)({ summary: 'Get own wallet balance and transactions' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StaffPerformanceController.prototype, "getMyWallet", null);
__decorate([
    (0, common_1.Get)(':id/performance'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'company_admin'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get performance metrics for a specific staff member',
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StaffPerformanceController.prototype, "getStaffPerformance", null);
__decorate([
    (0, common_1.Get)(':id/availability'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'company_admin'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get availability/time-off for a specific staff member (company owner only)',
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StaffPerformanceController.prototype, "getStaffAvailability", null);
__decorate([
    (0, common_1.Get)('reviews'),
    (0, swagger_1.ApiOperation)({ summary: 'Get own reviews' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], StaffPerformanceController.prototype, "getMyReviews", null);
__decorate([
    (0, common_1.Get)('availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Get own availability slots' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StaffPerformanceController.prototype, "getMyAvailability", null);
__decorate([
    (0, common_1.Put)('availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Update own availability slots' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], StaffPerformanceController.prototype, "updateMyAvailability", null);
exports.StaffPerformanceController = StaffPerformanceController = __decorate([
    (0, swagger_1.ApiTags)('Staff'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('staff'),
    __metadata("design:paramtypes", [staff_performance_service_1.StaffPerformanceService])
], StaffPerformanceController);
//# sourceMappingURL=staff-performance.controller.js.map