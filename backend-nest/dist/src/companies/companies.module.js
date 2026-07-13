"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompaniesModule = void 0;
const common_1 = require("@nestjs/common");
const companies_controller_1 = require("./companies.controller");
const companies_service_1 = require("./companies.service");
const cloudinary_config_1 = require("../config/cloudinary.config");
const mail_module_1 = require("../mail/mail.module");
const settings_module_1 = require("../settings/settings.module");
let CompaniesModule = class CompaniesModule {
};
exports.CompaniesModule = CompaniesModule;
exports.CompaniesModule = CompaniesModule = __decorate([
    (0, common_1.Module)({
        imports: [mail_module_1.MailModule, settings_module_1.SettingsModule],
        controllers: [companies_controller_1.CompaniesController],
        providers: [companies_service_1.CompaniesService, cloudinary_config_1.CloudinaryProvider],
        exports: [cloudinary_config_1.CloudinaryProvider],
    })
], CompaniesModule);
//# sourceMappingURL=companies.module.js.map