import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    payment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    booking: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    bookingStatusLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (callback) => {
      // Simulate transaction behavior by calling the callback with mock Prisma
      return await callback(mockPrismaService);
    }),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'STRIPE_SECRET_KEY') return 'sk_test_mock';
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.createPayment({ bookingId: '1', method: 'cash' }, { id: '1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if booking belongs to someone else', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce({
        customerId: 2n,
      });

      await expect(
        service.createPayment({ bookingId: '1', method: 'cash' }, { id: '1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if payment already exists', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce({
        id: 1n,
        customerId: 1n,
        totalPrice: 100,
      });
      mockPrismaService.payment.findUnique.mockResolvedValueOnce({ id: 1n });

      await expect(
        service.createPayment({ bookingId: '1', method: 'cash' }, { id: '1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully create payment', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce({
        id: 1n,
        customerId: 1n,
        totalPrice: 100,
      });
      mockPrismaService.payment.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.payment.create.mockResolvedValueOnce({
        id: 1n,
        bookingId: 1n,
        userId: 1n,
        method: 'cash',
        amount: 100,
        status: 'pending',
      });

      const result = await service.createPayment(
        { bookingId: '1', method: 'cash' },
        { id: '1' },
      );
      expect(result.message).toBe('Payment initiated successfully');
      expect(result.payment.method).toBe('cash');
      expect(mockPrismaService.payment.create).toHaveBeenCalled();
    });
  });

  describe('completePayment', () => {
    it('should throw BadRequestException for card method', async () => {
      await expect(
        service.completePayment(
          { bookingId: '1', method: 'card' },
          { id: '1' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should complete cash payment correctly', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce({
        id: 1n,
        customerId: 1n,
        status: 'pending',
        totalPrice: 100,
        service: {},
        company: {},
      });
      mockPrismaService.payment.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.payment.create.mockResolvedValueOnce({
        id: 1n,
        bookingId: 1n,
        userId: 1n,
        method: 'cash',
        amount: 100,
        status: 'pending',
      });
      mockPrismaService.booking.update.mockResolvedValueOnce({
        id: 1n,
        status: 'confirmed',
      });

      const result = await service.completePayment(
        { bookingId: '1', method: 'cash' },
        { id: '1' },
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('cash');
      expect(result.payment.status).toBe('pending');
      expect(mockPrismaService.booking.update).toHaveBeenCalled();
    });
  });
});
