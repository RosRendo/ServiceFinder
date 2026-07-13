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
exports.HealthController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const terminus_1 = require("@nestjs/terminus");
const prisma_health_1 = require("./prisma.health");
let HealthController = class HealthController {
    health;
    http;
    memory;
    disk;
    prismaHealth;
    constructor(health, http, memory, disk, prismaHealth) {
        this.health = health;
        this.http = http;
        this.memory = memory;
        this.disk = disk;
        this.prismaHealth = prismaHealth;
    }
    check() {
        return this.health.check([
            () => this.prismaHealth.isHealthy('database'),
            () => this.memory.checkRSS('memory_rss', 512 * 1024 * 1024),
            () => this.memory.checkHeap('memory_heap', 256 * 1024 * 1024),
            () => this.disk.checkStorage('disk', {
                thresholdPercent: 0.9,
                path: process.platform === 'win32' ? 'C:\\' : '/',
            }),
        ]);
    }
    ping() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, terminus_1.HealthCheck)(),
    (0, swagger_1.ApiOperation)({ summary: 'Full health check (DB, memory, disk)' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('ping'),
    (0, swagger_1.ApiOperation)({ summary: 'Simple ping check (no DB)' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "ping", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('Health'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        terminus_1.HttpHealthIndicator,
        terminus_1.MemoryHealthIndicator,
        terminus_1.DiskHealthIndicator,
        prisma_health_1.PrismaHealthIndicator])
], HealthController);
//# sourceMappingURL=health.controller.js.map