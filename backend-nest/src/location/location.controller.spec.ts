import { Test, TestingModule } from '@nestjs/testing';
import { LocationController } from './location.controller';
import { PrismaService } from '../prisma/prisma.service';
import { LocationGateway } from './location.gateway';
import { ForbiddenException } from '@nestjs/common';

describe('LocationController', () => {
  let controller: LocationController;
  let prisma: PrismaService;

  const mockLocationGateway = {
    server: {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    },
  };

  const mockPrismaService = {
    booking: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationController],
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LocationGateway, useValue: mockLocationGateway },
      ],
    }).compile();

    controller = module.get<LocationController>(LocationController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getLocation (Customer Privacy Visibility Test)', () => {
    const customerUser = { id: '1', role: 'customer' };
    const adminUser = { id: '99', role: 'admin' };
    
    const baseBooking = {
      customerId: 1n,
      assignedStaff: { userId: 10n },
      company: { ownerId: 5n },
      serviceAddress: '123 Main St',
      latitude: 14.5,
      longitude: 121.0,
      status: 'confirmed',
    };

    it('should NOT allow customer to see location when booking status is confirmed', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce({
        ...baseBooking,
        status: 'confirmed',
      });

      const result = await controller.getLocation('1', customerUser);

      expect(result.success).toBe(true);
      expect(result.data.staffLocation).toBeNull();
      expect(result.data.isOnline).toBe(false);
      expect(result.data.bookingStatus).toBe('confirmed');
    });

    it('should allow customer to see location when booking status is en_route', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce({
        ...baseBooking,
        status: 'en_route',
      });

      // Retrieve location details (mock location entry would go here, but even with null entry it shouldn't be blocked by visibility guard)
      const result = await controller.getLocation('1', customerUser);

      expect(result.success).toBe(true);
      expect(result.data.bookingStatus).toBe('en_route');
    });

    it('should allow customer to see location when booking status is arrived', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce({
        ...baseBooking,
        status: 'arrived',
      });

      const result = await controller.getLocation('1', customerUser);

      expect(result.success).toBe(true);
      expect(result.data.bookingStatus).toBe('arrived');
    });

    it('should allow customer to see location when booking status is in_progress', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce({
        ...baseBooking,
        status: 'in_progress',
      });

      const result = await controller.getLocation('1', customerUser);

      expect(result.success).toBe(true);
      expect(result.data.bookingStatus).toBe('in_progress');
    });

    it('should throw ForbiddenException if user is not authorized to access booking', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce(baseBooking);

      const unauthorizedUser = { id: '999', role: 'customer' };

      await expect(controller.getLocation('1', unauthorizedUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should always allow admin to view booking info', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce({
        ...baseBooking,
        status: 'confirmed',
      });

      const result = await controller.getLocation('1', adminUser);

      expect(result.success).toBe(true);
      expect(result.data.bookingStatus).toBe('confirmed');
    });
  });
});
