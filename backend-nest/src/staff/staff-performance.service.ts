import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StaffPerformanceService {
  constructor(private prisma: PrismaService) {}

  async getPerformance(staffId: bigint) {
    const staffRecord = await this.prisma.companyStaff.findFirst({
      where: { userId: staffId },
      include: {
        user: { select: { id: true, fullName: true, avatar: true } },
        company: { select: { id: true, name: true } },
      },
    });

    if (!staffRecord) throw new NotFoundException('Staff record not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    thisWeek.setDate(today.getDate() - daysToSubtract);

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [
      completedBookings,
      totalBookings,
      reviews,
      completedDetails,
      pendingDetails,
    ] = await Promise.all([
      this.prisma.booking.count({
        where: { assignedStaffId: staffRecord.id, status: 'completed' },
      }),
      this.prisma.booking.count({
        where: { assignedStaffId: staffRecord.id },
      }),
      this.prisma.review.findMany({
        where: { staffId: staffRecord.id },
        select: { staffRating: true },
      }),
      this.prisma.booking.findMany({
        where: {
          assignedStaffId: staffRecord.id,
          status: 'completed',
          bookingDate: { gte: thisWeek },
        },
        select: { bookingDate: true, staffEarnings: true },
      }),
      this.prisma.booking.findMany({
        where: {
          assignedStaffId: staffRecord.id,
          status: 'completed',
          updatedAt: { gte: yesterday },
        },
        select: { staffEarnings: true },
      }),
    ]);

    const pendingBalance = pendingDetails.reduce(
      (sum, b) => sum + Number(b.staffEarnings || 0),
      0,
    );

    let todayCompleted = 0;
    let todayEarnings = 0;
    let weeklyCompleted = 0;
    let weeklyEarnings = 0;

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyChart = dayNames.map((day, i) => {
      const d = new Date(thisWeek);
      d.setDate(thisWeek.getDate() + i);
      return {
        day,
        amount: 0,
        isToday: d.toDateString() === today.toDateString(),
      };
    });

    for (const b of completedDetails) {
      weeklyCompleted++;
      const earnings = Number(b.staffEarnings || 0);
      weeklyEarnings += earnings;

      const bd = new Date(b.bookingDate);
      bd.setHours(0, 0, 0, 0);

      const dayIdx = bd.getDay() === 0 ? 6 : bd.getDay() - 1;
      if (dayIdx >= 0 && dayIdx < 7) {
        weeklyChart[dayIdx].amount += earnings;
      }

      if (bd.getTime() === today.getTime()) {
        todayCompleted++;
        todayEarnings += earnings;
      }
    }

    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + (r.staffRating ?? 0), 0) /
          totalReviews
        : 0;
    const completionRate =
      totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    const ratingDistribution = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      if (r.staffRating && r.staffRating >= 1 && r.staffRating <= 5) {
        ratingDistribution[r.staffRating - 1]++;
      }
    });

    return {
      success: true,
      staffId: staffRecord.id.toString(),
      userId: staffRecord.userId.toString(),
      user: staffRecord.user,
      company: staffRecord.company,
      role: staffRecord.role,
      status: staffRecord.status,
      performance: {
        totalBookings,
        completedBookings,
        completionRate: Math.round(completionRate * 10) / 10,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews,
        ratingDistribution,
        todayCompleted,
        todayEarnings,
        weeklyCompleted,
        weeklyEarnings,
        weeklyChart,
        walletBalance: Number(staffRecord.walletBalance || 0),
        pendingBalance: Number(pendingBalance || 0),
        responseRate: 100,
      },
    };
  }

  async getWallet(userId: bigint) {
    const staffRecord = await this.prisma.companyStaff.findFirst({
      where: { userId },
      include: {
        walletTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!staffRecord) throw new NotFoundException('Staff record not found');

    return {
      success: true,
      walletBalance: staffRecord.walletBalance
        ? Number(staffRecord.walletBalance)
        : 0,
      creditLimit: staffRecord.creditLimit
        ? Number(staffRecord.creditLimit)
        : 0,
      khqrImageUrl: staffRecord.khqrImageUrl,
      transactions: staffRecord.walletTransactions.map((t) => ({
        id: t.id.toString(),
        amount: Number(t.amount),
        type: t.type,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }

  async updateKhqr(userId: bigint, khqrImageUrl: string) {
    const staffRecord = await this.prisma.companyStaff.findFirst({
      where: { userId },
    });
    if (!staffRecord) throw new NotFoundException('Staff record not found');

    await this.prisma.companyStaff.update({
      where: { id: staffRecord.id },
      data: { khqrImageUrl },
    });

    return {
      success: true,
      message: 'KHQR updated successfully',
      khqrImageUrl,
    };
  }

  async getStaffReviews(staffId: bigint, page = 1, limit = 10) {
    const staffRecord = await this.prisma.companyStaff.findFirst({
      where: { userId: staffId },
    });
    if (!staffRecord) throw new NotFoundException('Staff record not found');

    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { staffId: staffRecord.id },
        include: {
          customer: { select: { id: true, fullName: true, avatar: true } },
          booking: { select: { id: true, bookingDate: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where: { staffId: staffRecord.id } }),
    ]);

    return {
      success: true,
      reviews,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getAvailability(staffId: bigint) {
    const staffRecord = await this.prisma.companyStaff.findFirst({
      where: { userId: staffId },
    });
    if (!staffRecord) throw new NotFoundException('Staff record not found');

    const slots = await this.prisma.availabilitySlot.findMany({
      where: { staffId: staffRecord.id },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return { success: true, availability: slots };
  }

  async getStaffAvailabilityForCompany(userId: bigint, staffId: string) {
    const company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
    });
    if (!company) throw new ForbiddenException('You do not own a company');

    const staffRecord = await this.prisma.companyStaff.findFirst({
      where: { id: BigInt(staffId), companyId: company.id },
    });
    if (!staffRecord)
      throw new NotFoundException(
        'Staff record not found or does not belong to your company',
      );

    const slots = await this.prisma.availabilitySlot.findMany({
      where: { staffId: staffRecord.id },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return { success: true, availability: slots };
  }

  async updateAvailability(
    staffId: bigint,
    slots: {
      date: string;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }[],
  ) {
    const staffRecord = await this.prisma.companyStaff.findFirst({
      where: { userId: staffId },
    });
    if (!staffRecord) throw new NotFoundException('Staff record not found');

    // Upsert each slot
    const results = await Promise.all(
      slots.map((slot) =>
        this.prisma.availabilitySlot.create({
          data: {
            companyId: staffRecord.companyId,
            staffId: staffRecord.id,
            date: new Date(slot.date),
            startTime: new Date(`${slot.date}T${slot.startTime}`),
            endTime: new Date(`${slot.date}T${slot.endTime}`),
            isAvailable: slot.isAvailable,
          },
        }),
      ),
    );

    return { message: 'Availability updated', count: results.length };
  }

  async getCompanyStaffPerformance(companyId: bigint) {
    const staffList = await this.prisma.companyStaff.findMany({
      where: { companyId, status: 'active' },
      include: {
        user: { select: { id: true, fullName: true, avatar: true } },
      },
    });

    const performances = await Promise.all(
      staffList.map(async (s) => {
        const [completed, total, reviews] = await Promise.all([
          this.prisma.booking.count({
            where: { assignedStaffId: s.id, status: 'completed' },
          }),
          this.prisma.booking.count({ where: { assignedStaffId: s.id } }),
          this.prisma.review.findMany({
            where: { staffId: s.id },
            select: { staffRating: true },
          }),
        ]);
        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + (r.staffRating ?? 0), 0) /
              reviews.length
            : 0;
        return {
          staffId: s.id.toString(),
          user: s.user,
          role: s.role,
          completedJobs: completed,
          totalJobs: total,
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length,
        };
      }),
    );

    return { success: true, staff: performances };
  }

  async getStaffList(user: any) {
    if (user.role === 'company_admin') {
      const company = await this.prisma.company.findFirst({
        where: { ownerId: BigInt(user.id) },
      });
      if (!company) return [];
      const staffMembers = await this.prisma.companyStaff.findMany({
        where: { companyId: company.id },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              avatar: true,
              status: true,
              workingStatus: true,
              lastSeen: true,
            },
          },
          _count: {
            select: {
              assignedBookings: { where: { status: 'in_progress' } },
            },
          },
        },
      });
      return staffMembers.map((s) => ({
        id: s.id.toString(),
        fullName: s.user?.fullName || 'Technician',
        role: s.role,
        status: s.status,
        isAvailable: s.status === 'active' && s._count.assignedBookings === 0,
        activeJobsCount: s._count.assignedBookings,
        user: s.user,
      }));
    }

    const staffMembers = await this.prisma.companyStaff.findMany({
      where: { status: 'active' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatar: true,
            status: true,
            workingStatus: true,
            lastSeen: true,
          },
        },
      },
    });
    return staffMembers.map((s) => ({
      id: s.id.toString(),
      fullName: s.user?.fullName || 'Technician',
      role: s.role,
      status: s.status,
      user: s.user,
    }));
  }
}
