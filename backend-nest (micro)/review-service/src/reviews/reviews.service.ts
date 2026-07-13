// @ts-nocheck
import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async getMyReviews(customerId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { customerId: BigInt(customerId) },
      include: {
        booking: { include: { service: true, company: true } },
        staff: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // BigInt to string conversion
    const formatted = reviews.map(r => ({
      ...r,
      id: r.id.toString(),
      bookingId: r.bookingId.toString(),
      customerId: r.customerId.toString(),
      staffId: r.staffId?.toString(),
      booking: {
        ...r.booking,
        id: r.booking.id.toString(),
        customerId: r.booking.customerId.toString(),
        companyId: r.booking.companyId.toString(),
        serviceId: r.booking.serviceId.toString(),
        assignedStaffId: r.booking.assignedStaffId?.toString(),
        company: {
          ...r.booking.company,
          id: r.booking.company.id.toString(),
          ownerId: r.booking.company.ownerId.toString(),
        },
        service: {
          ...r.booking.service,
          id: r.booking.service.id.toString(),
          companyId: r.booking.service.companyId.toString(),
          serviceTypeId: r.booking.service.serviceTypeId.toString(),
        }
      },
      staff: r.staff ? {
        ...r.staff,
        id: r.staff.id.toString(),
        userId: r.staff.userId.toString(),
        companyId: r.staff.companyId.toString(),
        user: {
          ...r.staff.user,
          id: r.staff.user.id.toString(),
        }
      } : null,
    }));

    return { reviews: formatted };
  }

  async getAllReviews(query: any) {
    const { companyId, customerId, staffId, page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (customerId) where.customerId = BigInt(customerId);
    if (staffId) where.staffId = BigInt(staffId);

    const bookingWhere: any = {};
    if (companyId) bookingWhere.companyId = BigInt(companyId);

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { ...where, booking: bookingWhere },
        skip: Number(skip),
        take: Number(limit),
        include: {
          customer: { select: { id: true, fullName: true, avatar: true } },
          booking: {
            select: {
              id: true, bookingDate: true,
              service: { select: { name: true } },
              company: { select: { id: true, name: true } },
            },
          },
          staff: { select: { id: true, user: { select: { fullName: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where: { ...where, booking: bookingWhere } }),
    ]);

    const formatted = reviews.map(r => ({
      ...r,
      id: r.id.toString(),
      bookingId: r.bookingId.toString(),
      customerId: r.customerId.toString(),
      staffId: r.staffId?.toString(),
      customer: {
        ...r.customer,
        id: r.customer.id.toString(),
      },
      booking: {
        ...r.booking,
        id: r.booking.id.toString(),
        company: {
          ...r.booking.company,
          id: r.booking.company.id.toString(),
        }
      },
      staff: r.staff ? {
        ...r.staff,
        id: r.staff.id.toString(),
      } : null,
    }));

    return {
      reviews: formatted,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getReviewById(id: bigint) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, fullName: true, email: true, avatar: true } },
        booking: { include: { service: true, company: true } },
        staff: { include: { user: true } },
      },
    });

    if (!review) throw new NotFoundException('Review not found');

    return {
      review: {
        ...review,
        id: review.id.toString(),
        bookingId: review.bookingId.toString(),
        customerId: review.customerId.toString(),
        staffId: review.staffId?.toString(),
        customer: {
          ...review.customer,
          id: review.customer.id.toString(),
        },
        booking: {
          ...review.booking,
          id: review.booking.id.toString(),
          customerId: review.booking.customerId.toString(),
          companyId: review.booking.companyId.toString(),
          serviceId: review.booking.serviceId.toString(),
          assignedStaffId: review.booking.assignedStaffId?.toString(),
          company: {
            ...review.booking.company,
            id: review.booking.company.id.toString(),
            ownerId: review.booking.company.ownerId.toString(),
          },
          service: {
            ...review.booking.service,
            id: review.booking.service.id.toString(),
            companyId: review.booking.service.companyId.toString(),
            serviceTypeId: review.booking.service.serviceTypeId.toString(),
          }
        },
        staff: review.staff ? {
          ...review.staff,
          id: review.staff.id.toString(),
          userId: review.staff.userId.toString(),
          companyId: review.staff.companyId.toString(),
          user: {
            ...review.staff.user,
            id: review.staff.user.id.toString(),
          }
        } : null,
      }
    };
  }

  async createReview(dto: CreateReviewDto, user: any) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: BigInt(dto.bookingId) },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== BigInt(user.id)) throw new ForbiddenException('Access denied');
    if (booking.status !== 'completed') throw new BadRequestException('Can only review completed bookings');

    const existingReview = await this.prisma.review.findUnique({
      where: { bookingId: BigInt(dto.bookingId) },
    });

    if (existingReview) throw new ConflictException('Review already exists for this booking');

    const review = await this.prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          bookingId: BigInt(dto.bookingId),
          customerId: BigInt(user.id),
          companyRating: dto.companyRating,
          companyComment: dto.companyComment,
          staffId: booking.assignedStaffId,
          staffRating: dto.staffRating || null,
          staffComment: dto.staffComment || null,
        },
        include: {
          booking: { include: { service: true, company: true } },
          staff: { include: { user: true } },
        },
      });

      await this.updateCompanyRating(booking.companyId, tx);
      if (booking.assignedStaffId && dto.staffRating) {
        await this.updateStaffRating(booking.assignedStaffId, tx);
      }

      return newReview;
    });

    return {
      success: true,
      message: 'Review created successfully',
      review: {
        ...review,
        id: review.id.toString(),
        bookingId: review.bookingId.toString(),
        customerId: review.customerId.toString(),
        staffId: review.staffId?.toString(),
        booking: {
          ...review.booking,
          id: review.booking.id.toString(),
          customerId: review.booking.customerId.toString(),
          companyId: review.booking.companyId.toString(),
          serviceId: review.booking.serviceId.toString(),
          assignedStaffId: review.booking.assignedStaffId?.toString(),
          company: {
            ...review.booking.company,
            id: review.booking.company.id.toString(),
            ownerId: review.booking.company.ownerId.toString(),
          },
          service: {
            ...review.booking.service,
            id: review.booking.service.id.toString(),
            companyId: review.booking.service.companyId.toString(),
            serviceTypeId: review.booking.service.serviceTypeId.toString(),
          }
        },
        staff: review.staff ? {
          ...review.staff,
          id: review.staff.id.toString(),
          userId: review.staff.userId.toString(),
          companyId: review.staff.companyId.toString(),
          user: {
            ...review.staff.user,
            id: review.staff.user.id.toString(),
          }
        } : null,
      },
    };
  }

  async updateReview(id: bigint, dto: UpdateReviewDto, user: any) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.customerId !== BigInt(user.id)) throw new ForbiddenException('Access denied');

    const updatedReview = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id },
        data: dto,
        include: {
          booking: { include: { service: true, company: true } },
          staff: { include: { user: true } },
        },
      });

      await this.updateCompanyRating(review.booking.companyId, tx);
      if (review.staffId) {
        await this.updateStaffRating(review.staffId, tx);
      }

      return updated;
    });

    return {
      success: true,
      message: 'Review updated successfully',
      review: {
        ...updatedReview,
        id: updatedReview.id.toString(),
        bookingId: updatedReview.bookingId.toString(),
        customerId: updatedReview.customerId.toString(),
        staffId: updatedReview.staffId?.toString(),
        booking: {
          ...updatedReview.booking,
          id: updatedReview.booking.id.toString(),
          customerId: updatedReview.booking.customerId.toString(),
          companyId: updatedReview.booking.companyId.toString(),
          serviceId: updatedReview.booking.serviceId.toString(),
          assignedStaffId: updatedReview.booking.assignedStaffId?.toString(),
          company: {
            ...updatedReview.booking.company,
            id: updatedReview.booking.company.id.toString(),
            ownerId: updatedReview.booking.company.ownerId.toString(),
          },
          service: {
            ...updatedReview.booking.service,
            id: updatedReview.booking.service.id.toString(),
            companyId: updatedReview.booking.service.companyId.toString(),
            serviceTypeId: updatedReview.booking.service.serviceTypeId.toString(),
          }
        },
        staff: updatedReview.staff ? {
          ...updatedReview.staff,
          id: updatedReview.staff.id.toString(),
          userId: updatedReview.staff.userId.toString(),
          companyId: updatedReview.staff.companyId.toString(),
          user: {
            ...updatedReview.staff.user,
            id: updatedReview.staff.user.id.toString(),
          }
        } : null,
      },
    };
  }

  async deleteReview(id: bigint, user: any) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.customerId !== BigInt(user.id) && user.role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.review.delete({ where: { id } });
    await this.updateCompanyRating(review.booking.companyId);
    if (review.staffId) {
      await this.updateStaffRating(review.staffId);
    }

    return { success: true, message: 'Review deleted successfully' };
  }

  async getCompanyReviews(companyId: string, page = 1, limit = 10) {
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { booking: { companyId: BigInt(companyId) } },
        include: {
          customer: { select: { id: true, fullName: true, avatar: true } },
          booking: {
            select: {
              id: true, bookingDate: true,
              service: { select: { id: true, name: true } },
            },
          },
          staff: { select: { id: true, user: { select: { fullName: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(limit),
      }),
      this.prisma.review.count({ where: { booking: { companyId: BigInt(companyId) } } }),
    ]);

    const formatted = reviews.map(r => ({
      ...r,
      id: r.id.toString(),
      bookingId: r.bookingId.toString(),
      customerId: r.customerId.toString(),
      staffId: r.staffId?.toString(),
      customer: {
        ...r.customer,
        id: r.customer.id.toString(),
      },
      booking: {
        ...r.booking,
        id: r.booking.id.toString(),
        service: {
          ...r.booking.service,
          id: r.booking.service.id.toString(),
        }
      },
      staff: r.staff ? {
        ...r.staff,
        id: r.staff.id.toString(),
      } : null,
    }));

    return {
      reviews: formatted,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getStaffReviews(staffId: string, page = 1, limit = 10) {
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { staffId: BigInt(staffId), staffRating: { not: null } },
        include: {
          customer: { select: { id: true, fullName: true, avatar: true } },
          booking: {
            select: {
              id: true, bookingDate: true,
              service: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(limit),
      }),
      this.prisma.review.count({ where: { staffId: BigInt(staffId), staffRating: { not: null } } }),
    ]);

    const staffRatingSummary = await this.updateStaffRating(BigInt(staffId));

    const formatted = reviews.map(r => ({
      ...r,
      id: r.id.toString(),
      bookingId: r.bookingId.toString(),
      customerId: r.customerId.toString(),
      staffId: r.staffId?.toString(),
      customer: {
        ...r.customer,
        id: r.customer.id.toString(),
      },
      booking: {
        ...r.booking,
        id: r.booking.id.toString(),
        service: {
          ...r.booking.service,
          id: r.booking.service.id.toString(),
        }
      },
    }));

    return {
      reviews: formatted,
      ratingSummary: staffRatingSummary,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  private async updateCompanyRating(companyId: bigint, transaction: any = this.prisma) {
    const reviews = await transaction.review.findMany({
      where: { booking: { companyId } },
      select: { companyRating: true },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.companyRating, 0) / totalReviews
      : null;

    await transaction.companyRatingSummary.upsert({
      where: { companyId },
      create: {
        companyId,
        averageRating,
        totalReviews,
        lastUpdated: new Date(),
      },
      update: {
        averageRating,
        totalReviews,
        lastUpdated: new Date(),
      },
    });
  }

  private async updateStaffRating(staffId: bigint, transaction: any = this.prisma) {
    const reviews = await transaction.review.findMany({
      where: { staffId, staffRating: { not: null } },
      select: { staffRating: true },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + (r.staffRating || 0), 0) / totalReviews
      : null;

    return { averageRating, totalReviews };
  }
}

