import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceService } from './compliance.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ComplianceService', () => {
  let service: ComplianceService;

  const mockPrismaService = {
    complianceReport: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    company: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ComplianceService>(ComplianceService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getReports', () => {
    it('should remap the approved filter to the verified database status', async () => {
      mockPrismaService.complianceReport.findMany.mockResolvedValueOnce([]);

      await service.getReports('approved');

      expect(mockPrismaService.complianceReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'verified' },
          include: { company: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should remap the pending_review filter to the pending database status', async () => {
      mockPrismaService.complianceReport.findMany.mockResolvedValueOnce([]);

      await service.getReports('pending_review');

      expect(mockPrismaService.complianceReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'pending' },
        }),
      );
    });
  });
});
