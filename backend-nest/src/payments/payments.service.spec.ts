import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
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
    transaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (callback) => {
      // Simulate transaction behavior by calling the callback with mock Prisma
      return await callback(mockPrismaService);
    }),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'WING_CLIENT_ID') return 'mock_wing_id';
      if (key === 'WING_CLIENT_SECRET') return 'mock_wing_secret';
      if (key === 'WING_BASE_URL') return 'https://wing.example.com';
      if (key === 'ABA_API_KEY') return 'mock_aba_key';
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      return null;
    }),
  };

  const originalFetch = (global as any).fetch;

  afterEach(() => {
    (global as any).fetch = originalFetch;
    jest.restoreAllMocks();
  });

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
    // Reset the config mock to its default implementation between tests.
    (mockConfigService.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'WING_CLIENT_ID') return 'mock_wing_id';
      if (key === 'WING_CLIENT_SECRET') return 'mock_wing_secret';
      if (key === 'WING_BASE_URL') return 'https://wing.example.com';
      if (key === 'ABA_API_KEY') return 'mock_aba_key';
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      return null;
    });
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

  describe('handleWingWebhook', () => {
    const pendingPayment = {
      id: 1n,
      bookingId: 1n,
      userId: 1n,
      amount: 50,
      status: 'pending',
      transactionRef: 'WK1T1',
    };

    function mockWingInquiry(data: any, ok = true, status = 200) {
      jest
        .spyOn(service as any, 'getWingAccessToken')
        .mockResolvedValue('mock_token');
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok,
        status,
        json: async () => data,
      });
    }

    function mockCreditPath() {
      mockPrismaService.payment.update.mockResolvedValueOnce({});
      mockPrismaService.booking.update.mockResolvedValueOnce({
        id: 1n,
        companyId: 1n,
        status: 'confirmed',
      });
      mockPrismaService.notification.create.mockResolvedValueOnce({});
      mockPrismaService.transaction.create.mockResolvedValueOnce({});
    }

    it('throws when order_reference_no is missing', async () => {
      await expect(
        service.handleWingWebhook({ amount: '50.00' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('REJECTS a forged webhook when Wing server-side inquiry does not confirm it', async () => {
      mockWingInquiry(null, false, 404);
      mockPrismaService.payment.findFirst.mockResolvedValueOnce(pendingPayment);

      await expect(
        service.handleWingWebhook({
          order_reference_no: 'WK1T1',
          amount: '50.00',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
      expect(mockPrismaService.transaction.create).not.toHaveBeenCalled();
    });

    it('rejects when the server-verified amount differs from the stored payment', async () => {
      mockWingInquiry({ data: { amount: '49.00', transaction_id: 'TXN-1' } });
      mockPrismaService.payment.findFirst.mockResolvedValueOnce(pendingPayment);

      await expect(
        service.handleWingWebhook({
          order_reference_no: 'WK1T1',
          amount: '49.00',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
    });

    it('is idempotent for already-paid payments', async () => {
      mockPrismaService.payment.findFirst.mockResolvedValueOnce({
        ...pendingPayment,
        status: 'paid',
      });

      const result = await service.handleWingWebhook({
        order_reference_no: 'WK1T1',
        amount: '50.00',
      });

      expect(result.code).toBe('200');
      expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
    });

    it('credits a payment only after Wing inquiry verifies amount + transaction', async () => {
      mockWingInquiry({ data: { amount: '50.00', transaction_id: 'TXN-1' } });
      mockPrismaService.payment.findFirst.mockResolvedValueOnce(pendingPayment);
      mockCreditPath();

      const result = await service.handleWingWebhook({
        order_reference_no: 'WK1T1',
        amount: '50.00',
        transaction_id: 'TXN-1',
      });

      expect(result.code).toBe('200');
      expect(mockPrismaService.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'paid' }),
        }),
      );
      expect(mockPrismaService.transaction.create).toHaveBeenCalled();
    });
  });

  describe('handleKhqrWebhook', () => {
    const pendingPayment = {
      id: 1n,
      bookingId: 1n,
      userId: 1n,
      amount: 50,
      status: 'pending',
    };

    function mockCreditPath() {
      mockPrismaService.payment.update.mockResolvedValueOnce({});
      mockPrismaService.booking.update.mockResolvedValueOnce({
        id: 1n,
        companyId: 1n,
        status: 'confirmed',
      });
      mockPrismaService.bookingStatusLog.create.mockResolvedValueOnce({});
      mockPrismaService.notification.create.mockResolvedValueOnce({});
      mockPrismaService.transaction.create.mockResolvedValueOnce({});
    }

    it('rejects a forged callback with a mismatched amount', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValueOnce(
        pendingPayment,
      );

      await expect(
        service.handleKhqrWebhook({ billNumber: 'BK-1', amount: '1.00' }, {}),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
      expect(mockPrismaService.transaction.create).not.toHaveBeenCalled();
    });

    it('rejects a callback with a missing amount', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValueOnce(
        pendingPayment,
      );

      await expect(
        service.handleKhqrWebhook({ billNumber: 'BK-1' }, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('requires the shared secret when KHQR_WEBHOOK_SECRET is configured', async () => {
      (mockConfigService.get as jest.Mock).mockImplementation((key: string) =>
        key === 'KHQR_WEBHOOK_SECRET' ? 'super-secret' : null,
      );

      await expect(
        service.handleKhqrWebhook({ billNumber: 'BK-1', amount: '50.00' }, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts the shared secret when present', async () => {
      (mockConfigService.get as jest.Mock).mockImplementation((key: string) =>
        key === 'KHQR_WEBHOOK_SECRET' ? 'super-secret' : null,
      );
      mockPrismaService.payment.findUnique.mockResolvedValueOnce(
        pendingPayment,
      );
      mockCreditPath();

      const result = await service.handleKhqrWebhook(
        { billNumber: 'BK-1', amount: '50.00' },
        { 'x-webhook-secret': 'super-secret' },
      );

      expect(result.status).toBe('success');
      expect(mockPrismaService.transaction.create).toHaveBeenCalled();
    });

    it('is idempotent for already-paid bookings', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValueOnce({
        id: 1n,
        status: 'paid',
      });

      const result = await service.handleKhqrWebhook(
        { billNumber: 'BK-1', amount: '50.00' },
        {},
      );

      expect(result.message).toBe('Already processed');
      expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
    });

    it('does not credit unknown bill numbers', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValueOnce(null);

      const result = await service.handleKhqrWebhook(
        { billNumber: 'BK-999', amount: '50.00' },
        {},
      );

      expect(result.message).toBe('Webhook received');
      expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
    });
  });

  describe('handleAbaWebhook', () => {
    it('fails closed when ABA_API_KEY is not configured', async () => {
      (mockConfigService.get as jest.Mock).mockImplementation(() => null);

      await expect(
        service.handleAbaWebhook({ tran_id: 'T1', status: '0', hash: 'x' }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('rejects an invalid signature', async () => {
      await expect(
        service.handleAbaWebhook({
          tran_id: 'T1',
          status: '0',
          hash: 'forged',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts a valid HMAC-SHA512 signature and marks the payment paid', async () => {
      const hash = crypto
        .createHmac('sha512', 'mock_aba_key')
        .update('T1' + '0')
        .digest('base64');

      mockPrismaService.payment.findFirst.mockResolvedValueOnce({
        id: 1n,
        bookingId: 1n,
        userId: 1n,
        amount: 50,
        status: 'pending',
      });
      mockPrismaService.payment.update.mockResolvedValueOnce({});
      mockPrismaService.booking.update.mockResolvedValueOnce({
        id: 1n,
        companyId: 1n,
        status: 'confirmed',
      });
      mockPrismaService.bookingStatusLog.create.mockResolvedValueOnce({});
      mockPrismaService.notification.create.mockResolvedValueOnce({});
      mockPrismaService.transaction.create.mockResolvedValueOnce({});

      const result = await service.handleAbaWebhook({
        tran_id: 'T1',
        status: '0',
        hash,
      });

      expect(result).toEqual({ received: true });
      expect(mockPrismaService.transaction.create).toHaveBeenCalled();
    });
  });
});
