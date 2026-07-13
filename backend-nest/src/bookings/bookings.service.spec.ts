import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsGateway } from './bookings.gateway';
import { AdminGateway } from '../admin/admin.gateway';
import { SettingsService } from '../settings/settings.service';
import { AnalyticsService } from '../analytics/analytics.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('BookingsService', () => {
  let service: BookingsService;

  const mockPrismaService = {
    booking: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
    },
    bookingStatusLog: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    company: {
      findFirst: jest.fn(),
    },
  };

  const mockBookingsGateway = {
    emitToUser: jest.fn(),
    emitBookingUpdate: jest.fn(),
  };

  const mockAdminGateway = {
    broadcastKpiUpdate: jest.fn(),
  };

  const mockUser = { id: '1', role: 'customer', email: 'test@test.com' };
  const mockAdminUser = { id: '99', role: 'admin', email: 'admin@test.com' };
  const mockCompanyAdmin = {
    id: '5',
    role: 'company_admin',
    email: 'biz@test.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: BookingsGateway, useValue: mockBookingsGateway },
        { provide: AdminGateway, useValue: mockAdminGateway },
        {
          provide: SettingsService,
          useValue: {
            getSettingNumber: jest.fn().mockResolvedValue(10),
          },
        },
        { provide: AnalyticsService, useValue: { captureEvent: jest.fn() } },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    jest.clearAllMocks();
  });

  // ─── createBooking ────────────────────────────────────────────────────────

  describe('createBooking', () => {
    const dto = {
      serviceId: '10',
      companyId: '20',
      bookingDate: '2025-06-01',
      startTime: '09:00',
      serviceAddress: '123 Main St',
      latitude: 14.5,
      longitude: 121.0,
    };

    it('should throw NotFoundException when service does not exist', async () => {
      mockPrismaService.service.findUnique.mockResolvedValueOnce(null);

      await expect(service.createBooking(dto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when service is inactive', async () => {
      mockPrismaService.service.findUnique.mockResolvedValueOnce({
        id: 10n,
        isActive: false,
        durationMin: 60,
        basePrice: 500,
        name: 'Haircut',
      });

      await expect(service.createBooking(dto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create booking, status log, and notification successfully', async () => {
      mockPrismaService.service.findUnique.mockResolvedValueOnce({
        id: 10n,
        isActive: true,
        durationMin: 60,
        basePrice: 500,
        name: 'Haircut',
      });

      const mockBooking = {
        id: 100n,
        customerId: 1n,
        companyId: 20n,
        serviceId: 10n,
        bookingDate: new Date('2025-06-01'),
        startTime: new Date('2025-06-01T09:00:00Z'),
        endTime: new Date('2025-06-01T10:00:00Z'),
        serviceAddress: '123 Main St',
        totalPrice: 550,
        platformFee: 50,
        companyEarnings: 450,
        status: 'pending',
        customer: {
          id: 1n,
          fullName: 'Test User',
          email: 'test@test.com',
          phone: null,
        },
        company: { id: 20n, name: 'Best Co', ownerId: 5n },
        service: {
          id: 10n,
          name: 'Haircut',
          basePrice: 500,
          durationMin: 60,
          companyId: 20n,
          serviceTypeId: 7n,
        },
      };

      mockPrismaService.booking.create.mockResolvedValueOnce(mockBooking);
      mockPrismaService.bookingStatusLog.create.mockResolvedValueOnce({});
      mockPrismaService.notification.create.mockResolvedValueOnce({});

      const result = await service.createBooking(dto, mockUser);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('100');
      expect(result.data.totalPrice).toBe(550);
      expect(mockPrismaService.bookingStatusLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ newStatus: 'pending' }),
        }),
      );
      expect(mockPrismaService.notification.create).toHaveBeenCalled();
    });
  });

  // ─── getBookingById ───────────────────────────────────────────────────────

  describe('getBookingById', () => {
    const baseBooking = {
      id: 1n,
      customerId: 1n,
      companyId: 2n,
      serviceId: 3n,
      assignedStaffId: null,
      bookingDate: new Date(),
      startTime: new Date(),
      endTime: new Date(),
      serviceAddress: 'Somewhere',
      totalPrice: 550,
      platformFee: 50,
      companyEarnings: 450,
      status: 'pending',
      customer: {
        id: 1n,
        fullName: 'Test User',
        email: 'test@test.com',
        phone: null,
      },
      company: {
        id: 2n,
        name: 'Best Co',
        phone: null,
        email: 'co@co.com',
        address: null,
        ownerId: 5n,
      },
      service: {
        id: 3n,
        name: 'Haircut',
        basePrice: 500,
        durationMin: 60,
        serviceType: { category: { name: 'Beauty' }, name: 'Hair' },
        companyId: 2n,
        serviceTypeId: 7n,
        isActive: true,
      },
      assignedStaff: null,
      payment: null,
      review: null,
      cancellation: null,
      statusLogs: [],
    };

    it('should throw NotFoundException when booking does not exist', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce(null);

      await expect(service.getBookingById(999n, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when customer accesses another customer booking', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce({
        ...baseBooking,
        customerId: 99n, // different customer
      });

      await expect(service.getBookingById(1n, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return booking for the owning customer', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce(baseBooking);

      const result = await service.getBookingById(1n, mockUser);

      expect(result.booking).toBeDefined();
      expect(result.booking.id).toBe('1');
    });

    it('should allow admin to access any booking', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce({
        ...baseBooking,
        customerId: 99n, // different customer
      });

      const result = await service.getBookingById(1n, mockAdminUser);
      expect(result.booking).toBeDefined();
    });
  });

  // ─── getAllBookings ────────────────────────────────────────────────────────

  describe('getAllBookings', () => {
    it('should restrict customer to their own bookings', async () => {
      mockPrismaService.booking.findMany.mockResolvedValueOnce([]);
      mockPrismaService.booking.count.mockResolvedValueOnce(0);

      await service.getAllBookings({}, mockUser);

      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 1n }),
        }),
      );
    });

    it('should throw ForbiddenException for company_admin without company', async () => {
      mockPrismaService.company.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.getAllBookings({}, mockCompanyAdmin),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return paginated results for admin', async () => {
      const mockBookingList = [
        {
          id: 1n,
          customerId: 1n,
          companyId: 2n,
          serviceId: 3n,
          assignedStaffId: null,
          bookingDate: new Date(),
          startTime: new Date(),
          endTime: new Date(),
          serviceAddress: 'Addr',
          totalPrice: 550,
          platformFee: 50,
          companyEarnings: 450,
          status: 'pending',
          customer: { id: 1n, fullName: 'A', email: 'a@a.com', phone: null },
          company: { id: 2n, name: 'Co', phone: null, email: 'co@co.com' },
          service: { id: 3n, name: 'S', basePrice: 500, durationMin: 60 },
          assignedStaff: null,
          payment: null,
          review: null,
        },
      ];

      mockPrismaService.booking.findMany.mockResolvedValueOnce(mockBookingList);
      mockPrismaService.booking.count.mockResolvedValueOnce(1);

      const result = await service.getAllBookings(
        { page: 1, limit: 10 },
        mockAdminUser,
      );

      expect(result.pagination.total).toBe(1);
      expect(result.bookings).toHaveLength(1);
      expect(result.bookings[0].id).toBe('1');
    });
  });
});
