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
exports.ComplianceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ComplianceService = class ComplianceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getReports(status) {
        const where = {};
        if (status && status !== 'all') {
            const dbStatus = status === 'pending_review' ? 'pending' : status;
            where.status = dbStatus;
        }
        const reports = await this.prisma.complianceReport.findMany({
            where,
            include: { company: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return {
            success: true,
            data: reports.map((r) => ({
                id: r.id.toString(),
                companyId: r.companyId.toString(),
                companyName: r.company.name,
                documentType: (r.type === 'business_license' ? 'license' :
                    r.type === 'background_check' ? 'background_check' :
                        r.type === 'insurance' ? 'insurance' : 'id_verification'),
                documentUrl: r.documentUrl ?? '',
                status: r.status === 'pending' ? 'pending_review' : r.status === 'verified' ? 'approved' : r.status,
                submittedAt: r.createdAt.toISOString(),
                notes: r.notes ?? '',
            })),
        };
    }
    async updateStatus(id, status) {
        const dbStatus = status === 'approved' ? 'verified' : status === 'pending_review' ? 'pending' : status;
        const updated = await this.prisma.complianceReport.update({
            where: { id: BigInt(id) },
            data: { status: dbStatus, reviewedAt: new Date() },
        });
        return { success: true, id: updated.id.toString(), status: updated.status };
    }
};
exports.ComplianceService = ComplianceService;
exports.ComplianceService = ComplianceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ComplianceService);
//# sourceMappingURL=compliance.service.js.map