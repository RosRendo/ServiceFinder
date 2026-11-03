import { Injectable, NotFoundException } from '@nestjs/common';
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

  async flagItem(
    userId: bigint,
    dto: { entityType: string; entityId: string; reason: string },
  ) {
    const log = await this.prisma.moderationLog.create({
      data: {
        adminId: userId,
        entityType: dto.entityType,
        entityId: BigInt(dto.entityId),
        action: 'flagged',
        reason: dto.reason,
        status: 'pending',
      },
    });

    return {
      success: true,
      message: 'Item reported for moderation review',
      id: log.id.toString(),
    };
  }

  async applyAction(id: number, action: string) {
    const log = await this.prisma.moderationLog.findUnique({
      where: { id: BigInt(id) },
    });
    if (!log) throw new NotFoundException('Moderation log not found');

    if (action === 'dismiss') {
      const updated = await this.prisma.moderationLog.update({
        where: { id: log.id },
        data: { status: 'dismissed' },
      });
      return {
        success: true,
        id: updated.id.toString(),
        status: updated.status,
        effect: 'dismissed',
        entitySuspended: false,
      };
    }

    if (action === 'ban') {
      const isUserTarget = log.entityType === 'user';
      let entitySuspended = false;

      if (isUserTarget) {
        const suspended = await this.prisma.user.update({
          where: { id: BigInt(log.entityId) },
          data: { status: 'suspended' },
          select: { id: true, status: true },
        });
        entitySuspended = suspended.status === 'suspended';

        await this.prisma.auditLog.create({
          data: {
            action: 'STATUS_CHANGE_SUSPENDED - Moderation ban',
            entityType: 'User',
            entityId: BigInt(log.entityId),
          },
        });
      }

      const updated = await this.prisma.moderationLog.update({
        where: { id: log.id },
        data: { status: 'resolved' },
      });

      return {
        success: true,
        id: updated.id.toString(),
        status: updated.status,
        effect: entitySuspended ? 'user_suspended' : 'logged_only',
        entitySuspended,
        message: entitySuspended
          ? 'User has been suspended'
          : 'Ban logged only: target is not a user account',
      };
    }

    const updated = await this.prisma.moderationLog.update({
      where: { id: log.id },
      data: { status: 'resolved' },
    });
    return {
      success: true,
      id: updated.id.toString(),
      status: updated.status,
      effect: 'logged_only',
      entitySuspended: false,
      message: 'Content removal logged only: content deleted separately',
    };
  }
}
