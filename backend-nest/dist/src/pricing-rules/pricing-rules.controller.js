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
exports.PricingRulesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pricing_rules_service_1 = require("./pricing-rules.service");
const create_pricing_rule_dto_1 = require("./dto/create-pricing-rule.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let PricingRulesController = class PricingRulesController {
    pricingRulesService;
    constructor(pricingRulesService) {
        this.pricingRulesService = pricingRulesService;
    }
    getPricingRules(user) {
        return this.pricingRulesService.getPricingRules(BigInt(user.id));
    }
    createPricingRule(dto, user) {
        return this.pricingRulesService.createPricingRule(BigInt(user.id), dto);
    }
    toggleActive(id, user) {
        return this.pricingRulesService.toggleActive(BigInt(user.id), Number(id));
    }
    deletePricingRule(id, user) {
        return this.pricingRulesService.deletePricingRule(BigInt(user.id), Number(id));
    }
};
exports.PricingRulesController = PricingRulesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all pricing rules for the company' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PricingRulesController.prototype, "getPricingRules", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new pricing rule' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_pricing_rule_dto_1.CreatePricingRuleDto, Object]),
    __metadata("design:returntype", void 0)
], PricingRulesController.prototype, "createPricingRule", null);
__decorate([
    (0, common_1.Patch)(':id/toggle'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle pricing rule active state' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PricingRulesController.prototype, "toggleActive", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a pricing rule' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PricingRulesController.prototype, "deletePricingRule", null);
exports.PricingRulesController = PricingRulesController = __decorate([
    (0, swagger_1.ApiTags)('Pricing Rules'),
    (0, common_1.Controller)('companies/my-company/pricing-rules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [pricing_rules_service_1.PricingRulesService])
], PricingRulesController);
//# sourceMappingURL=pricing-rules.controller.js.map