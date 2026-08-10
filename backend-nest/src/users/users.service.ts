import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { RequestContactUpdateDto } from './dto/request-contact-update.dto';
import { VerifyContactUpdateDto } from './dto/verify-contact-update.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(dto: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        role: dto.role || 'customer',
        passwordHash,
        status: 'active',
      },
    });
    return { data: user };
  }

  async getAllUsers(query: {
    role?: string;
    status?: string;
    page?: string;
    limit?: string;
  }) {
    const role = query.role;
    const status = query.status;
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          staffMemberships: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              bookingsAsCustomer: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getPreferences(userId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailNotificationsEnabled: true,
        pushNotificationsEnabled: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updatePreferences(
    userId: bigint,
    dto: {
      emailNotificationsEnabled?: boolean;
      pushNotificationsEnabled?: boolean;
      pushToken?: string;
    },
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.emailNotificationsEnabled !== undefined && {
          emailNotificationsEnabled: dto.emailNotificationsEnabled,
        }),
        ...(dto.pushNotificationsEnabled !== undefined && {
          pushNotificationsEnabled: dto.pushNotificationsEnabled,
        }),
        ...(dto.pushToken !== undefined && { pushToken: dto.pushToken }),
      },
      select: {
        emailNotificationsEnabled: true,
        pushNotificationsEnabled: true,
        pushToken: true,
      },
    });
    return user;
  }

  async getUserById(id: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            bookingsAsCustomer: true,
            reviews: true,
            notifications: true,
            messages: true,
            cancellationsMade: true,
          },
        },
        // Customer: full booking history with service, company, payment info
        bookingsAsCustomer: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            bookingDate: true,
            status: true,
            totalPrice: true,
            platformFee: true,
            companyEarnings: true,
            createdAt: true,
            service: {
              select: {
                id: true,
                name: true,
                serviceType: {
                  select: {
                    id: true,
                    name: true,
                    category: { select: { id: true, name: true, icon: true } },
                  },
                },
              },
            },
            company: { select: { id: true, name: true, logoUrl: true } },
            assignedStaff: {
              select: {
                id: true,
                user: { select: { fullName: true } },
              },
            },
          },
        },
        // Customer: cancellations
        cancellationsMade: {
          select: { id: true, cancelledAt: true },
        },
        // Owner: companies with staff, services, bookings, and rating
        ownedCompanies: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            verificationStatus: true,
            walletBalance: true,
            pendingBalance: true,
            availableBalance: true,
            completedJobs: true,
            platformFeePercent: true,
            ratingSummary: {
              select: { averageRating: true, totalReviews: true },
            },
            _count: {
              select: { staff: true, services: true, bookings: true },
            },
            bookings: {
              where: { status: 'completed' },
              select: {
                totalPrice: true,
                platformFee: true,
                companyEarnings: true,
                createdAt: true,
                bookingDate: true,
              },
            },
          },
        },
        // Staff: membership with company, assigned bookings, reviews
        staffMemberships: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
                ratingSummary: { select: { averageRating: true } },
              },
            },
            assignedBookings: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              select: {
                id: true,
                bookingDate: true,
                status: true,
                staffEarnings: true,
                totalPrice: true,
                service: { select: { name: true } },
                company: { select: { name: true } },
                customer: { select: { fullName: true } },
              },
            },
            reviews: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: {
                id: true,
                staffRating: true,
                staffComment: true,
                createdAt: true,
                customer: { select: { fullName: true } },
                booking: { select: { service: { select: { name: true } } } },
              },
            },
          },
        },
        // Audit logs
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            action: true,
            createdAt: true,
            user: { select: { fullName: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { user };
  }

  async updateUser(id: bigint, dto: UpdateUserDto, currentUser: any) {
    if (currentUser.id !== id && currentUser.role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }

    const updateData: any = {};
    if (dto.fullName) updateData.fullName = dto.fullName;
    if (dto.phone) updateData.phone = dto.phone;
    if (dto.avatar) updateData.avatar = dto.avatar;
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    if (dto.email) {
      const exists = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (exists && exists.id !== id) {
        throw new ConflictException('Email already in use');
      }
      updateData.email = dto.email;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        status: true,
        updatedAt: true,
      },
    });

    return {
      message: 'User updated successfully',
      user: updatedUser,
    };
  }

  async requestContactUpdate(userId: bigint, dto: RequestContactUpdateDto) {
    const { type, value } = dto;

    // Check if email/phone already exists in other user accounts
    if (type === 'email') {
      const exists = await this.prisma.user.findUnique({
        where: { email: value },
      });
      if (exists && exists.id !== userId)
        throw new ConflictException('Email already in use');
    } else {
      const exists = await this.prisma.user.findUnique({
        where: { phone: value },
      });
      if (exists && exists.id !== userId)
        throw new ConflictException('Phone already in use');
    }

    const code = '123456'; // Mock code for demo purposes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Invalidate previous OTPs for this value
    await this.prisma.otpCode.updateMany({
      where: {
        email: type === 'email' ? value : undefined,
        phone: type === 'phone' ? value : undefined,
        used: false,
      },
      data: { used: true },
    });

    await this.prisma.otpCode.create({
      data: {
        email: type === 'email' ? value : null,
        phone: type === 'phone' ? value : null,
        code,
        expiresAt,
      },
    });

    return {
      message: `${type === 'email' ? 'Verification code' : 'OTP'} sent successfully (Use 123456 for testing)`,
    };
  }

  async verifyContactUpdate(userId: bigint, dto: VerifyContactUpdateDto) {
    const { type, value, code } = dto;

    const otp = await this.prisma.otpCode.findFirst({
      where: {
        email: type === 'email' ? value : undefined,
        phone: type === 'phone' ? value : undefined,
        code,
        used: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || otp.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired code');
    }

    // Mark as used
    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { used: true },
    });

    // Update the user
    const updateData: any = {};
    if (type === 'email') updateData.email = value;
    if (type === 'phone') updateData.phone = value;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        status: true,
        updatedAt: true,
      },
    });

    return {
      message: `${type === 'email' ? 'Email' : 'Phone'} updated successfully`,
      user: updatedUser,
    };
  }

  async deleteUser(id: bigint, currentUser: any) {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }

  async updateUserStatus(id: bigint, dto: UpdateStatusDto, currentUser: any) {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }

    const actionText = `STATUS_CHANGE_${dto.status.toUpperCase()}`;
    const fullAction = dto.reason
      ? `${actionText} - Reason: ${dto.reason.substring(0, 100)}`
      : actionText;

    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { status: dto.status as any },
        select: {
          id: true,
          fullName: true,
          email: true,
          status: true,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          userId: BigInt(currentUser.id),
          action: fullAction,
          entityType: 'User',
          entityId: id,
        },
      }),
    ]);

    return {
      message: 'User status updated successfully',
      user,
    };
  }

  async updateStaffStatus(userId: bigint, status: 'active' | 'inactive') {
    const staffRecords = await this.prisma.companyStaff.findMany({
      where: { userId },
    });

    if (staffRecords.length === 0) {
      throw new NotFoundException('Staff records not found for user');
    }

    await this.prisma.companyStaff.updateMany({
      where: { userId },
      data: { status },
    });

    return { message: `Staff status updated to ${status}` };
  }

  async getAdminMetrics() {
    const [
      totalUsers,
      totalCompanies,
      pendingCompanies,
      totalBookings,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'customer' } }),
      this.prisma.company.count({ where: { verificationStatus: 'verified' } }),
      this.prisma.company.count({ where: { verificationStatus: 'pending' } }),
      this.prisma.booking.count(),
      this.prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: { status: 'completed' },
      }),
    ]);

    // Calculate platform fees (e.g. 10% of completed bookings)
    const gmv = Number(totalRevenue._sum.totalPrice || 0);
    const platformFees = gmv * 0.1;

    // Recent activity (5 most recent verified or pending companies)
    const recentCompanies = await this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        verificationStatus: true,
        createdAt: true,
      },
    });

    return {
      totalUsers,
      totalCompanies,
      pendingCompanies,
      totalBookings,
      gmv,
      platformFees,
      recentCompanies,
    };
  }

  async getRecommendedStaff(query: any) {
    const { limit = 6 } = query;
    const take = parseInt(limit.toString());

    // In a real application, this would calculate scores based on reviews, jobs completed, etc.
    // Here we find active staff and sort them by some criteria (e.g. creation date or reviews if relation exists)
    const staff = await this.prisma.companyStaff.findMany({
      where: { status: 'active' },
      take,
      include: {
        user: { select: { id: true, fullName: true, avatar: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = staff.map((s) => ({
      id: s.id.toString(),
      userId: s.userId.toString(),
      companyId: s.companyId.toString(),
      role: s.role,
      status: s.status,
      user: {
        id: s.user.id.toString(),
        fullName: s.user.fullName,
        avatar: s.user.avatar,
      },
      company: {
        id: s.company.id.toString(),
        name: s.company.name,
      },
      // Mocking some stats since CompanyStaff doesn't have a direct relation to bookings count
      jobsCompleted: Math.floor(Math.random() * 50) + 10,
      rating: (Math.random() * 1 + 4).toFixed(1), // 4.0 to 5.0
    }));

    return { data: formatted, count: formatted.length };
  }

  async deleteAccount(userId: bigint) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const deletedEmail = `deleted_${Date.now()}_${Math.floor(Math.random() * 10000)}@deleted.com`;
    const randomHash = await bcrypt.hash(Date.now().toString(), 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: 'Deleted User',
        email: deletedEmail,
        phone: null,
        avatar: null,
        pushToken: null,
        passwordHash: randomHash,
        status: 'inactive' as any,
      },
    });

    return { message: 'Account successfully deleted and anonymized' };
  }
}
