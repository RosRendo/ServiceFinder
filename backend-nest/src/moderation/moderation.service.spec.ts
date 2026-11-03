import { Test, TestingModule } from '@nestjs/testing';
import { ModerationService } from './moderation.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ModerationService', () => {
  let service: ModerationService;

  const mockPrismaService = {
    moderationLog: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ModerationService>(ModerationService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('applyAction', () => {
    it('should throw NotFoundException if log does not exist', async () => {
      mockPrismaService.moderationLog.findUnique.mockResolvedValueOnce(null);

      await expect(service.applyAction(1, 'ban')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should suspend the user and audit the action for ban on a user target', async () => {
      mockPrismaService.moderationLog.findUnique.mockResolvedValueOnce({
        id: 1n,
        entityType: 'user',
        entityId: 42n,
      });
      mockPrismaService.user.update.mockResolvedValueOnce({
        id: 42n,
        status: 'suspended',
      });
      mockPrismaService.moderationLog.update.mockResolvedValueOnce({
        id: 1n,
        status: 'resolved',
      });

      const result = await service.applyAction(1, 'ban');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 42n },
        data: { status: 'suspended' },
        select: { id: true, status: true },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.effect).toBe('user_suspended');
      expect(result.entitySuspended).toBe(true);
      expect(result.status).toBe('resolved');
    });

    it('should leave the entity untouched and report logged only when ban target is not a user', async () => {
      mockPrismaService.moderationLog.findUnique.mockResolvedValueOnce({
        id: 2n,
        entityType: 'review',
        entityId: 10n,
      });
      mockPrismaService.moderationLog.update.mockResolvedValueOnce({
        id: 2n,
        status: 'resolved',
      });

      const result = await service.applyAction(2, 'ban');

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
      expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
      expect(result.effect).toBe('logged_only');
      expect(result.entitySuspended).toBe(false);
    });

    it('should return logged only outcome for remove_content', async () => {
      mockPrismaService.moderationLog.findUnique.mockResolvedValueOnce({
        id: 3n,
        entityType: 'user',
        entityId: 7n,
      });
      mockPrismaService.moderationLog.update.mockResolvedValueOnce({
        id: 3n,
        status: 'resolved',
      });

      const result = await service.applyAction(3, 'remove_content');

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
      expect(result.effect).toBe('logged_only');
      expect(result.entitySuspended).toBe(false);
    });

    it('should dismiss the log for dismiss action', async () => {
      mockPrismaService.moderationLog.findUnique.mockResolvedValueOnce({
        id: 4n,
        entityType: 'user',
        entityId: 7n,
      });
      mockPrismaService.moderationLog.update.mockResolvedValueOnce({
        id: 4n,
        status: 'dismissed',
      });

      const result = await service.applyAction(4, 'dismiss');

      expect(result.status).toBe('dismissed');
      expect(result.effect).toBe('dismissed');
    });
  });
});
