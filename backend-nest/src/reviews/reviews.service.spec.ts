import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

describe('ReviewsService', () => {
  let service: ReviewsService;

  const mockPrismaService = {
    review: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    booking: {
      findUnique: jest.fn(),
    },
    companyRatingSummary: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  const mockUser = { id: '1', role: 'customer' };
  const mockAdminUser = { id: '99', role: 'admin' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    const dto = {
      bookingId: '100',
      companyRating: 5,
      companyComment: 'Amazing service!',
      staffRating: 4,
      staffComment: 'Great staff member.',
    };

    it('should throw NotFoundException if booking does not exist', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce(null);

      await expect(service.createReview(dto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if customerId does not match booking customerId', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce({
        id: 100n,
        customerId: 99n, // Different customer
      });

      await expect(service.createReview(dto, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if booking is not completed', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce({
        id: 100n,
        customerId: 1n,
        status: 'pending',
      });

      await expect(service.createReview(dto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if review already exists for this booking', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce({
        id: 100n,
        customerId: 1n,
        status: 'completed',
      });
      mockPrismaService.review.findUnique.mockResolvedValueOnce({
        id: 5n,
      });

      await expect(service.createReview(dto, mockUser)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should successfully create a review, and update company and staff ratings', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValueOnce({
        id: 100n,
        customerId: 1n,
        status: 'completed',
        assignedStaffId: 2n,
        companyId: 3n,
      });
      mockPrismaService.review.findUnique.mockResolvedValueOnce(null);

      const mockReview = {
        id: 50n,
        bookingId: 100n,
        customerId: 1n,
        companyRating: 5,
        companyComment: 'Amazing service!',
        staffId: 2n,
        staffRating: 4,
        staffComment: 'Great staff member.',
        booking: {
          id: 100n,
          customerId: 1n,
          companyId: 3n,
          serviceId: 4n,
          assignedStaffId: 2n,
          company: { id: 3n, ownerId: 12n },
          service: { id: 4n, companyId: 3n, serviceTypeId: 8n },
        },
        staff: {
          id: 2n,
          userId: 22n,
          companyId: 3n,
          user: { id: 22n },
        },
      };

      mockPrismaService.review.create.mockResolvedValueOnce(mockReview);
      mockPrismaService.review.findMany.mockResolvedValue([]); // For the updateCompanyRating and updateStaffRating calls
      mockPrismaService.companyRatingSummary.upsert.mockResolvedValueOnce({});

      const result = await service.createReview(dto, mockUser);

      expect(result.success).toBe(true);
      expect(result.review.id).toBe('50');
      expect(mockPrismaService.review.create).toHaveBeenCalled();
    });
  });

  describe('deleteReview', () => {
    it('should throw NotFoundException if review not found', async () => {
      mockPrismaService.review.findUnique.mockResolvedValueOnce(null);

      await expect(service.deleteReview(999n, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if customer is not the reviewer and is not admin', async () => {
      mockPrismaService.review.findUnique.mockResolvedValueOnce({
        id: 5n,
        customerId: 88n, // Different customer
        booking: { companyId: 3n },
      });

      await expect(service.deleteReview(5n, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should delete successfully for the owning customer and update ratings', async () => {
      mockPrismaService.review.findUnique.mockResolvedValueOnce({
        id: 5n,
        customerId: 1n,
        staffId: 2n,
        booking: { companyId: 3n },
      });
      mockPrismaService.review.findMany.mockResolvedValue([]);

      const result = await service.deleteReview(5n, mockUser);

      expect(result.success).toBe(true);
      expect(mockPrismaService.review.delete).toHaveBeenCalledWith({
        where: { id: 5n },
      });
    });

    it('should allow admin to delete any review', async () => {
      mockPrismaService.review.findUnique.mockResolvedValueOnce({
        id: 5n,
        customerId: 88n, // Different customer
        staffId: null,
        booking: { companyId: 3n },
      });
      mockPrismaService.review.findMany.mockResolvedValue([]);

      const result = await service.deleteReview(5n, mockAdminUser);

      expect(result.success).toBe(true);
    });
  });
});
