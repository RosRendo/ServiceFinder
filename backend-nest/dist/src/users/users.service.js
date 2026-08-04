"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createUser(dto) {
        const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
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
            }
        });
        return { data: user };
    }
    async getAllUsers(query) {
        const role = query.role;
        const status = query.status;
        const page = parseInt(query.page || '1', 10);
        const limit = parseInt(query.limit || '10', 10);
        const skip = (page - 1) * limit;
        const where = {};
        if (role)
            where.role = role;
        if (status)
            where.status = status;
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
    async getPreferences(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                emailNotificationsEnabled: true,
                pushNotificationsEnabled: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async updatePreferences(userId, dto) {
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
    async getUserById(id) {
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
                cancellationsMade: {
                    select: { id: true, cancelledAt: true },
                },
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
            throw new common_1.NotFoundException('User not found');
        }
        return { user };
    }
    async updateUser(id, dto, currentUser) {
        if (currentUser.id !== id && currentUser.role !== 'admin') {
            throw new common_1.ForbiddenException('Access denied');
        }
        const updateData = {};
        if (dto.fullName)
            updateData.fullName = dto.fullName;
        if (dto.phone)
            updateData.phone = dto.phone;
        if (dto.avatar)
            updateData.avatar = dto.avatar;
        if (dto.password) {
            updateData.passwordHash = await bcrypt.hash(dto.password, 10);
        }
        if (dto.email) {
            const exists = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });
            if (exists && exists.id !== id) {
                throw new common_1.ConflictException('Email already in use');
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
    async requestContactUpdate(userId, dto) {
        const { type, value } = dto;
        if (type === 'email') {
            const exists = await this.prisma.user.findUnique({
                where: { email: value },
            });
            if (exists && exists.id !== userId)
                throw new common_1.ConflictException('Email already in use');
        }
        else {
            const exists = await this.prisma.user.findUnique({
                where: { phone: value },
            });
            if (exists && exists.id !== userId)
                throw new common_1.ConflictException('Phone already in use');
        }
        const code = '123456';
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);
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
    async verifyContactUpdate(userId, dto) {
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
            throw new common_1.BadRequestException('Invalid or expired code');
        }
        await this.prisma.otpCode.update({
            where: { id: otp.id },
            data: { used: true },
        });
        const updateData = {};
        if (type === 'email')
            updateData.email = value;
        if (type === 'phone')
            updateData.phone = value;
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
    async deleteUser(id, currentUser) {
        if (currentUser.role !== 'admin') {
            throw new common_1.ForbiddenException('Access denied');
        }
        await this.prisma.user.delete({
            where: { id },
        });
        return { message: 'User deleted successfully' };
    }
    async updateUserStatus(id, dto, currentUser) {
        if (currentUser.role !== 'admin') {
            throw new common_1.ForbiddenException('Access denied');
        }
        const actionText = `STATUS_CHANGE_${dto.status.toUpperCase()}`;
        const fullAction = dto.reason ? `${actionText} - Reason: ${dto.reason.substring(0, 100)}` : actionText;
        const [user] = await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id },
                data: { status: dto.status },
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
    async updateStaffStatus(userId, status) {
        const staffRecords = await this.prisma.companyStaff.findMany({
            where: { userId },
        });
        if (staffRecords.length === 0) {
            throw new common_1.NotFoundException('Staff records not found for user');
        }
        await this.prisma.companyStaff.updateMany({
            where: { userId },
            data: { status },
        });
        return { message: `Staff status updated to ${status}` };
    }
    async getAdminMetrics() {
        const [totalUsers, totalCompanies, pendingCompanies, totalBookings, totalRevenue,] = await Promise.all([
            this.prisma.user.count({ where: { role: 'customer' } }),
            this.prisma.company.count({ where: { verificationStatus: 'verified' } }),
            this.prisma.company.count({ where: { verificationStatus: 'pending' } }),
            this.prisma.booking.count(),
            this.prisma.booking.aggregate({
                _sum: { totalPrice: true },
                where: { status: 'completed' },
            }),
        ]);
        const gmv = Number(totalRevenue._sum.totalPrice || 0);
        const platformFees = gmv * 0.1;
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
    async getRecommendedStaff(query) {
        const { limit = 6 } = query;
        const take = parseInt(limit.toString());
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
            jobsCompleted: Math.floor(Math.random() * 50) + 10,
            rating: (Math.random() * 1 + 4).toFixed(1),
        }));
        return { data: formatted, count: formatted.length };
    }
    async deleteAccount(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
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
                status: 'inactive',
            },
        });
        return { message: 'Account successfully deleted and anonymized' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map