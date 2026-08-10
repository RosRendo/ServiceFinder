import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComplianceService {
  constructor(private prisma: PrismaService) {}

  async getReports(status?: string) {
    const where: any = {};
    if (status && status !== 'all') {
      const dbStatus = status === 'pending_review' ? 'pending' : status;
      where.status = dbStatus;
    }

    const reports = await this.prisma.complianceReport.findMany({
      where,
      include: { company: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // success: true prevents TransformInterceptor double-wrapping
    return {
      success: true,
      data: reports.map((r) => ({
        id: r.id.toString(),
        companyId: r.companyId.toString(),
        companyName: r.company.name,
        documentType:
          r.type === 'business_license'
            ? 'license'
            : r.type === 'background_check'
              ? 'background_check'
              : r.type === 'insurance'
                ? 'insurance'
                : 'id_verification',
        documentUrl: r.documentUrl ?? '',
        status:
          r.status === 'pending'
            ? 'pending_review'
            : r.status === 'verified'
              ? 'approved'
              : r.status,
        submittedAt: r.createdAt.toISOString(),
        notes: r.notes ?? '',
      })),
    };
  }

  async updateStatus(id: number, status: string) {
    const dbStatus =
      status === 'approved'
        ? 'verified'
        : status === 'pending_review'
          ? 'pending'
          : status;
    const updated = await this.prisma.complianceReport.update({
      where: { id: BigInt(id) },
      data: { status: dbStatus, reviewedAt: new Date() },
    });
    return { success: true, id: updated.id.toString(), status: updated.status };
  }
}
