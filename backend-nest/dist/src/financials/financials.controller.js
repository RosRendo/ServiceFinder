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
exports.FinancialsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const financials_service_1 = require("./financials.service");
const financials_dto_1 = require("./dto/financials.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let FinancialsController = class FinancialsController {
    financialsService;
    constructor(financialsService) {
        this.financialsService = financialsService;
    }
    getWallet(req) {
        return this.financialsService.getWallet(req.user);
    }
    requestPayout(dto, req) {
        return this.financialsService.requestPayout(dto, req.user);
    }
    getAllPayoutRequests() {
        return this.financialsService.getAllPayoutRequests();
    }
    processPayoutRequest(id, dto) {
        return this.financialsService.processPayoutRequest(BigInt(id), dto);
    }
};
exports.FinancialsController = FinancialsController;
__decorate([
    (0, common_1.Get)('financials/wallet'),
    (0, roles_decorator_1.Roles)('company_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get wallet balance and transaction history' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinancialsController.prototype, "getWallet", null);
__decorate([
    (0, common_1.Post)('financials/payout-requests'),
    (0, roles_decorator_1.Roles)('company_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Request a withdrawal from wallet' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [financials_dto_1.PayoutRequestDto, Object]),
    __metadata("design:returntype", void 0)
], FinancialsController.prototype, "requestPayout", null);
__decorate([
    (0, common_1.Get)('admin/financials/payout-requests'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all pending payout requests' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FinancialsController.prototype, "getAllPayoutRequests", null);
__decorate([
    (0, common_1.Patch)('admin/financials/payout-requests/:id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve or reject a payout request' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, financials_dto_1.ProcessPayoutDto]),
    __metadata("design:returntype", void 0)
], FinancialsController.prototype, "processPayoutRequest", null);
exports.FinancialsController = FinancialsController = __decorate([
    (0, swagger_1.ApiTags)('Financials'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [financials_service_1.FinancialsService])
], FinancialsController);
//# sourceMappingURL=financials.controller.js.map