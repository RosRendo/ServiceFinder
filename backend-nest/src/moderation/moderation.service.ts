import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  async getLogs(status?: string) {
    const where: any = {};
    if (status && status !== 'all') where.status = status;

    const logs = await this.prisma.moderationLog.findMany({
      where,
      include: { admin: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // success: true prevents TransformInterceptor double-wrapping
    return {
      success: true,
      data: logs.map((log) => ({
        id: log.id.toString(),
        type:
          log.entityType === 'review'
            ? 'review'
            : log.entityType === 'user'
              ? 'profile'
              : 'other',
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

  async applyAction(id: number, action: string) {
    const newStatus =
      action === 'resolve'
        ? 'resolved'
        : action === 'dismiss'
          ? 'dismissed'
          : 'resolved';
    const updated = await this.prisma.moderationLog.update({
      where: { id: BigInt(id) },
      data: { status: newStatus },
    });
    return { success: true, id: updated.id.toString(), status: updated.status };
  }
}
