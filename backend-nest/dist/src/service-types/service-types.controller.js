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
exports.ServiceTypesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const service_types_service_1 = require("./service-types.service");
const create_service_type_dto_1 = require("./dto/create-service-type.dto");
const update_service_type_dto_1 = require("./dto/update-service-type.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let ServiceTypesController = class ServiceTypesController {
    serviceTypesService;
    constructor(serviceTypesService) {
        this.serviceTypesService = serviceTypesService;
    }
    getAllServiceTypes() {
        return this.serviceTypesService.getAllServiceTypes();
    }
    getServiceTypesByCategory(categorySlug) {
        return this.serviceTypesService.getServiceTypesByCategory(categorySlug);
    }
    getServiceTypeBySlug(slug) {
        return this.serviceTypesService.getServiceTypeBySlug(slug);
    }
    getProvidersForServiceType(slug) {
        return this.serviceTypesService.getProvidersForServiceType(slug);
    }
    createServiceType(createServiceTypeDto) {
        return this.serviceTypesService.createServiceType(createServiceTypeDto);
    }
    updateServiceType(id, updateServiceTypeDto) {
        return this.serviceTypesService.updateServiceType(BigInt(id), updateServiceTypeDto);
    }
    deleteServiceType(id) {
        return this.serviceTypesService.deleteServiceType(BigInt(id));
    }
};
exports.ServiceTypesController = ServiceTypesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all service types' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return all service types.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ServiceTypesController.prototype, "getAllServiceTypes", null);
__decorate([
    (0, common_1.Get)('category/:categorySlug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get service types by category slug' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return service types.' }),
    __param(0, (0, common_1.Param)('categorySlug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServiceTypesController.prototype, "getServiceTypesByCategory", null);
__decorate([
    (0, common_1.Get)(':slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get service type by slug' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return service type details.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Service type not found.' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServiceTypesController.prototype, "getServiceTypeBySlug", null);
__decorate([
    (0, common_1.Get)(':slug/providers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get providers (companies) offering a specific service type' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return list of providers with pure facts.' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServiceTypesController.prototype, "getProvidersForServiceType", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new service type (Admin only)' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'The service type has been successfully created.',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_service_type_dto_1.CreateServiceTypeDto]),
    __metadata("design:returntype", void 0)
], ServiceTypesController.prototype, "createServiceType", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a service type (Admin only)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The service type has been successfully updated.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_service_type_dto_1.UpdateServiceTypeDto]),
    __metadata("design:returntype", void 0)
], ServiceTypesController.prototype, "updateServiceType", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a service type (Admin only)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The service type has been successfully deleted.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServiceTypesController.prototype, "deleteServiceType", null);
exports.ServiceTypesController = ServiceTypesController = __decorate([
    (0, swagger_1.ApiTags)('Service Types'),
    (0, common_1.Controller)('service-types'),
    __metadata("design:paramtypes", [service_types_service_1.ServiceTypesService])
], ServiceTypesController);
//# sourceMappingURL=service-types.controller.js.map