"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedItemsModule = void 0;
const common_1 = require("@nestjs/common");
const saved_items_controller_1 = require("./saved-items.controller");
const saved_items_service_1 = require("./saved-items.service");
let SavedItemsModule = class SavedItemsModule {
};
exports.SavedItemsModule = SavedItemsModule;
exports.SavedItemsModule = SavedItemsModule = __decorate([
    (0, common_1.Module)({
        controllers: [saved_items_controller_1.SavedItemsController],
        providers: [saved_items_service_1.SavedItemsService],
    })
], SavedItemsModule);
//# sourceMappingURL=saved-items.module.js.map