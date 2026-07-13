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

    // Format BigInts for JSON serialization
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
}
