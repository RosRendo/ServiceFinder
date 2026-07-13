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
exports.UsersController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const update_user_dto_1 = require("./dto/update-user.dto");
const update_status_dto_1 = require("./dto/update-status.dto");
const request_contact_update_dto_1 = require("./dto/request-contact-update.dto");
const verify_contact_update_dto_1 = require("./dto/verify-contact-update.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const public_decorator_1 = require("../auth/decorators/public.decorator");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    getAllUsers(query) {
        return this.usersService.getAllUsers(query);
    }
    getRecommendedStaff(query) {
        return this.usersService.getRecommendedStaff(query);
    }
    getAdminMetrics() {
        return this.usersService.getAdminMetrics();
    }
    async getMyPreferences(user) {
        try {
            return await this.usersService.getPreferences(BigInt(user.id));
        }
        catch (e) {
            require('fs').appendFileSync('error_log.txt', e.stack + '\n');
            throw e;
        }
    }
    updateMyPreferences(dto, user) {
        return this.usersService.updatePreferences(BigInt(user.id), dto);
    }
    getUserById(id) {
        return this.usersService.getUserById(BigInt(id));
    }
    updateUserPut(id, updateUserDto, user) {
        return this.usersService.updateUser(BigInt(id), updateUserDto, user);
    }
    updateUserPatch(id, updateUserDto, user) {
        return this.usersService.updateUser(BigInt(id), updateUserDto, user);
    }
    requestContactUpdate(requestContactUpdateDto, user) {
        return this.usersService.requestContactUpdate(BigInt(user.id), requestContactUpdateDto);
    }
    verifyContactUpdate(verifyContactUpdateDto, user) {
        return this.usersService.verifyContactUpdate(BigInt(user.id), verifyContactUpdateDto);
    }
    deleteOwnAccount(user) {
        return this.usersService.deleteAccount(BigInt(user.id));
    }
    deleteUser(id, user) {
        return this.usersService.deleteUser(BigInt(id), user);
    }
    updateUserStatus(id, updateStatusDto, user) {
        return this.usersService.updateUserStatus(BigInt(id), updateStatusDto, user);
    }
    updateStaffStatus(status, user) {
        return this.usersService.updateStaffStatus(BigInt(user.id), status);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return all users.' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getAllUsers", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('staff/recommended'),
    (0, swagger_1.ApiOperation)({ summary: 'Get recommended staff' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return recommended staff.' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getRecommendedStaff", null);
__decorate([
    (0, common_1.Get)('admin/metrics'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get global metrics for Admin Dashboard' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return global metrics.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getAdminMetrics", null);
__decorate([
    (0, common_1.Get)('me/preferences'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user preferences' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return user preferences.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMyPreferences", null);
__decorate([
    (0, common_1.Patch)('me/preferences'),
    (0, swagger_1.ApiOperation)({ summary: 'Update current user preferences' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Preferences updated successfully.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateMyPreferences", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return user details.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user (Put)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User updated successfully.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateUserPut", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user (Patch)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User updated successfully.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateUserPatch", null);
__decorate([
    (0, common_1.Post)('request-contact-update'),
    (0, swagger_1.ApiOperation)({ summary: 'Request OTP/Code to update email or phone' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OTP/Code sent successfully.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_contact_update_dto_1.RequestContactUpdateDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "requestContactUpdate", null);
__decorate([
    (0, common_1.Post)('verify-contact-update'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify OTP/Code to update email or phone' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Contact updated successfully.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_contact_update_dto_1.VerifyContactUpdateDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "verifyContactUpdate", null);
__decorate([
    (0, common_1.Delete)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete own account (Anonymize data)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Account anonymized successfully.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteOwnAccount", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete user (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User deleted successfully.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user status (Admin only)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User status updated successfully.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_status_dto_1.UpdateStatusDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateUserStatus", null);
__decorate([
    (0, common_1.Patch)('me/staff-status'),
    (0, roles_decorator_1.Roles)('staff'),
    (0, swagger_1.ApiOperation)({ summary: 'Update staff online status' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Staff status updated successfully.',
    }),
    __param(0, (0, common_1.Body)('status')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateStaffStatus", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map