// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { validateTransition } from '../common/status-transitions.util';

const PLATFORM_FEE_PERCENT = 10;

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async getAllBookings(query: any, user: any) {
    const { customerId, companyId, status, staffId, page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (user.role === 'customer') {
      where.customerId = BigInt(user.id);
    } else if (customerId) {
      where.customerId = BigInt(customerId);
    }

    if (companyId) where.companyId = BigInt(companyId);

    if (status) {
      where.status = status.includes(',') ? { in: status.split(',') } : status;
    }

    if (staffId) where.assignedStaffId = BigInt(staffId);

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        include: {
          customer: { select: { id: true, fullName: true, email: true, phone: true } },
          company: { select: { id: true, name: true, phone: true, email: true } },
          service: { select: { id: true, name: true, basePrice: true, durationMin: true } },
          assignedStaff: { include: { user: { select: { id: true, fullName: true, phone: true } } } },
          payment: true,
          review: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      bookings: bookings.map(b => this.serializeBooking(b)),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getBookingById(id: bigint, user: any) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true } },
        company: { select: { id: true, name: true, phone: true, email: true, address: true, ownerId: true } },
        service: { include: { serviceType: { include: { category: true } } } },
        assignedStaff: { include: { user: { select: { id: true, fullName: true, phone: true, email: true } } } },
        payment: true,
        review: true,
        cancellation: true,
        statusLogs: { orderBy: { changedAt: 'desc' } },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (user.role === 'customer' && booking.customerId !== BigInt(user.id)) {
      throw new ForbiddenException('Access denied');
    }

    return { booking: this.serializeBooking(booking) };
  }

  async createBooking(dto: CreateBookingDto, user: any) {
    const service = await this.prisma.service.findUnique({
      where: { id: BigInt(dto.serviceId) },
    });

    if (!service) throw new NotFoundException('Service not found');
    if (!service.isActive) throw new BadRequestException('Service is not available');

    const start = new Date(`${dto.bookingDate}T${dto.startTime}:00Z`);
    const end = new Date(start.getTime() + service.durationMin * 60000);

    const basePrice = Number(service.basePrice);
    const platformFee = Number(((basePrice * PLATFORM_FEE_PERCENT) / 100).toFixed(2));
    const companyEarnings = Number((basePrice - platformFee).toFixed(2));
    const totalPrice = Number((basePrice + platformFee).toFixed(2));

    const booking = await this.prisma.booking.create({
      data: {
        customerId: BigInt(user.id),
        companyId: BigInt(dto.companyId),
        serviceId: BigInt(dto.serviceId),
        bookingDate: new Date(dto.bookingDate),
        startTime: start,
        endTime: end,
        serviceAddress: dto.serviceAddress || '',
        latitude: dto.latitude,
        longitude: dto.longitude,
        totalPrice,
        platformFee,
        companyEarnings,
        status: 'pending' as any,
      },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true } },
        company: { select: { id: true, name: true, ownerId: true } },
        service: true,
      },
    }) as any;

    // Status log
    await this.prisma.bookingStatusLog.create({
      data: {
        bookingId: booking.id,
        newStatus: 'pending',
        changedBy: BigInt(user.id),
      },
    });

    // Notify company owner
    if (booking.company?.ownerId) {
      await this.prisma.notification.create({
        data: {
          userId: booking.company.ownerId,
          title: 'New Booking Received',
          body: `You have a new booking from ${booking.customer.fullName} for ${booking.service.name}.`,
          type: 'info',
          isRead: false,
        },
      });
    }

    return {
      success: true,
      message: 'Booking created successfully',
      data: {
        id: booking.id.toString(),
        customerId: booking.customerId.toString(),
        companyId: booking.companyId.toString(),
        serviceId: booking.serviceId.toString(),
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        serviceAddress: booking.serviceAddress,
        latitude: booking.latitude,
        longitude: booking.longitude,
        basePrice,
        totalPrice: Number(booking.totalPrice),
        platformFee: Number(booking.platformFee),
        companyEarnings: Number(booking.companyEarnings),
        status: booking.status,
        customer: {
          ...booking.customer,
          id: booking.customer.id.toString(),
        },
        company: {
          ...booking.company,
          id: booking.company.id.toString(),
          ownerId: booking.company.ownerId.toString(),
        },
        service: {
          ...booking.service,
          id: booking.service.id.toString(),
          companyId: booking.service.companyId.toString(),
          serviceTypeId: booking.service.serviceTypeId.toString(),
        },
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
    };
  }

  async updateBookingStatus(id: bigint, status: string, user: any) {
    const booking = await this.findOrFail(id);
    validateTransition(booking.status, status);

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.booking.update({
        where: { id },
        data: { status: status as any },
        include: { customer: true, company: true, service: true },
      });
      await tx.bookingStatusLog.create({
        data: {
          bookingId: id,
          oldStatus: booking.status,
          newStatus: status,
          changedBy: BigInt(user.id),
        },
      });
      return u;
    });

    // Notify customer
    if (updated.customerId) {
      await this.prisma.notification.create({
        data: {
          userId: updated.customerId,
          title: 'Booking Status Updated',
          body: `Your booking #${id} status is now: ${status.replace('_', ' ')}`,
          type: 'info',
          isRead: false,
        },
      });
    }

    return {
      message: 'Booking status updated successfully',
      booking: this.serializeBooking(updated),
    };
  }

  async assignStaff(id: bigint, staffId: string, user: any) {
    const booking = await this.findOrFail(id, true);

    if (booking.status !== 'confirmed') {
      throw new BadRequestException('Can only assign staff to confirmed bookings');
    }

    const staff = await this.prisma.companyStaff.findFirst({
      where: {
        id: BigInt(staffId),
        companyId: booking.companyId,
        status: 'active',
      },
      include: { user: true },
    });

    if (!staff) throw new BadRequestException('Staff not found or not active in this company');

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.booking.update({
        where: { id },
        data: { assignedStaffId: BigInt(staffId) },
        include: {
          customer: true, company: true, service: true,
          assignedStaff: { include: { user: true } },
        },
      });

      await tx.bookingStatusLog.create({
        data: {
          bookingId: id,
          oldStatus: booking.status,
          newStatus: booking.status,
          changedBy: BigInt(user.id),
        },
      });

      await tx.notification.create({
        data: {
          userId: staff.userId,
          title: 'New Job Assignment',
          body: `You have been assigned to a ${u.service.name} job on ${u.bookingDate}`,
          type: 'info',
          isRead: false,
        },
      });

      await tx.notification.create({
        data: {
          userId: booking.customerId,
          title: 'Staff Assigned',
          body: `${staff.user.fullName} has been assigned to your booking`,
          type: 'info',
          isRead: false,
        },
      });

      return u;
    });

    return {
      success: true,
      message: 'Staff assigned successfully',
      booking: this.serializeBooking(updated),
    };
  }

  async startJob(id: bigint, userId: bigint) {
    const staff = await this.prisma.companyStaff.findFirst({
      where: { userId },
    });
    if (!staff) throw new ForbiddenException('You are not registered as staff');

    const booking = await this.findOrFail(id, true);

    if (!booking.assignedStaffId || booking.assignedStaffId.toString() !== staff.id.toString()) {
      throw new BadRequestException('You are not assigned to this booking');
    }

    validateTransition(booking.status, 'in_progress');

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.booking.update({
        where: { id },
        data: { status: 'in_progress', actualStartTime: new Date(), progressPercent: 0 },
        include: { customer: true, company: true, service: true, assignedStaff: true },
      });

      await tx.bookingStatusLog.create({
        data: {
          bookingId: id,
          oldStatus: booking.status,
          newStatus: 'in_progress',
          changedBy: userId,
        },
      });

      await tx.notification.create({
        data: {
          userId: booking.customerId,
          title: 'Service Started',
          body: `Your service has started`,
          type: 'info',
          isRead: false,
        },
      });

      return u;
    });

    return {
      success: true,
      message: 'Job started successfully',
      booking: this.serializeBooking(updated),
    };
  }

  async updateProgress(id: bigint, userId: bigint, progressPercent: number, staffNotes?: string) {
    if (progressPercent < 0 || progressPercent > 100) {
      throw new BadRequestException('progressPercent must be between 0 and 100');
    }

    const staff = await this.prisma.companyStaff.findFirst({ where: { userId } });
    if (!staff) throw new ForbiddenException('You are not registered as staff');

    const booking = await this.findOrFail(id, true);

    if (!booking.assignedStaffId || booking.assignedStaffId.toString() !== staff.id.toString()) {
      throw new BadRequestException('You are not assigned to this booking');
    }

    if (booking.status !== 'in_progress') {
      throw new BadRequestException('Can only update progress for in-progress bookings');
    }

    const updateData: any = { progressPercent };
    if (staffNotes !== undefined) updateData.staffNotes = staffNotes;

    const updated = await this.prisma.booking.update({
      where: { id },
      data: updateData,
      include: { customer: true, service: true, assignedStaff: true },
    });

    if ([25, 50, 75].includes(progressPercent)) {
      await this.prisma.notification.create({
        data: {
          userId: booking.customerId,
          title: 'Service Progress Update',
          body: `Your service is ${progressPercent}% complete`,
          type: 'info',
          isRead: false,
        },
      });
    }

    return {
      success: true,
      message: 'Progress updated successfully',
      booking: this.serializeBooking(updated),
    };
  }

  async completeJob(id: bigint, userId: bigint) {
    const staff = await this.prisma.companyStaff.findFirst({ where: { userId } });
    if (!staff) throw new ForbiddenException('You are not registered as staff');

    const booking = await this.findOrFail(id, true);

    if (!booking.assignedStaffId || booking.assignedStaffId.toString() !== staff.id.toString()) {
      throw new BadRequestException('You are not assigned to this booking');
    }

    validateTransition(booking.status, 'completed');

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.booking.update({
        where: { id },
        data: { status: 'completed', actualEndTime: new Date(), progressPercent: 100 },
        include: { customer: true, company: true, service: true, assignedStaff: true, payment: true },
      });

      await tx.bookingStatusLog.create({
        data: {
          bookingId: id,
          oldStatus: booking.status,
          newStatus: 'completed',
          changedBy: userId,
        },
      });

      // Auto-confirm cash payment on completion
      if (u.payment && u.payment.method === 'cash' && u.payment.status === 'pending') {
        await tx.payment.update({
          where: { id: u.payment.id },
          data: { status: 'paid', paidAt: new Date() },
        });
      }

      await tx.notification.create({
        data: {
          userId: booking.customerId,
          title: 'Service Completed',
          body: `Your service has been completed. Please leave a review!`,
          type: 'info',
          isRead: false,
        },
      });

      return u;
    });

    return {
      success: true,
      message: 'Job completed successfully',
      booking: this.serializeBooking(updated),
    };
  }

  async cancelBooking(id: bigint, reason: string | undefined, user: any) {
    const booking = await this.findOrFail(id);

    if (booking.customerId !== BigInt(user.id) && user.role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      throw new BadRequestException('Cannot cancel this booking');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      validateTransition(booking.status, 'cancelled');

      const u = await tx.booking.update({
        where: { id },
        data: { status: 'cancelled' },
        include: { customer: true, company: { select: { id: true, name: true, ownerId: true } }, service: true },
      });

      await tx.bookingStatusLog.create({
        data: {
          bookingId: id,
          oldStatus: booking.status,
          newStatus: 'cancelled',
          changedBy: BigInt(user.id),
        },
      });

      await tx.cancellation.create({
        data: {
          bookingId: id,
          cancelledBy: BigInt(user.id),
          reason: reason || null,
        },
      });

      return u;
    });

    // Notifications
    if (user.role === 'customer' && updated.company?.ownerId) {
      await this.prisma.notification.create({
        data: {
          userId: updated.company.ownerId,
          title: 'Booking Cancelled',
          body: `A customer has cancelled booking #${id}. Reason: ${reason || 'None provided'}`,
          type: 'info',
          isRead: false,
        },
      });
    } else if (user.role !== 'customer') {
      await this.prisma.notification.create({
        data: {
          userId: booking.customerId,
          title: 'Booking Cancelled',
          body: `Your booking #${id} has been cancelled by the service provider.`,
          type: 'info',
          isRead: false,
        },
      });
    }

    return {
      message: 'Booking cancelled successfully',
      booking: this.serializeBooking(updated),
    };
  }

  async getMyAssignedBookings(userId: bigint, query: any) {
    const staff = await this.prisma.companyStaff.findFirst({ where: { userId } });
    if (!staff) throw new ForbiddenException('You are not registered as staff');

    const { status, page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { assignedStaffId: staff.id };
    if (status) {
      where.status = status.includes(',') ? { in: status.split(',') } : status;
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        include: {
          customer: { select: { id: true, fullName: true, phone: true } },
          company: { select: { id: true, name: true } },
          service: true,
          payment: true,
        },
        orderBy: { bookingDate: 'asc' },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      bookings: bookings.map(b => this.serializeBooking(b)),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  // â”€â”€â”€ Private Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private async findOrFail(id: bigint, includeRelations = false) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: includeRelations ? {
        customer: true,
        company: { select: { id: true, name: true, ownerId: true } },
        service: true,
        assignedStaff: { include: { user: true } },
        payment: true,
      } : undefined,
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  private serializeBooking(b: any): any {
    if (!b) return null;
    const result: any = { ...b };
    const bigintFields = ['id', 'customerId', 'companyId', 'serviceId', 'assignedStaffId'];
    for (const f of bigintFields) {
      if (result[f] != null) result[f] = result[f].toString();
    }
    if (result.customer?.id) result.customer = { ...result.customer, id: result.customer.id.toString() };
    if (result.company?.id) result.company = { ...result.company, id: result.company.id.toString(), ownerId: result.company.ownerId?.toString() };
    if (result.service?.id) {
      result.service = {
        ...result.service,
        id: result.service.id.toString(),
        companyId: result.service.companyId?.toString(),
        serviceTypeId: result.service.serviceTypeId?.toString(),
        basePrice: result.service.basePrice ? Number(result.service.basePrice) : null,
      };
    }
    if (result.assignedStaff?.id) {
      result.assignedStaff = {
        ...result.assignedStaff,
        id: result.assignedStaff.id.toString(),
        userId: result.assignedStaff.userId?.toString(),
        companyId: result.assignedStaff.companyId?.toString(),
        user: result.assignedStaff.user ? { ...result.assignedStaff.user, id: result.assignedStaff.user.id?.toString() } : null,
      };
    }
    if (result.payment?.id) {
      result.payment = {
        ...result.payment,
        id: result.payment.id.toString(),
        bookingId: result.payment.bookingId?.toString(),
        userId: result.payment.userId?.toString(),
        amount: result.payment.amount ? Number(result.payment.amount) : null,
      };
    }
    if (result.review?.id) result.review = { ...result.review, id: result.review.id.toString(), bookingId: result.review.bookingId?.toString(), customerId: result.review.customerId?.toString() };
    if (result.cancellation?.id) result.cancellation = { ...result.cancellation, id: result.cancellation.id.toString(), bookingId: result.cancellation.bookingId?.toString(), cancelledBy: result.cancellation.cancelledBy?.toString() };
    if (result.statusLogs) result.statusLogs = result.statusLogs.map((l: any) => ({ ...l, id: l.id?.toString(), bookingId: l.bookingId?.toString(), changedBy: l.changedBy?.toString() }));
    if (result.totalPrice != null) result.totalPrice = Number(result.totalPrice);
    if (result.platformFee != null) result.platformFee = Number(result.platformFee);
    if (result.companyEarnings != null) result.companyEarnings = Number(result.companyEarnings);
    return result;
  }
}

