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
exports.AdminController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const create_company_admin_dto_1 = require("./dto/create-company-admin.dto");
const update_company_admin_dto_1 = require("./dto/update-company-admin.dto");
const update_user_admin_dto_1 = require("./dto/update-user-admin.dto");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    getAnalytics() {
        return this.adminService.getAnalytics();
    }
    getUsers(query) {
        return this.adminService.getUsers(query);
    }
    getUser(id) {
        return this.adminService.getUserById(BigInt(id));
    }
    updateUser(id, dto) {
        return this.adminService.updateUser(BigInt(id), dto);
    }
    suspendUser(id, body) {
        return this.adminService.setUserStatus(BigInt(id), 'suspended', body.reason);
    }
    unsuspendUser(id) {
        return this.adminService.setUserStatus(BigInt(id), 'active');
    }
    getCompanies(query) {
        return this.adminService.getCompanies(query);
    }
    updateCompany(id, dto) {
        return this.adminService.updateCompany(BigInt(id), dto);
    }
    getCompanyDetails(id) {
        return this.adminService.getCompanyDetails(id);
    }
    createCompanyAdmin(dto) {
        return this.adminService.createCompanyAdmin(dto);
    }
    verifyCompany(id) {
        return this.adminService.setCompanyVerification(BigInt(id), 'verified');
    }
    acceptCompany(id) {
        return this.adminService.setCompanyVerification(BigInt(id), 'verified');
    }
    rejectCompany(id, body) {
        return this.adminService.setCompanyVerification(BigInt(id), 'rejected', body.reason);
    }
    expireCompanyTrial(id) {
        return this.adminService.expireCompanyTrial(BigInt(id));
    }
    getAllDisputes(query) {
        return this.adminService.getAllDisputes(query);
    }
    resolveDispute(id, dto) {
        return this.adminService.resolveDispute(+id, dto);
    }
    refundPayment(id, body) {
        return this.adminService.processRefund(BigInt(id), body);
    }
    getTransactions(query) {
        return this.adminService.getTransactions(query);
    }
    getPayouts(query) {
        return this.adminService.getPayouts(query);
    }
    approvePayout(id) {
        return this.adminService.updatePayoutStatus(+id, 'completed');
    }
    rejectPayout(id) {
        return this.adminService.updatePayoutStatus(+id, 'failed');
    }
    getInvoices(query) {
        return this.adminService.getInvoices(query);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('analytics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get overall platform analytics' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'List all users with filters' }),
    (0, swagger_1.ApiQuery)({ name: 'role', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getUser", null);
__decorate([
    (0, common_1.Patch)('users/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user details' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_admin_dto_1.UpdateUserAdminDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Post)('users/:id/suspend'),
    (0, swagger_1.ApiOperation)({ summary: 'Suspend a user' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "suspendUser", null);
__decorate([
    (0, common_1.Post)('users/:id/unsuspend'),
    (0, swagger_1.ApiOperation)({ summary: 'Unsuspend a user' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "unsuspendUser", null);
__decorate([
    (0, common_1.Get)('companies'),
    (0, swagger_1.ApiOperation)({ summary: 'List all companies with filters' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getCompanies", null);
__decorate([
    (0, common_1.Patch)('companies/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update company details' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_company_admin_dto_1.UpdateCompanyAdminDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateCompany", null);
__decorate([
    (0, common_1.Get)('companies/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get details of a specific company' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getCompanyDetails", null);
__decorate([
    (0, common_1.Post)('companies'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new company and company admin user' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_company_admin_dto_1.CreateCompanyAdminDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createCompanyAdmin", null);
__decorate([
    (0, common_1.Post)('companies/:id/verify'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify a company' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "verifyCompany", null);
__decorate([
    (0, common_1.Post)('companies/:id/accept'),
    (0, swagger_1.ApiOperation)({ summary: 'Accept a company verification' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "acceptCompany", null);
__decorate([
    (0, common_1.Post)('companies/:id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a company verification' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "rejectCompany", null);
__decorate([
    (0, common_1.Post)('companies/:id/expire-trial'),
    (0, swagger_1.ApiOperation)({ summary: 'Expire a company trial immediately' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "expireCompanyTrial", null);
__decorate([
    (0, common_1.Get)('disputes'),
    (0, swagger_1.ApiOperation)({ summary: 'List all disputes' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAllDisputes", null);
__decorate([
    (0, common_1.Patch)('disputes/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve a dispute' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "resolveDispute", null);
__decorate([
    (0, common_1.Post)('payments/:id/refund'),
    (0, swagger_1.ApiOperation)({ summary: 'Process a manual refund for a payment' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "refundPayment", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, swagger_1.ApiOperation)({ summary: 'List all financial transactions' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, description: 'credit or debit' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Get)('payouts'),
    (0, swagger_1.ApiOperation)({ summary: 'List all payout requests' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getPayouts", null);
__decorate([
    (0, common_1.Post)('payouts/:id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a payout request' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "approvePayout", null);
__decorate([
    (0, common_1.Post)('payouts/:id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a payout request' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "rejectPayout", null);
__decorate([
    (0, common_1.Get)('invoices'),
    (0, swagger_1.ApiOperation)({ summary: 'List all invoices' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getInvoices", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map