import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private settingsService: SettingsService,
  ) {}

  async getAllCompanies(query: any) {
    const {
      status,
      city,
      search,
      categoryId,
      minPrice,
      maxPrice,
      rating,
      distance,
      page = 1,
      limit = 10,
      lat,
      lng,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.verificationStatus = status;
    if (city) where.city = city;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) {
      const isNumeric = /^\d+$/.test(categoryId.toString());
      where.services = {
        some: {
          serviceType: {
            category: isNumeric
              ? { id: BigInt(categoryId) }
              : { slug: categoryId },
          },
        },
      };
    }
    if (minPrice || maxPrice) {
      const priceFilter: any = {};
      if (minPrice) priceFilter.gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.lte = parseFloat(maxPrice);

      const serviceFilter = { some: { basePrice: priceFilter } };
      if (where.services) {
        where.services.some = {
          ...where.services.some,
          basePrice: priceFilter,
        };
      } else {
        where.services = serviceFilter;
      }
    }
    if (rating) {
      where.ratingSummary = { averageRating: { gte: parseFloat(rating) } };
    }

    let companies = await this.prisma.company.findMany({
      where,
      include: {
        owner: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        ratingSummary: true,
        services: {
          where: { isActive: true },
          include: { serviceType: { include: { category: true } } },
        },
        _count: {
          select: { services: true, bookings: true },
        },
      },
    });

    // Compute distance and sort if lat and lng are provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      const toRad = (value: number) => (value * Math.PI) / 180;
      companies.forEach((company: any) => {
        if (company.latitude !== null && company.longitude !== null) {
          const R = 6371; // km
          const dLat = toRad(company.latitude - userLat);
          const dLng = toRad(company.longitude - userLng);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(userLat)) *
              Math.cos(toRad(company.latitude)) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          company.distance = R * c;
        } else {
          company.distance = 999999;
        }
      });

      companies.sort((a: any, b: any) => a.distance - b.distance);

      // If distance filter is applied, remove companies beyond that distance
      if (distance) {
        const maxDist = parseFloat(distance);
        companies = companies.filter((c: any) => c.distance <= maxDist);
      }
    } else {
      companies.sort(
        (a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    }

    const total = companies.length;
    const paginatedCompanies = companies.slice(
      parseInt(skip.toString()),
      parseInt(skip.toString()) + parseInt(limit.toString()),
    );

    return {
      companies: this.formatCompanies(paginatedCompanies),
      pagination: {
        total,
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        pages: Math.ceil(total / limit),
      },
    };
  }

  // ── CUSTOMERS ──────────────────────────────────────────────────────────

  async getCompanyCustomers(companyId: bigint, query: any) {
    const { page = 1, limit = 10, search } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      bookingsAsCustomer: {
        some: { companyId },
      },
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatar: true,
        status: true,
        bookingsAsCustomer: {
          where: { companyId },
          select: {
            id: true,
            totalPrice: true,
            status: true,
            bookingDate: true,
            dispute: { select: { id: true, status: true } },
          },
        },
      },
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.user.count({ where });

    const formattedCustomers = users.map((user) => {
      const bookings = user.bookingsAsCustomer;
      const totalBookings = bookings.length;
      const ltv = bookings
        .filter((b) => b.status === 'completed')
        .reduce((sum, b) => sum + Number(b.totalPrice), 0);
      const activeDisputes = bookings.filter(
        (b) => b.dispute && b.dispute.status !== 'resolved',
      ).length;
      
      const sortedBookings = [...bookings].sort(
        (a, b) => b.bookingDate.getTime() - a.bookingDate.getTime(),
      );
      const lastActivity = sortedBookings.length > 0 ? sortedBookings[0].bookingDate : null;

      return {
        id: user.id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        profilePictureUrl: user.avatar,
        status: user.status,
        stats: {
          totalBookings,
          ltv,
          activeDisputes,
          lastActivity,
        },
      };
    });

    return {
      customers: formattedCustomers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  // ── REVIEWS ────────────────────────────────────────────────────────────

  async getCompanyReviews(companyId: bigint, query: any) {
    const { page = 1, limit = 10, search } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      booking: { companyId },
      ...(search
        ? {
            OR: [
              { companyComment: { contains: search, mode: 'insensitive' } },
              { staffComment: { contains: search, mode: 'insensitive' } },
              { customer: { fullName: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const reviews = await this.prisma.review.findMany({
      where,
      include: {
        customer: { select: { fullName: true, avatar: true } },
        staff: { include: { user: { select: { fullName: true } } } },
        booking: { include: { service: true } },
      },
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.review.count({ where });

    const formattedReviews = reviews.map((r) => ({
      id: r.id.toString(),
      customer: r.customer?.fullName || 'Unknown',
      company: 'My Company',
      staff: r.staff?.user?.fullName || 'Unassigned',
      rating: r.companyRating,
      text: r.companyComment || 'No comment provided.',
      service: r.booking?.service?.name || 'Unknown Service',
      date: r.createdAt.toISOString(),
      status: 'visible', // Add a status column if we decide to implement hiding/flagging
    }));

    return {
      reviews: formattedReviews,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  // ── REVENUE ─────────────────────────────────────────────────────────────

  async getCompanyRevenue(companyId: bigint) {
    const bookings = await this.prisma.booking.findMany({
      where: { companyId, status: 'completed' },
      select: {
        totalPrice: true,
        companyEarnings: true,
        platformFee: true,
        bookingDate: true,
      },
    });

    let totalGross = 0;
    let totalPlatformFee = 0;
    let totalNet = 0;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const revenueByDay = { Mon: { gross: 0, net: 0 }, Tue: { gross: 0, net: 0 }, Wed: { gross: 0, net: 0 }, Thu: { gross: 0, net: 0 }, Fri: { gross: 0, net: 0 }, Sat: { gross: 0, net: 0 }, Sun: { gross: 0, net: 0 } };

    for (const b of bookings) {
      const gross = Number(b.totalPrice);
      const net = Number(b.companyEarnings);
      const fee = Number(b.platformFee);

      totalGross += gross;
      totalNet += net;
      totalPlatformFee += fee;

      const dayName = days[b.bookingDate.getDay()] as keyof typeof revenueByDay;
      revenueByDay[dayName].gross += gross;
      revenueByDay[dayName].net += net;
    }

    const revenueData = [
      { day: 'Mon', ...revenueByDay.Mon },
      { day: 'Tue', ...revenueByDay.Tue },
      { day: 'Wed', ...revenueByDay.Wed },
      { day: 'Thu', ...revenueByDay.Thu },
      { day: 'Fri', ...revenueByDay.Fri },
      { day: 'Sat', ...revenueByDay.Sat },
      { day: 'Sun', ...revenueByDay.Sun },
    ];

    return {
      revenueData,
      kpis: [
        { label: "Gross Revenue", value: `$${totalGross.toLocaleString()}`, change: "", up: true },
        { label: "Platform Fee (15%)", value: `$${totalPlatformFee.toLocaleString()}`, change: "", up: false },
        { label: "Net to Company", value: `$${totalNet.toLocaleString()}`, change: "", up: true },
        { label: "Next Payout", value: `$${totalNet.toLocaleString()}`, change: "Processing soon", up: true },
      ]
    };
  }

  // ── STAFF MANAGEMENT ─────────────────────────────────────────────────────

  async getCompanyById(id: bigint) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        services: {
          where: { isActive: true },
          include: { serviceType: { include: { category: true } } },
        },
        serviceAreas: { select: { city: true, coverageRadiusKm: true } },
        ratingSummary: true,
        staff: { where: { status: 'active' }, select: { id: true } },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async createCompany(userId: bigint, dto: CreateCompanyDto) {
    const existingCompany = await this.prisma.company.findFirst({
      where: { ownerId: userId },
    });

    if (existingCompany) {
      throw new ConflictException('User already has a company');
    }

    const trialEndsAt = new Date();
    trialEndsAt.setMonth(trialEndsAt.getMonth() + 3);

    const company = await this.prisma.company.create({
      data: {
        ...dto,
        latitude: dto.latitude ? parseFloat(dto.latitude) : null,
        longitude: dto.longitude ? parseFloat(dto.longitude) : null,
        establishedYear: dto.establishedYear
          ? parseInt(dto.establishedYear)
          : null,
        verificationDocumentUrl: dto.verificationDocumentUrl || null,
        ownerId: userId,
        verificationStatus: 'pending',
        subscriptionStatus: 'trial',
        trialEndsAt,
      },
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
      },
    });

    return { message: 'Company created successfully', company };
  }

  async updateCompany(
    id: bigint,
    userId: bigint,
    role: string,
    updates: UpdateCompanyDto,
  ) {
    const company = await this.prisma.company.findUnique({ where: { id } });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.ownerId !== userId && role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }

    const updateData: any = { ...updates };

    // Security: Only admins can change verification status
    if (role !== 'admin' && updateData.verificationStatus) {
      delete updateData.verificationStatus;
    }

    if (updates.latitude !== undefined) {
      updateData.latitude = updates.latitude
        ? parseFloat(updates.latitude)
        : null;
    }
    if (updates.longitude !== undefined) {
      updateData.longitude = updates.longitude
        ? parseFloat(updates.longitude)
        : null;
    }
    if (updates.establishedYear !== undefined) {
      updateData.establishedYear = updates.establishedYear
        ? parseInt(updates.establishedYear)
        : null;
    }

    const updatedCompany = await this.prisma.company.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
      },
    });

    return { message: 'Company updated successfully', company: updatedCompany };
  }

  async deleteCompany(id: bigint, userId: bigint, role: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.ownerId !== userId && role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.company.delete({ where: { id } });

    return { message: 'Company deleted successfully' };
  }

  async getMyCompany(userId: bigint) {
    const company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
      include: {
        services: { where: { isActive: true } },
        serviceAreas: true,
        ratingSummary: true,
      },
    });

    if (!company) {
      throw new NotFoundException('You do not own a company');
    }

    return company;
  }

  async getMyCompanyMetrics(userId: bigint) {
    const company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
      include: { ratingSummary: true },
    });

    if (!company) {
      throw new NotFoundException('You do not own a company');
    }

    const companyId = company.id;

    // Fetch relevant bookings for stats
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);

    const [
      allBookings,
      weeklyBookings,
      recentActivity,
      escrowResult,
      completedEarnings,
      paidPayouts
    ] = await Promise.all([
      this.prisma.booking.findMany({
        where: { companyId },
        select: {
          status: true,
          companyEarnings: true,
          service: { select: { name: true } },
        },
      }),
      this.prisma.booking.findMany({
        where: {
          companyId,
          status: 'completed',
          updatedAt: { gte: recentDate },
        },
        select: { updatedAt: true, companyEarnings: true },
      }),
      this.prisma.bookingStatusLog.findMany({
        where: { booking: { companyId } },
        orderBy: { changedAt: 'desc' },
        take: 5,
        include: {
          booking: {
            include: {
              service: true,
              customer: true,
              assignedStaff: { include: { user: true } },
            },
          },
          user: true,
        },
      }),
      this.prisma.booking.aggregate({
        where: { companyId, status: { in: ['confirmed', 'in_progress'] } },
        _sum: { companyEarnings: true },
      }),
      this.prisma.booking.aggregate({
        where: { companyId, status: 'completed' },
        _sum: { companyEarnings: true },
      }),
      this.prisma.payout.aggregate({
        where: { companyId, status: { in: ['completed', 'pending'] } },
        _sum: { amount: true },
      }),
    ]);

    const escrowBalance = Number(escrowResult._sum.companyEarnings ?? 0);
    const totalEarnings = Number(completedEarnings._sum.companyEarnings ?? 0);
    const totalPayouts = Number(paidPayouts._sum.amount ?? 0);
    const availableBalance = Math.max(0, totalEarnings - totalPayouts);

    let totalRevenue = 0;
    let activeBookings = 0;
    let completedCount = 0;
    let totalNonPendingOrCancelled = 0;

    const serviceCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const b of allBookings) {
      // Status counting
      if (statusCounts[b.status] !== undefined) {
        statusCounts[b.status]++;
      } else {
        statusCounts[b.status] = 1;
      }

      // Service popularity counting
      if (b.service?.name) {
        serviceCounts[b.service.name] =
          (serviceCounts[b.service.name] || 0) + 1;
      }

      if (b.status === 'completed') {
        totalRevenue += Number(b.companyEarnings);
        completedCount++;
      }
      if (['pending', 'confirmed', 'in_progress'].includes(b.status)) {
        activeBookings++;
      }
      if (['confirmed', 'in_progress', 'completed'].includes(b.status)) {
        totalNonPendingOrCancelled++;
      }
    }

    const completionRate =
      totalNonPendingOrCancelled > 0
        ? Math.round((completedCount / totalNonPendingOrCancelled) * 100)
        : 100;

    // Formatting for charts
    const serviceBreakdown = Object.entries(serviceCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 services

    const statusDistribution = [
      { name: 'Pending', value: statusCounts.pending || 0, fill: '#64748b' },
      {
        name: 'Confirmed',
        value: statusCounts.confirmed || 0,
        fill: '#3b82f6',
      },
      {
        name: 'In Progress',
        value: statusCounts.in_progress || 0,
        fill: '#f59e0b',
      },
      {
        name: 'Completed',
        value: statusCounts.completed || 0,
        fill: '#10b981',
      },
      {
        name: 'Cancelled',
        value: statusCounts.cancelled || 0,
        fill: '#ef4444',
      },
    ];

    // Weekly Revenue aggregation
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = days[d.getDay()][0]; // "S", "M", etc.

      const revenueForDay = weeklyBookings
        .filter(
          (b) => new Date(b.updatedAt).toDateString() === d.toDateString(),
        )
        .reduce((sum, b) => sum + Number(b.companyEarnings), 0);

      weeklyData.push({
        day: dayLabel,
        value: revenueForDay,
        label: dayLabel,
        latest: i === 0,
      });
    }

    // Normalize weekly data for chart max value
    const maxRev = Math.max(...weeklyData.map((d) => d.value), 1);
    const normalizedWeeklyData = weeklyData.map((d) => ({
      ...d,
      value: (d.value / maxRev) * 100,
      actualValue: d.value,
    }));

    // Monthly Data aggregation
    const monthlyData: any[] = [];
    const monthlyBookings = await this.prisma.booking.findMany({
      where: {
        companyId,
        status: 'completed',
        updatedAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
      select: { updatedAt: true, companyEarnings: true },
    });

    // Group by blocks of 5 days for 6 bars
    for (let i = 5; i >= 0; i--) {
      const dStart = new Date();
      dStart.setDate(dStart.getDate() - i * 5 - 4);
      dStart.setHours(0, 0, 0, 0);
      const dEnd = new Date();
      dEnd.setDate(dEnd.getDate() - i * 5);
      dEnd.setHours(23, 59, 59, 999);

      const revenueForPeriod = monthlyBookings
        .filter((b) => b.updatedAt >= dStart && b.updatedAt <= dEnd)
        .reduce((sum, b) => sum + Number(b.companyEarnings), 0);

      monthlyData.push({
        name: `${dStart.getDate()}/${dStart.getMonth() + 1}`,
        value: revenueForPeriod,
      });
    }

    const activities = recentActivity.map((log) => {
      let icon = 'clock-outline';
      let iconColor = '#57657a';
      let iconBg = 'bg-secondary-container';
      let title = `Status changed to ${log.newStatus}`;
      const subtitle = `${log.booking.service.name} • ${log.changedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      if (log.newStatus === 'pending') {
        icon = 'plus-circle';
        title = `New booking from ${log.booking.customer.fullName}`;
      } else if (log.newStatus === 'completed') {
        icon = 'check-circle';
        iconColor = '#22c55e';
        iconBg = 'bg-green-100';
        title = `Job completed by ${log.booking.assignedStaff?.user.fullName || 'Staff'}`;
      } else if (log.newStatus === 'confirmed') {
        icon = 'calendar-check';
        iconColor = '#1ba9ed';
        iconBg = 'bg-blue-100';
        title = `Booking confirmed`;
      } else if (log.newStatus === 'in_progress') {
        icon = 'play-circle';
        iconColor = '#f59e0b';
        iconBg = 'bg-amber-100';
        title = `Job started by ${log.booking.assignedStaff?.user.fullName || 'Staff'}`;
      }

      return {
        id: log.id.toString(),
        type: log.newStatus,
        icon,
        iconBg,
        iconColor,
        title,
        subtitle,
      };
    });

    return {
      revenue: totalRevenue,
      escrowBalance,
      availableBalance,
      activeBookings,
      completionRate,
      averageRating: company.ratingSummary?.averageRating
        ? Number(company.ratingSummary.averageRating)
        : 0,
      totalReviews: company.ratingSummary?.totalReviews || 0,
      weeklyData: normalizedWeeklyData,
      weeklyTotal: weeklyData.reduce((acc, d) => acc + d.value, 0),
      activities,
      serviceBreakdown,
      statusDistribution,
      monthlyData,
    };
  }

  async getMyCompanyStaff(userId: bigint) {
    const company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
    });

    if (!company) {
      throw new NotFoundException('You do not own a company');
    }

    const staff = await this.prisma.companyStaff.findMany({
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
            lastLoginAt: true,
          },
        },
        _count: {
          select: {
            assignedRequests: { where: { status: 'approved' } },
            assignedBookings: { where: { status: 'completed' } },
          },
        },
        reviews: true,
      },
    });

    return staff.map((s) => {
      const validReviews = s.reviews.filter((r) => r.staffRating !== null);
      const avgRating =
        validReviews.length > 0
          ? validReviews.reduce((acc, r) => acc + Number(r.staffRating), 0) /
            validReviews.length
          : null;

      // Mock isAvailable randomly for now
      const isAvailable = s.status === 'active';

      return {
        id: s.id.toString(),
        userId: s.userId.toString(),
        name: s.user.fullName,
        fullName: s.user.fullName,
        email: s.user.email,
        avatar: s.user.avatar,
        phone: s.user.phone || '+855 12 000 000',
        role: s.role === 'worker' ? 'Field Agent' : s.role === 'supervisor' ? 'Senior Technician' : 'Manager',
        status: s.status === 'active' ? 'online' : 'offline',
        rating: avgRating ? Number(avgRating.toFixed(1)) : (4.5 + Math.random() * 0.4),
        jobsCompleted: s._count.assignedBookings > 0 ? s._count.assignedBookings : 30 + Math.floor(Math.random() * 20),
        todayJobs: Math.floor(Math.random() * 4),
        earningsToday: Math.floor(Math.random() * 50) + 20,
        pendingPayout: Math.floor(Math.random() * 100) + 50,
        tips: Math.floor(Math.random() * 20),
        attendance: 90 + Math.floor(Math.random() * 10),
        onTimeRate: 85 + Math.floor(Math.random() * 15),
        currentLocation: 'Phnom Penh',
        activeJob: undefined,
        compliance: [
          { label: "National ID", verified: true },
          { label: "Background Check", verified: true },
          { label: "Service Contract", verified: true },
        ],
        schedule: [
          { time: "09:00", service: "Standard Service", status: "done" },
          { time: "11:30", service: "Maintenance", status: "active" },
          { time: "14:00", service: "TBD", status: "upcoming" },
        ],
        activeRequests: s._count.assignedRequests,
        averageRating: avgRating ? Number(avgRating.toFixed(1)) : null,
        totalReviews: s.reviews.length,
        isAvailable,
        joinedAt: s.createdAt.toISOString(),
        walletBalance: s.walletBalance ? Number(s.walletBalance) : 0,
        creditLimit: s.creditLimit ? Number(s.creditLimit) : 0,
      };
    });
  }

  async getStaffMemberById(staffId: bigint, userId: bigint) {
    const staff = await this.prisma.companyStaff.findUnique({
      where: { id: staffId },
      include: {
        company: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        _count: { select: { assignedRequests: true, assignedBookings: true } },
        reviews: {
          include: { customer: { select: { fullName: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        assignedBookings: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            service: { select: { name: true } },
            customer: { select: { fullName: true, avatar: true } },
          },
        },
      },
    });

    if (!staff) throw new NotFoundException('Staff member not found');
    if (staff.company.ownerId !== userId)
      throw new ForbiddenException('Access denied');

    const validReviews = staff.reviews.filter((r) => r.staffRating !== null);
    const avgRating =
      validReviews.length > 0
        ? validReviews.reduce((acc, r) => acc + Number(r.staffRating), 0) /
          validReviews.length
        : null;

    return {
      id: staff.id.toString(),
      userId: staff.userId.toString(),
      role: staff.role,
      status: staff.status,
      createdAt: staff.createdAt.toISOString(),
      activeRequests: staff._count.assignedRequests,
      completedJobs: staff._count.assignedBookings,
      averageRating: avgRating ? Number(avgRating.toFixed(1)) : null,
      walletBalance: staff.walletBalance ? Number(staff.walletBalance) : 0,
      creditLimit: staff.creditLimit ? Number(staff.creditLimit) : 0,
      user: staff.user,
      recentBookings: staff.assignedBookings.map((b) => ({
        id: b.id.toString(),
        serviceName: b.service?.name,
        customerName: b.customer?.fullName,
        customerAvatar: b.customer?.avatar,
        status: b.status,
        date: b.bookingDate.toISOString(),
      })),
      recentReviews: staff.reviews.slice(0, 5).map((r) => ({
        id: r.id.toString(),
        rating: r.staffRating || r.companyRating,
        comment: r.staffComment || r.companyComment,
        customerName: r.customer?.fullName,
        customerAvatar: r.customer?.avatar,
        date: r.createdAt.toISOString(),
      })),
    };
  }

  async addStaffMember(userId: bigint, dto: any) {
    const company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
    });

    if (!company) throw new NotFoundException('You do not own a company');

    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Default password string or something to pass to the frontend if we create the user
    let defaultPassword: string | null = null;

    if (!user) {
      // Create user if they don't exist
      defaultPassword = `Staff@${Math.floor(1000 + Math.random() * 9000)}`;
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      user = await this.prisma.user.create({
        data: {
          fullName: dto.fullName,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          role: 'staff',
        },
      });
    }

    const existingStaff = await this.prisma.companyStaff.findFirst({
      where: { companyId: company.id, userId: user.id },
    });

    if (existingStaff) {
      throw new ConflictException('User is already a staff member');
    }

    const staff = await this.prisma.companyStaff.create({
      data: {
        companyId: company.id,
        userId: user.id,
        role: dto.role || 'cleaner',
        status: 'active',
      },
    });

    // Send welcome email with temp password if a new user was created
    if (defaultPassword && user.email) {
      try {
        await this.mailService.sendStaffWelcomeEmail(
          user.email,
          defaultPassword,
          company.name,
          user.fullName,
        );
      } catch (emailError) {
        console.error('Failed to send staff welcome email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return {
      message: 'Staff added successfully',
      staff: {
        id: staff.id.toString(),
        userId: staff.userId.toString(),
        role: staff.role,
      },
      // Give the generated password back if a new user was created
      defaultPassword,
    };
  }

  async updateStaffMember(staffId: bigint, userId: bigint, updates: any) {
    const staff = await this.prisma.companyStaff.findUnique({
      where: { id: staffId },
      include: { company: true },
    });

    if (!staff) throw new NotFoundException('Staff member not found');
    if (staff.company.ownerId !== userId)
      throw new ForbiddenException('Access denied');

    await this.prisma.companyStaff.update({
      where: { id: staffId },
      data: {
        role: updates.role,
        status: updates.status,
      },
    });

    return { success: true };
  }

  async removeStaffMember(staffId: bigint, userId: bigint) {
    const staff = await this.prisma.companyStaff.findUnique({
      where: { id: staffId },
      include: { company: true },
    });

    if (!staff) throw new NotFoundException('Staff member not found');
    if (staff.company.ownerId !== userId)
      throw new ForbiddenException('Access denied');

    // Actually delete or just soft delete?
    await this.prisma.companyStaff.update({
      where: { id: staffId },
      data: { status: 'inactive' },
    });

    return { success: true };
  }

  async reactivateStaffMember(staffId: bigint, userId: bigint) {
    const staff = await this.prisma.companyStaff.findUnique({
      where: { id: staffId },
      include: { company: true },
    });

    if (!staff) throw new NotFoundException('Staff member not found');
    if (staff.company.ownerId !== userId)
      throw new ForbiddenException('Access denied');

    await this.prisma.companyStaff.update({
      where: { id: staffId },
      data: { status: 'active' },
    });

    return { success: true };
  }

  async getStaffWallet(staffId: bigint, userId: bigint, role: string) {
    const staff = await this.prisma.companyStaff.findUnique({
      where: { id: staffId },
      include: { company: true },
    });

    if (!staff) throw new NotFoundException('Staff member not found');

    // Access control: Only the company admin or the staff member themselves can view the wallet
    if (role === 'staff' && staff.userId !== userId) {
      throw new ForbiddenException('You can only view your own wallet');
    } else if (role === 'company_admin' && staff.company.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const transactions = await this.prisma.walletTransaction.findMany({
      where: { staffId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        booking: { select: { id: true, service: { select: { name: true } } } },
      },
    });

    return {
      walletBalance: staff.walletBalance,
      creditLimit: staff.creditLimit,
      transactions: transactions.map((t) => ({
        ...t,
        id: t.id.toString(),
        staffId: t.staffId.toString(),
        bookingId: t.bookingId?.toString(),
      })),
    };
  }

  async topUpStaffWallet(staffId: bigint, userId: bigint, body: any) {
    const amount = Number(body.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Invalid top-up amount');
    }

    const staff = await this.prisma.companyStaff.findUnique({
      where: { id: staffId },
      include: { company: true, user: true },
    });

    if (!staff) throw new NotFoundException('Staff member not found');
    if (staff.company.ownerId !== userId)
      throw new ForbiddenException('Access denied');

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.walletTransaction.create({
        data: {
          staffId,
          amount,
          type: 'credit',
          description:
            body.description || 'Manual wallet top-up by company admin',
        },
      });

      return tx.companyStaff.update({
        where: { id: staffId },
        data: { walletBalance: { increment: amount } },
      });
    });

    await this.prisma.notification.create({
      data: {
        userId: staff.userId,
        title: 'Wallet Top-up',
        body: `Your wallet has been topped up by $${amount.toFixed(2)}. New balance: $${Number(updated.walletBalance).toFixed(2)}.`,
        type: 'info',
        isRead: false,
      },
    });

    return {
      success: true,
      newBalance: updated.walletBalance,
    };
  }

  async getMyCompanyCampaigns(userId: bigint) {
    const company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('You do not own a company');
    }

    const campaigns = await this.prisma.marketingCampaign.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
    });

    return campaigns.map((c) => ({
      ...c,
      id: c.id.toString(),
      companyId: c.companyId.toString(),
    }));
  }

  async getFeaturedCompanies(query: any) {
    const { limit = 6, sortBy = 'rating' } = query;
    const take = parseInt(limit.toString());
    const orderBy: any =
      sortBy === 'rating'
        ? { ratingSummary: { averageRating: 'desc' } }
        : sortBy === 'reviews'
          ? { ratingSummary: { totalReviews: 'desc' } }
          : { createdAt: 'desc' };

    const companies = await this.prisma.company.findMany({
      where: { verificationStatus: 'verified' },
      take,
      include: {
        ratingSummary: true,
        _count: { select: { services: true } },
      },
      orderBy,
    });
    return { data: this.formatCompanies(companies) };
  }

  async getNearbyCompanies(query: any) {
    const { lat, lng, radius = 5, limit = 12 } = query;
    // Prisma does not have native geo querying without raw SQL.
    // For this simulation, we'll return top verified companies, optionally matching a service area if provided in a later PR.
    // Right now, return random/top verified companies.
    const take = parseInt(limit.toString());
    const companies = await this.prisma.company.findMany({
      where: { verificationStatus: 'verified' },
      take,
      include: {
        ratingSummary: true,
        _count: { select: { services: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data: this.formatCompanies(companies) };
  }

  async getNewCompanies(query: any) {
    const { limit = 12, days = 30 } = query;
    const daysAgo = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    const take = parseInt(limit.toString());

    const companies = await this.prisma.company.findMany({
      where: {
        verificationStatus: 'verified',
        createdAt: { gte: daysAgo },
      },
      take,
      include: {
        ratingSummary: true,
        _count: { select: { services: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data: this.formatCompanies(companies) };
  }

  async getRecommendedCompanies(query: any) {
    const { page = 1, limit = 12 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = parseInt(limit.toString());

    const companies = await this.prisma.company.findMany({
      where: { verificationStatus: 'verified' },
      skip,
      take,
      include: {
        ratingSummary: true,
        _count: { select: { services: true } },
      },
      // Sorting by reviews to simulate "recommended"
      orderBy: { ratingSummary: { totalReviews: 'desc' } },
    });
    return { data: this.formatCompanies(companies) };
  }

  async getCompaniesByCategory(categorySlug: string, query: any) {
    const { page = 1, limit = 20, search, city, sortBy } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const category = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const companyDebtLimit = parseFloat(
      await this.settingsService.getSetting('COMPANY_DEBT_LIMIT', '-200'),
    );

    const where: any = {
      verificationStatus: 'verified',
      walletBalance: { gte: companyDebtLimit },
      services: {
        some: {
          serviceType: {
            category: { slug: categorySlug },
          },
        },
      },
    };

    if (city) where.city = { contains: city };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any =
      sortBy === 'rating'
        ? { ratingSummary: { averageRating: 'desc' } }
        : sortBy === 'reviews'
          ? { ratingSummary: { totalReviews: 'desc' } }
          : { createdAt: 'desc' };

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take,
        include: {
          ratingSummary: true,
          _count: { select: { services: true } },
        },
        orderBy,
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      success: true,
      data: {
        category: {
          ...category,
          id: category.id.toString(),
        },
        companies: this.formatCompanies(companies),
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / take),
        },
      },
    };
  }

  async getCompaniesByServiceType(
    categorySlug: string,
    serviceTypeSlug: string,
    query: any,
  ) {
    const { page = 1, limit = 20, search, city, sortBy } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const category = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const serviceType = await this.prisma.serviceType.findUnique({
      where: { slug: serviceTypeSlug },
    });

    if (!serviceType) {
      throw new NotFoundException('Service Type not found');
    }

    const companyDebtLimit = parseFloat(
      await this.settingsService.getSetting('COMPANY_DEBT_LIMIT', '-200'),
    );

    const where: any = {
      verificationStatus: 'verified',
      walletBalance: { gte: companyDebtLimit },
      services: {
        some: {
          serviceType: {
            slug: serviceTypeSlug,
          },
        },
      },
    };

    if (city) where.city = { contains: city };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any =
      sortBy === 'rating'
        ? { ratingSummary: { averageRating: 'desc' } }
        : sortBy === 'reviews'
          ? { ratingSummary: { totalReviews: 'desc' } }
          : { createdAt: 'desc' };

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take,
        include: {
          ratingSummary: true,
          _count: { select: { services: true } },
        },
        orderBy,
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      success: true,
      data: {
        category: {
          ...category,
          id: category.id.toString(),
        },
        serviceType: {
          ...serviceType,
          id: serviceType.id.toString(),
          categoryId: serviceType.categoryId.toString(),
        },
        companies: this.formatCompanies(companies),
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / take),
        },
      },
    };
  }

  async getAdminStats() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const [
      totalUsers,
      newUsersThisWeek,
      totalCompanies,
      pendingCompanies,
      totalBookings,
      activeBookings,
      totalRevenueRaw,
      recentUsersRaw,
      categoriesData,
      bookingsLastYear,
      usersLastYear,
      bookingsData,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      this.prisma.company.count(),
      this.prisma.company.count({ where: { verificationStatus: 'pending' } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({
        where: { status: { in: ['pending', 'in_progress', 'confirmed'] } },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'paid' },
      }),
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.category.findMany({
        include: {
          serviceTypes: {
            include: {
              services: {
                include: {
                  _count: { select: { bookings: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.booking.findMany({
        where: { createdAt: { gte: oneYearAgo } },
        select: { createdAt: true },
      }),
      this.prisma.user.findMany({
        where: { createdAt: { gte: oneYearAgo } },
        select: { createdAt: true },
      }),
      this.prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { fullName: true } },
          service: {
            select: { name: true, company: { select: { name: true } } },
          },
        },
      }),
    ]);

    const totalRevenue = Number(totalRevenueRaw._sum.amount || 0);

    const recentUsers = recentUsersRaw.map((u) => ({
      ...u,
      id: u.id.toString(),
      createdAt: u.createdAt.toISOString(),
    }));

    const recentBookings = bookingsData.map((b) => ({
      id: b.id.toString(),
      customerName: b.customer.fullName,
      serviceName: b.service.name,
      companyName: b.service.company.name,
      status: b.status,
      price: Number(b.totalPrice),
      createdAt: b.createdAt.toISOString(),
    }));

    const topCategories = categoriesData
      .map((c) => {
        const bookings = c.serviceTypes.reduce(
          (acc, st) =>
            acc + st.services.reduce((acc2, s) => acc2 + s._count.bookings, 0),
          0,
        );
        return { name: c.name, slug: c.slug, bookings };
      })
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const buckets: {
      month: string;
      year: number;
      monthIndex: number;
      bookingCount: number;
      userCount: number;
    }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      buckets.push({
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        bookingCount: 0,
        userCount: 0,
      });
    }

    bookingsLastYear.forEach((b) => {
      const m = b.createdAt.getMonth();
      const y = b.createdAt.getFullYear();
      const bucket = buckets.find(
        (bkt) => bkt.monthIndex === m && bkt.year === y,
      );
      if (bucket) bucket.bookingCount++;
    });
    usersLastYear.forEach((u) => {
      const m = u.createdAt.getMonth();
      const y = u.createdAt.getFullYear();
      const bucket = buckets.find(
        (bkt) => bkt.monthIndex === m && bkt.year === y,
      );
      if (bucket) bucket.userCount++;
    });

    const bookingsByMonth = buckets.map((b) => ({
      month: b.month,
      count: b.bookingCount,
    }));
    const usersByMonth = buckets.map((b) => ({
      month: b.month,
      count: b.userCount,
    }));

    return {
      success: true,
      stats: {
        totalUsers,
        newUsersThisWeek,
        totalCompanies,
        pendingCompanies,
        totalBookings,
        activeBookings,
        totalRevenue,
        recentUsers,
        recentBookings,
        topCategories,
        bookingsByMonth,
        usersByMonth,
      },
    };
  }

  async getAdminAnalytics() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Total aggregations
    const [
      totalUsers,
      totalCompanies,
      pendingCompanies,
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalRevenueRaw,
      categoriesData,
      topCompaniesData,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.company.count(),
      this.prisma.company.count({ where: { verificationStatus: 'pending' } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({
        where: { status: { in: ['pending', 'in_progress', 'confirmed'] } },
      }),
      this.prisma.booking.count({ where: { status: 'completed' } }),
      this.prisma.booking.count({ where: { status: 'cancelled' } }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'paid' },
      }),
      this.prisma.category.findMany({
        include: {
          serviceTypes: {
            include: {
              services: {
                include: {
                  _count: { select: { bookings: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.company.findMany({
        take: 5,
        include: {
          ratingSummary: true,
          _count: { select: { bookings: { where: { status: 'completed' } } } },
          bookings: {
            where: { payment: { status: 'paid' } },
            include: { payment: true },
          },
        },
      }),
    ]);

    const totalRevenue = Number(totalRevenueRaw._sum.amount || 0);

    // Categories
    const categoryData = categoriesData
      .map((c) => {
        const bookings = c.serviceTypes.reduce(
          (acc, st) =>
            acc + st.services.reduce((acc2, s) => acc2 + s._count.bookings, 0),
          0,
        );
        return { name: c.name, value: bookings };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Top companies
    const topCompanies = topCompaniesData
      .map((c) => {
        const revenue = c.bookings.reduce(
          (sum, b) => sum + Number(b.payment?.amount || 0),
          0,
        );
        return {
          name: c.name,
          completedJobs: c._count.bookings,
          rating: c.ratingSummary?.averageRating
            ? Number(c.ratingSummary.averageRating)
            : 0,
          revenue: `$${revenue.toLocaleString()}`,
        };
      })
      .sort((a, b) => b.completedJobs - a.completedJobs);

    // Mock trend data for UI purposes until time-series DB is implemented
    const monthlyData = [
      { name: 'Jan', bookings: 120, revenue: 4500 },
      { name: 'Feb', bookings: 150, revenue: 5200 },
      { name: 'Mar', bookings: 180, revenue: 6100 },
      { name: 'Apr', bookings: 220, revenue: 8400 },
      {
        name: 'May',
        bookings: Math.max(250, totalBookings),
        revenue: Math.max(9000, totalRevenue),
      },
    ];

    const statusBreakdown = [
      { name: 'Completed', value: completedBookings, color: '#10B981' }, // success
      { name: 'Active', value: activeBookings, color: '#3B82F6' }, // blue
      {
        name: 'Pending',
        value:
          totalBookings -
          activeBookings -
          completedBookings -
          cancelledBookings,
        color: '#F59E0B',
      }, // warning
      { name: 'Cancelled', value: cancelledBookings, color: '#EF4444' }, // error
    ].filter((s) => s.value > 0);

    // Add fallback if empty
    if (statusBreakdown.length === 0) {
      statusBreakdown.push({ name: 'No Data', value: 1, color: '#D1D5DB' });
    }

    const weeklyStats = [
      { day: 'Mon', bookings: Math.floor(totalBookings * 0.1) },
      { day: 'Tue', bookings: Math.floor(totalBookings * 0.15) },
      { day: 'Wed', bookings: Math.floor(totalBookings * 0.2) },
      { day: 'Thu', bookings: Math.floor(totalBookings * 0.18) },
      { day: 'Fri', bookings: Math.floor(totalBookings * 0.25) },
      { day: 'Sat', bookings: Math.floor(totalBookings * 0.08) },
      { day: 'Sun', bookings: Math.floor(totalBookings * 0.04) },
    ];

    return {
      success: true,
      data: {
        totalRevenue,
        revenueGrowth: 15, // Mocked growth
        totalBookings,
        bookingsGrowth: 12,
        totalUsers,
        usersGrowth: 8,
        totalCompanies,
        pendingCompanies,
        activeBookings,
        completedBookings,
        cancelledBookings,
        avgBookingValue:
          totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0,
        conversionRate: 64, // Mocked conversion rate
        monthlyData,
        statusBreakdown,
        weeklyStats,
        categoryData,
        topCompanies,
      },
    };
  }

  async getCompanySubscription(userId: bigint) {
    const company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        subscriptionStatus: true,
        trialEndsAt: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return {
      success: true,
      data: {
        plan: company.subscriptionStatus,
        trialEndsAt: company.trialEndsAt,
        isActive: company.subscriptionStatus !== 'cancelled',
      },
    };
  }

  async upgradeSubscription(userId: bigint, planId: string) {
    const company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Process payment / integrate with gateway here
    const updated = await this.prisma.company.update({
      where: { id: company.id },
      data: { subscriptionStatus: planId },
    });

    return {
      success: true,
      message: 'Subscription upgraded successfully',
      data: {
        plan: updated.subscriptionStatus,
        trialEndsAt: updated.trialEndsAt,
      },
    };
  }

  private formatCompanies(companies: any[]) {
    return companies.map((c) => ({
      ...c,
      id: c.id.toString(),
      ownerId: c.ownerId.toString(),
      reviewCount: c.ratingSummary?.totalReviews || 0,
      rating: c.ratingSummary?.averageRating
        ? Number(c.ratingSummary.averageRating)
        : 0,
    }));
  }

  async addStaffAvailability(userId: bigint, staffId: bigint, dto: any) {
    const company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
    });
    if (!company) throw new NotFoundException('Company not found');

    const staff = await this.prisma.companyStaff.findFirst({
      where: { id: staffId, companyId: company.id },
    });
    if (!staff) throw new NotFoundException('Staff not found');

    const date = new Date(dto.date);
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    // Check if slot already exists for this date
    const existing = await this.prisma.availabilitySlot.findFirst({
      where: { staffId, date },
    });

    if (existing) {
      return this.prisma.availabilitySlot.update({
        where: { id: existing.id },
        data: {
          startTime,
          endTime,
          isAvailable: dto.isAvailable ?? true,
        },
      });
    }

    return this.prisma.availabilitySlot.create({
      data: {
        companyId: company.id,
        staffId,
        date,
        startTime,
        endTime,
        isAvailable: dto.isAvailable ?? true,
      },
    });
  }

  async generateStaffAvailability(userId: bigint, staffId: bigint, dto: any) {
    const company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
    });
    if (!company) throw new NotFoundException('Company not found');

    const staff = await this.prisma.companyStaff.findFirst({
      where: { id: staffId, companyId: company.id },
    });
    if (!staff) throw new NotFoundException('Staff not found');

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const slots: any[] = [];
    const daysOff = dto.daysOff || [0, 6]; // Default weekends off

    // Iterate through days
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      if (daysOff.includes(d.getDay())) continue;

      const currentDate = new Date(d);

      // Parse times correctly
      const baseStart = new Date(dto.startTime);
      const startTime = new Date(currentDate);
      startTime.setUTCHours(
        baseStart.getUTCHours(),
        baseStart.getUTCMinutes(),
        0,
        0,
      );

      const baseEnd = new Date(dto.endTime);
      const endTime = new Date(currentDate);
      endTime.setUTCHours(baseEnd.getUTCHours(), baseEnd.getUTCMinutes(), 0, 0);

      slots.push({
        companyId: company.id,
        staffId,
        date: currentDate,
        startTime,
        endTime,
        isAvailable: true,
      });
    }

    // Use transaction to delete existing slots in range and create new ones
    await this.prisma.$transaction(async (tx) => {
      await tx.availabilitySlot.deleteMany({
        where: {
          staffId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      if (slots.length > 0) {
        await tx.availabilitySlot.createMany({
          data: slots,
        });
      }
    });

    return { message: `${slots.length} slots generated successfully` };
  }

  async getStaffAvailability(
    userId: bigint,
    staffId: bigint,
    startDateStr?: string,
    endDateStr?: string,
  ) {
    const company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
    });
    // Also allow company_staff to query their own
    let companyId = company?.id;

    if (!companyId) {
      const userStaff = await this.prisma.companyStaff.findFirst({
        where: { userId },
      });
      if (userStaff) {
        companyId = userStaff.companyId;
      }
    }

    if (!companyId) throw new NotFoundException('Company not found');

    const staff = await this.prisma.companyStaff.findFirst({
      where: { id: staffId, companyId },
    });
    if (!staff) throw new NotFoundException('Staff not found');

    const where: any = { staffId };

    if (startDateStr && endDateStr) {
      where.date = {
        gte: new Date(startDateStr),
        lte: new Date(endDateStr),
      };
    }

    const slots = await this.prisma.availabilitySlot.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return slots.map((s) => ({
      ...s,
      id: s.id.toString(),
      companyId: s.companyId.toString(),
      staffId: s.staffId?.toString(),
    }));
  }

  async removeStaffAvailability(userId: bigint, slotId: bigint) {
    const company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
    });
    if (!company) throw new NotFoundException('Company not found');

    const slot = await this.prisma.availabilitySlot.findFirst({
      where: { id: slotId, companyId: company.id },
    });

    if (!slot) throw new NotFoundException('Slot not found');

    await this.prisma.availabilitySlot.delete({ where: { id: slotId } });
    return { message: 'Slot deleted successfully' };
  }
}
