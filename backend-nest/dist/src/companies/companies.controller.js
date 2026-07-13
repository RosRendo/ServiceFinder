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
exports.CompaniesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cache_manager_1 = require("@nestjs/cache-manager");
const companies_service_1 = require("./companies.service");
const create_company_dto_1 = require("./dto/create-company.dto");
const update_company_dto_1 = require("./dto/update-company.dto");
const availability_dto_1 = require("./dto/availability.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let CompaniesController = class CompaniesController {
    companiesService;
    constructor(companiesService) {
        this.companiesService = companiesService;
    }
    getAllCompanies(query) {
        return this.companiesService.getAllCompanies(query);
    }
    createCompany(createCompanyDto, user) {
        return this.companiesService.createCompany(user.id, createCompanyDto);
    }
    getMyCompany(user) {
        return this.companiesService.getMyCompany(BigInt(user.id));
    }
    getMyCompanyMetrics(user) {
        return this.companiesService.getMyCompanyMetrics(BigInt(user.id));
    }
    getMyCompanyStaff(user) {
        return this.companiesService.getMyCompanyStaff(BigInt(user.id));
    }
    getStaffMemberById(staffId, user) {
        return this.companiesService.getStaffMemberById(BigInt(staffId), BigInt(user.id));
    }
    addStaffMember(body, user) {
        return this.companiesService.addStaffMember(BigInt(user.id), body);
    }
    updateStaffMember(staffId, body, user) {
        return this.companiesService.updateStaffMember(BigInt(staffId), BigInt(user.id), body);
    }
    removeStaffMember(staffId, user) {
        return this.companiesService.removeStaffMember(BigInt(staffId), BigInt(user.id));
    }
    reactivateStaffMember(staffId, user) {
        return this.companiesService.reactivateStaffMember(BigInt(staffId), BigInt(user.id));
    }
    getStaffWallet(staffId, user) {
        return this.companiesService.getStaffWallet(BigInt(staffId), BigInt(user.id), user.role);
    }
    topUpStaffWallet(staffId, body, user) {
        return this.companiesService.topUpStaffWallet(BigInt(staffId), BigInt(user.id), body);
    }
    getCompanySubscription(user) {
        return this.companiesService.getCompanySubscription(BigInt(user.id));
    }
    upgradeSubscription(body, user) {
        return this.companiesService.upgradeSubscription(BigInt(user.id), body.planId);
    }
    getMyCompanyCampaigns(user) {
        return this.companiesService.getMyCompanyCampaigns(BigInt(user.id));
    }
    getFeaturedCompanies(query) {
        return this.companiesService.getFeaturedCompanies(query);
    }
    getNearbyCompanies(query) {
        return this.companiesService.getNearbyCompanies(query);
    }
    getNewCompanies(query) {
        return this.companiesService.getNewCompanies(query);
    }
    getRecommendedCompanies(query) {
        return this.companiesService.getRecommendedCompanies(query);
    }
    getAdminStats() {
        return this.companiesService.getAdminStats();
    }
    getAdminAnalytics() {
        return this.companiesService.getAdminAnalytics();
    }
    getCompaniesByCategory(categorySlug, query) {
        return this.companiesService.getCompaniesByCategory(categorySlug, query);
    }
    getCompaniesByServiceType(categorySlug, serviceTypeSlug, query) {
        return this.companiesService.getCompaniesByServiceType(categorySlug, serviceTypeSlug, query);
    }
    getCompanyById(id) {
        return this.companiesService.getCompanyById(BigInt(id));
    }
    updateCompany(id, updateCompanyDto, user) {
        return this.companiesService.updateCompany(BigInt(id), user.id, user.role, updateCompanyDto);
    }
    deleteCompany(id, user) {
        return this.companiesService.deleteCompany(BigInt(id), user.id, user.role);
    }
    addStaffAvailability(staffId, dto, user) {
        return this.companiesService.addStaffAvailability(BigInt(user.id), BigInt(staffId), dto);
    }
    generateStaffAvailability(staffId, dto, user) {
        return this.companiesService.generateStaffAvailability(BigInt(user.id), BigInt(staffId), dto);
    }
    getStaffAvailability(staffId, startDate, endDate, user) {
        return this.companiesService.getStaffAvailability(BigInt(user.id), BigInt(staffId), startDate, endDate);
    }
    removeStaffAvailability(slotId, user) {
        return this.companiesService.removeStaffAvailability(BigInt(user.id), BigInt(slotId));
    }
};
exports.CompaniesController = CompaniesController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(30000),
    (0, swagger_1.ApiOperation)({ summary: 'Get all companies' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return all companies.' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getAllCompanies", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new company' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'The company has been successfully created.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_company_dto_1.CreateCompanyDto, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "createCompany", null);
__decorate([
    (0, common_1.Get)('my-company'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get the logged in user's company" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return company details.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getMyCompany", null);
__decorate([
    (0, common_1.Get)('my-company/metrics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get KPI metrics for the user's company" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return company metrics.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getMyCompanyMetrics", null);
__decorate([
    (0, common_1.Get)('my-company/staff'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get staff for the user's company" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return company staff list.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getMyCompanyStaff", null);
__decorate([
    (0, common_1.Get)('staff/:staffId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific staff member' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return staff member details.' }),
    __param(0, (0, common_1.Param)('staffId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getStaffMemberById", null);
__decorate([
    (0, common_1.Post)('staff'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add a new staff member' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Staff member added.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "addStaffMember", null);
__decorate([
    (0, common_1.Put)('staff/:staffId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a specific staff member' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Staff member updated.' }),
    __param(0, (0, common_1.Param)('staffId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "updateStaffMember", null);
__decorate([
    (0, common_1.Delete)('staff/:staffId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a specific staff member' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Staff member removed.' }),
    __param(0, (0, common_1.Param)('staffId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "removeStaffMember", null);
__decorate([
    (0, common_1.Post)('staff/:staffId/reactivate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Reactivate a specific staff member' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Staff member reactivated.' }),
    __param(0, (0, common_1.Param)('staffId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "reactivateStaffMember", null);
__decorate([
    (0, common_1.Get)('staff/:staffId/wallet'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin', 'staff'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get staff wallet details and transactions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return staff wallet details.' }),
    __param(0, (0, common_1.Param)('staffId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getStaffWallet", null);
__decorate([
    (0, common_1.Post)('staff/:staffId/wallet/topup'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Top up a staff member's digital wallet" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wallet topped up successfully.' }),
    __param(0, (0, common_1.Param)('staffId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "topUpStaffWallet", null);
__decorate([
    (0, common_1.Get)('subscription'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get the user company subscription details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return company subscription.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getCompanySubscription", null);
__decorate([
    (0, common_1.Post)('subscription/upgrade'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Upgrade the user company subscription plan' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscription upgraded.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "upgradeSubscription", null);
__decorate([
    (0, common_1.Get)('my-company/campaigns'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get marketing campaigns for the user's company" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Return company marketing campaigns.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getMyCompanyCampaigns", null);
__decorate([
    (0, common_1.Get)('featured'),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(60000),
    (0, swagger_1.ApiOperation)({ summary: 'Get featured companies' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return featured companies.' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getFeaturedCompanies", null);
__decorate([
    (0, common_1.Get)('nearby'),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(30000),
    (0, swagger_1.ApiOperation)({ summary: 'Get nearby companies' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return nearby companies.' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getNearbyCompanies", null);
__decorate([
    (0, common_1.Get)('new'),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(60000),
    (0, swagger_1.ApiOperation)({ summary: 'Get new companies' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return new companies.' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getNewCompanies", null);
__decorate([
    (0, common_1.Get)('recommended'),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(60000),
    (0, swagger_1.ApiOperation)({ summary: 'Get recommended companies' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return recommended companies.' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getRecommendedCompanies", null);
__decorate([
    (0, common_1.Get)('admin/stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get global stats for the admin dashboard' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return global admin stats.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getAdminStats", null);
__decorate([
    (0, common_1.Get)('admin/analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get deep analytics data for admin dashboard' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return admin analytics data.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getAdminAnalytics", null);
__decorate([
    (0, common_1.Get)('categories/:categorySlug'),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(30000),
    (0, swagger_1.ApiOperation)({ summary: 'Get companies by category' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return companies by category.' }),
    __param(0, (0, common_1.Param)('categorySlug')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getCompaniesByCategory", null);
__decorate([
    (0, common_1.Get)('categories/:categorySlug/service-types/:serviceTypeSlug'),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(30000),
    (0, swagger_1.ApiOperation)({ summary: 'Get companies by category and service type' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return companies.' }),
    __param(0, (0, common_1.Param)('categorySlug')),
    __param(1, (0, common_1.Param)('serviceTypeSlug')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getCompaniesByServiceType", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(60000),
    (0, swagger_1.ApiOperation)({ summary: 'Get company by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return company details.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Company not found.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getCompanyById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update company details' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The company has been successfully updated.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_company_dto_1.UpdateCompanyDto, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "updateCompany", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a company' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The company has been successfully deleted.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "deleteCompany", null);
__decorate([
    (0, common_1.Post)('my-company/staff/:staffId/availability'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add an availability slot for a staff member' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('staffId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, availability_dto_1.AddAvailabilityDto, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "addStaffAvailability", null);
__decorate([
    (0, common_1.Post)('my-company/staff/:staffId/availability/generate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Generate availability slots for a date range' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('staffId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, availability_dto_1.GenerateAvailabilityDto, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "generateStaffAvailability", null);
__decorate([
    (0, common_1.Get)('my-company/staff/:staffId/availability'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin', 'company_staff'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get availability slots for a staff member' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('staffId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getStaffAvailability", null);
__decorate([
    (0, common_1.Delete)('my-company/availability/:slotId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('company_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Remove an availability slot' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('slotId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "removeStaffAvailability", null);
exports.CompaniesController = CompaniesController = __decorate([
    (0, swagger_1.ApiTags)('Companies'),
    (0, common_1.Controller)('companies'),
    __metadata("design:paramtypes", [companies_service_1.CompaniesService])
], CompaniesController);
//# sourceMappingURL=companies.controller.js.map