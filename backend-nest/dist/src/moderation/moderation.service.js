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
exports.ModerationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ModerationService = class ModerationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLogs(status) {
        const where = {};
        if (status && status !== 'all')
            where.status = status;
        const logs = await this.prisma.moderationLog.findMany({
            where,
            include: { admin: { select: { fullName: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return {
            success: true,
            data: logs.map((log) => ({
                id: log.id.toString(),
                type: (log.entityType === 'review' ? 'review' : log.entityType === 'user' ? 'profile' : 'other'),
                reportedBy: { id: log.adminId.toString(), name: log.admin.fullName },
                targetId: log.entityId.toString(),
                targetName: `${log.entityType.charAt(0).toUpperCase() + log.entityType.slice(1)} #${log.entityId}`,
                reason: log.reason,
                details: `Action: ${log.action} on ${log.entityType} #${log.entityId}`,
                status: log.status,
                createdAt: log.createdAt.toISOString(),
            })),
        };
    }
    async applyAction(id, action) {
        const newStatus = action === 'resolve' ? 'resolved' : action === 'dismiss' ? 'dismissed' : 'resolved';
        const updated = await this.prisma.moderationLog.update({
            where: { id: BigInt(id) },
            data: { status: newStatus },
        });
        return { success: true, id: updated.id.toString(), status: updated.status };
    }
};
exports.ModerationService = ModerationService;
exports.ModerationService = ModerationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ModerationService);
//# sourceMappingURL=moderation.service.js.map