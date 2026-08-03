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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
let SettingsService = class SettingsService {
    prisma;
    eventEmitter;
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async getAllSettings() {
        const settings = await this.prisma.systemSetting.findMany();
        const config = {};
        settings.forEach((setting) => {
            try {
                config[setting.keyName] = JSON.parse(setting.value || 'null');
            }
            catch {
                config[setting.keyName] = setting.value;
            }
        });
        return config;
    }
    async getSetting(keyName, defaultValue = '') {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { keyName },
        });
        return setting?.value || defaultValue;
    }
    async getSettingNumber(keyName, defaultValue = 0) {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { keyName },
        });
        if (setting && setting.value) {
            const parsed = Number(setting.value);
            if (!isNaN(parsed))
                return parsed;
        }
        return defaultValue;
    }
    async updateSettings(dto) {
        const updates = Object.entries(dto).map(async ([key, value]) => {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            return this.prisma.systemSetting.upsert({
                where: { keyName: key },
                update: { value: stringValue },
                create: { keyName: key, value: stringValue },
            });
        });
        await Promise.all(updates);
        this.eventEmitter.emit('settings.updated', dto);
        return { message: 'Settings updated successfully' };
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], SettingsService);
//# sourceMappingURL=settings.service.js.map