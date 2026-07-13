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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const posthog_node_1 = require("posthog-node");
const config_1 = require("@nestjs/config");
let AnalyticsService = class AnalyticsService {
    configService;
    posthog = null;
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        const apiKey = this.configService.get('POSTHOG_API_KEY');
        const host = this.configService.get('POSTHOG_HOST') ||
            'https://us.i.posthog.com';
        if (apiKey) {
            this.posthog = new posthog_node_1.PostHog(apiKey, { host });
        }
    }
    async onModuleDestroy() {
        if (this.posthog) {
            await this.posthog.shutdown();
        }
    }
    captureEvent(distinctId, event, properties) {
        if (this.posthog) {
            this.posthog.capture({
                distinctId,
                event,
                properties,
            });
        }
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map