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
exports.SavedItemsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const saved_items_service_1 = require("./saved-items.service");
const saved_item_dto_1 = require("./dto/saved-item.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let SavedItemsController = class SavedItemsController {
    savedItemsService;
    constructor(savedItemsService) {
        this.savedItemsService = savedItemsService;
    }
    getSavedItems(req, query) {
        return this.savedItemsService.getSavedItems(req.user.id, query);
    }
    saveItem(req, savedItemDto) {
        return this.savedItemsService.saveItem(req.user.id, savedItemDto);
    }
    unsaveItem(req, savedItemDto) {
        return this.savedItemsService.unsaveItem(req.user.id, savedItemDto);
    }
    checkSaved(req, query) {
        return this.savedItemsService.checkSaved(req.user.id, query);
    }
};
exports.SavedItemsController = SavedItemsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get saved items for the current user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return saved items.' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SavedItemsController.prototype, "getSavedItems", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Save an item (company or service)' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'The item has been successfully saved.',
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, saved_item_dto_1.SavedItemDto]),
    __metadata("design:returntype", void 0)
], SavedItemsController.prototype, "saveItem", null);
__decorate([
    (0, common_1.Delete)(),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a saved item' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The item has been successfully removed.',
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, saved_item_dto_1.SavedItemDto]),
    __metadata("design:returntype", void 0)
], SavedItemsController.prototype, "unsaveItem", null);
__decorate([
    (0, common_1.Get)('check'),
    (0, swagger_1.ApiOperation)({ summary: 'Check if an item is saved' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns boolean indicating if item is saved.',
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SavedItemsController.prototype, "checkSaved", null);
exports.SavedItemsController = SavedItemsController = __decorate([
    (0, swagger_1.ApiTags)('Saved Items'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('saved-items'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [saved_items_service_1.SavedItemsService])
], SavedItemsController);
//# sourceMappingURL=saved-items.controller.js.map