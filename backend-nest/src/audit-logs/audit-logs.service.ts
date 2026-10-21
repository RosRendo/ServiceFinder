import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    action: string;
    userId?: bigint | null;
    entityType?: string;
    entityId?: bigint | null;
    ipAddress?: string;
  }) {
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
    } catch {
      // Audit log failures must never crash the main flow
    }
  }

  async getAllLogs(query: any) {
    const { page = 1, limit = 50, action, search } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    if (action && action !== 'all') {
      where.action = { contains: action, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Format BigInts for JSON serialization and provide compatibility fields for Web & Mobile
    const formattedLogs = logs.map((log) => {
      const actorName = log.user?.fullName || log.user?.email || 'System';
      const actorRole = log.user?.role || 'system';
      const targetType = log.entityType || 'system';
      const target = log.entityId
        ? `${targetType} #${log.entityId}`
        : targetType;

      let description = '';
      if (log.action === 'user_login') {
        description = `${actorName} logged in`;
      } else if (log.action === 'user_registered') {
        description = `New account registered: ${actorName}`;
      } else if (log.action === 'UPDATE_SETTINGS') {
        description = `${actorName} updated system configuration`;
      } else {
        description = `${actorName} performed ${log.action} on ${target}`;
      }

      return {
        id: log.id.toString(),
        userId: log.userId ? log.userId.toString() : null,
        action: log.action || 'system_event',
        entityType: log.entityType,
        entityId: log.entityId ? log.entityId.toString() : null,
        ipAddress: log.ipAddress || '127.0.0.1',
        createdAt: log.createdAt,
        user: log.user
          ? {
              ...log.user,
              id: log.user.id.toString(),
            }
          : null,
        // Dual-compatibility fields for Web DataGrid and Mobile cards
        actor: actorName,
        actorRole: actorRole,
        target: target,
        targetType: targetType,
        description: description,
      };
    });

    return {
      success: true,
      data: formattedLogs,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async deleteLogs(ids: string[]) {
    const bigIntIds = ids.map((id) => BigInt(id));
    const { count } = await this.prisma.auditLog.deleteMany({
      where: { id: { in: bigIntIds } },
    });
    return {
      success: true,
      message: `${count} audit log(s) deleted successfully.`,
      count,
    };
  }
}
