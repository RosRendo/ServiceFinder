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
exports.PromoCodesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const promo_codes_service_1 = require("./promo-codes.service");
const create_promo_code_dto_1 = require("./dto/create-promo-code.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let PromoCodesController = class PromoCodesController {
    promoCodesService;
    constructor(promoCodesService) {
        this.promoCodesService = promoCodesService;
    }
    getAllPromoCodes() {
        return this.promoCodesService.getAllPromoCodes();
    }
    createPromoCode(dto) {
        return this.promoCodesService.createPromoCode(dto);
    }
    validatePromoCode(code) {
        return this.promoCodesService.validatePromoCode(code);
    }
    toggleActive(id) {
        return this.promoCodesService.toggleActive(Number(id));
    }
    deletePromoCode(id) {
        return this.promoCodesService.deletePromoCode(Number(id));
    }
};
exports.PromoCodesController = PromoCodesController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all promo codes (Admin only)' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PromoCodesController.prototype, "getAllPromoCodes", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new promo code (Admin only)' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_promo_code_dto_1.CreatePromoCodeDto]),
    __metadata("design:returntype", void 0)
], PromoCodesController.prototype, "createPromoCode", null);
__decorate([
    (0, common_1.Get)('validate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Validate a promo code' }),
    (0, swagger_1.ApiQuery)({ name: 'code', required: true }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PromoCodesController.prototype, "validatePromoCode", null);
__decorate([
    (0, common_1.Patch)(':id/toggle'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle promo code active state (Admin only)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PromoCodesController.prototype, "toggleActive", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a promo code (Admin only)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PromoCodesController.prototype, "deletePromoCode", null);
exports.PromoCodesController = PromoCodesController = __decorate([
    (0, swagger_1.ApiTags)('Promo Codes'),
    (0, common_1.Controller)('promo-codes'),
    __metadata("design:paramtypes", [promo_codes_service_1.PromoCodesService])
], PromoCodesController);
//# sourceMappingURL=promo-codes.controller.js.map