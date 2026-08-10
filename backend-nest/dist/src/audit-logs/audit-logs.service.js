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
exports.AuditLogsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditLogsService = class AuditLogsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(params) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    action: params.action,
                    userId: params.userId ?? null,
                    entityType: params.entityType ?? null,
                    entityId: params.entityId ?? null,
                    ipAddress: params.ipAddress ?? null,
                },
            });
        }
        catch {
        }
    }
    async getAllLogs(query) {
        const { page = 1, limit = 50 } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            avatar: true,
                        },
                    },
                },
            }),
            this.prisma.auditLog.count(),
        ]);
        const formattedLogs = logs.map((log) => ({
            ...log,
            id: log.id.toString(),
            userId: log.userId ? log.userId.toString() : null,
            entityId: log.entityId ? log.entityId.toString() : null,
            user: log.user
                ? {
                    ...log.user,
                    id: log.user.id.toString(),
                }
                : null,
        }));
        return {
            data: formattedLogs,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        };
    }
    async deleteLogs(ids) {
        const bigIntIds = ids.map((id) => BigInt(id));
        const { count } = await this.prisma.auditLog.deleteMany({
            where: { id: { in: bigIntIds } },
        });
        return { message: `${count} audit log(s) deleted successfully.`, count };
    }
};
exports.AuditLogsService = AuditLogsService;
exports.AuditLogsService = AuditLogsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditLogsService);
//# sourceMappingURL=audit-logs.service.js.map