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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const bcrypt = __importStar(require("bcryptjs"));
const common_2 = require("@nestjs/common");
const mail_service_1 = require("../mail/mail.service");
let AdminService = class AdminService {
    prisma;
    notificationsService;
    mailService;
    constructor(prisma, notificationsService, mailService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.mailService = mailService;
    }
    async getAnalytics() {
        const [totalUsers, totalCompanies, pendingCompanies, totalBookings, completedBookings, cancelledBookings, revenueResult, activeDisputes, openTickets,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.company.count(),
            this.prisma.company.count({ where: { verificationStatus: 'pending' } }),
            this.prisma.booking.count(),
            this.prisma.booking.count({ where: { status: 'completed' } }),
            this.prisma.booking.count({ where: { status: { in: ['cancelled'] } } }),
            this.prisma.booking.aggregate({
                where: { status: 'completed' },
                _sum: { totalPrice: true, companyEarnings: true, platformFee: true },
            }),
            this.prisma.dispute.count({ where: { status: 'open' } }),
            this.prisma.supportTicket.count({ where: { status: 'open' } }),
        ]);
        const totalRevenue = Number(revenueResult._sum.totalPrice || 0);
        const totalCompanyEarnings = Number(revenueResult._sum.companyEarnings || 0);
        const platformRevenue = Number(revenueResult._sum.platformFee || 0);
        const revenueSplit = [
            { name: 'Platform Commission', value: platformRevenue, fill: '#8b5cf6' },
            { name: 'Company Payouts', value: totalCompanyEarnings, fill: '#3b82f6' },
        ];
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);
        const [recentUsers, recentCompanies, recentBookings] = await Promise.all([
            this.prisma.user.findMany({
                where: { createdAt: { gte: sixMonthsAgo } },
                select: { createdAt: true },
            }),
            this.prisma.company.findMany({
                where: { createdAt: { gte: sixMonthsAgo } },
                select: { createdAt: true },
            }),
            this.prisma.booking.findMany({
                where: { createdAt: { gte: sixMonthsAgo } },
                select: {
                    createdAt: true,
                    status: true,
                    totalPrice: true,
                    service: { select: { serviceType: { select: { name: true } } } }
                },
            }),
        ]);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push({
                name: monthNames[d.getMonth()],
                monthKey: `${d.getFullYear()}-${d.getMonth()}`,
            });
        }
        const registrationTrend = months.map((m) => {
            const uCount = recentUsers.filter(u => `${u.createdAt.getFullYear()}-${u.createdAt.getMonth()}` === m.monthKey).length;
            const cCount = recentCompanies.filter(c => `${c.createdAt.getFullYear()}-${c.createdAt.getMonth()}` === m.monthKey).length;
            return { name: m.name, users: uCount, companies: cCount };
        });
        const monthlyData = months.map((m) => {
            const bks = recentBookings.filter(b => `${b.createdAt.getFullYear()}-${b.createdAt.getMonth()}` === m.monthKey);
            const rev = bks.filter(b => b.status === 'completed').reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
            return { name: m.name, revenue: rev, bookings: bks.length };
        });
        const statuses = await this.prisma.booking.groupBy({
            by: ['status'],
            _count: { id: true },
        });
        const statusBreakdown = statuses.map((s) => ({
            name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
            value: s._count.id,
            color: s.status === 'completed'
                ? '#10b981'
                : s.status === 'cancelled'
                    ? '#ef4444'
                    : '#f59e0b',
        }));
        const catMap = new Map();
        for (const b of recentBookings) {
            if (b.status === 'completed' && b.service?.serviceType?.name) {
                catMap.set(b.service.serviceType.name, (catMap.get(b.service.serviceType.name) || 0) + 1);
            }
        }
        const categoryData = Array.from(catMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        const serviceTypes = await this.prisma.serviceType.findMany({
            include: {
                services: {
                    select: {
                        companyId: true,
                    },
                },
            },
        });
        const satColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
        const categorySaturationData = serviceTypes.map((st, i) => {
            const uniqueCompanies = new Set(st.services.map((s) => s.companyId.toString()));
            const count = uniqueCompanies.size;
            let status = 'Balanced';
            if (count === 0)
                status = 'No Providers';
            else if (count < 2)
                status = 'High Demand';
            else if (count < 4)
                status = 'Growing';
            else
                status = 'Saturated';
            return {
                name: st.name,
                value: count,
                fill: satColors[i % satColors.length],
                status,
            };
        }).sort((a, b) => b.value - a.value).slice(0, 5);
        const thisMonthKey = months[5].monthKey;
        const lastMonthKey = months[4].monthKey;
        const usersThisMonth = recentUsers.filter(u => `${u.createdAt.getFullYear()}-${u.createdAt.getMonth()}` === thisMonthKey).length;
        const usersLastMonth = recentUsers.filter(u => `${u.createdAt.getFullYear()}-${u.createdAt.getMonth()}` === lastMonthKey).length;
        const usersGrowth = usersLastMonth ? Number(((usersThisMonth - usersLastMonth) / usersLastMonth * 100).toFixed(1)) : (usersThisMonth > 0 ? 100 : 0);
        const compThisMonth = recentCompanies.filter(c => `${c.createdAt.getFullYear()}-${c.createdAt.getMonth()}` === thisMonthKey).length;
        const compLastMonth = recentCompanies.filter(c => `${c.createdAt.getFullYear()}-${c.createdAt.getMonth()}` === lastMonthKey).length;
        const companiesGrowth = compLastMonth ? Number(((compThisMonth - compLastMonth) / compLastMonth * 100).toFixed(1)) : (compThisMonth > 0 ? 100 : 0);
        const revThisMonth = monthlyData[5].revenue;
        const revLastMonth = monthlyData[4].revenue;
        const revenueGrowth = revLastMonth ? Number(((revThisMonth - revLastMonth) / revLastMonth * 100).toFixed(1)) : (revThisMonth > 0 ? 100 : 0);
        const bksThisMonth = monthlyData[5].bookings;
        const bksLastMonth = monthlyData[4].bookings;
        const bookingsGrowth = bksLastMonth ? Number(((bksThisMonth - bksLastMonth) / bksLastMonth * 100).toFixed(1)) : (bksThisMonth > 0 ? 100 : 0);
        const weeklyStats = [];
        const today = new Date();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const startOfDay = new Date(d.setHours(0, 0, 0, 0));
            const endOfDay = new Date(d.setHours(23, 59, 59, 999));
            const [newUsersCount, bookingsCount] = await Promise.all([
                this.prisma.user.count({
                    where: { createdAt: { gte: startOfDay, lte: endOfDay } },
                }),
                this.prisma.booking.count({
                    where: { createdAt: { gte: startOfDay, lte: endOfDay } },
                }),
            ]);
            weeklyStats.push({
                day: dayNames[startOfDay.getDay()],
                newUsers: newUsersCount,
                bookings: bookingsCount,
            });
        }
        const companiesData = await this.prisma.company.findMany({
            include: {
                ratingSummary: true,
                _count: { select: { bookings: { where: { status: 'completed' } } } },
            },
            take: 5,
        });
        const topCompanies = await Promise.all(companiesData.map(async (c) => {
            const revenueAgg = await this.prisma.booking.aggregate({
                where: { companyId: c.id, status: 'completed' },
                _sum: { companyEarnings: true },
            });
            return {
                name: c.name,
                revenue: `$${Number(revenueAgg._sum.companyEarnings || 0)}`,
                rating: Number(c.ratingSummary?.averageRating || 0),
                completedJobs: c._count.bookings,
            };
        }));
        return {
            totalRevenue,
            platformRevenue,
            revenueGrowth,
            totalBookings,
            bookingsGrowth,
            activeBookings: totalBookings - completedBookings - cancelledBookings,
            totalUsers,
            usersGrowth,
            totalCompanies,
            pendingCompanies,
            companiesGrowth,
            avgBookingValue: totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0,
            conversionRate: 18.2,
            completedBookings,
            cancelledBookings,
            openTickets,
            monthlyData,
            statusBreakdown,
            categoryData,
            categorySaturationData,
            weeklyStats,
            topCompanies,
            registrationTrend,
            activeDisputes,
        };
    }
    async getUsers(query) {
        const { role, status, search, page = '1', limit = '10' } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const where = {};
        if (role)
            where.role = role;
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take,
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    role: true,
                    status: true,
                    lastLoginAt: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            success: true,
            data: users.map((u) => ({ ...u, id: u.id.toString() })),
            meta: { total, page: Number(page), limit: take },
        };
    }
    async getUserById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                ownedCompanies: {
                    select: { id: true, name: true, verificationStatus: true },
                },
            },
        });
        if (!user)
            throw new Error('User not found');
        const { passwordHash, ...userWithoutPassword } = user;
        return { user: { ...userWithoutPassword, id: user.id.toString() } };
    }
    async updateUser(id, dto) {
        const dataToUpdate = {};
        if (dto.fullName !== undefined)
            dataToUpdate.fullName = dto.fullName;
        if (dto.email !== undefined)
            dataToUpdate.email = dto.email;
        if (dto.phone !== undefined)
            dataToUpdate.phone = dto.phone;
        if (dto.role !== undefined)
            dataToUpdate.role = dto.role;
        if (dto.avatar !== undefined)
            dataToUpdate.avatar = dto.avatar;
        const user = await this.prisma.user.update({
            where: { id },
            data: dataToUpdate,
        });
        const { passwordHash, ...userWithoutPassword } = user;
        return {
            message: 'User updated',
            user: { ...userWithoutPassword, id: user.id.toString() },
        };
    }
    async setUserStatus(id, status, reason) {
        const user = await this.prisma.user.update({
            where: { id },
            data: { status: status },
        });
        return {
            message: `User status set to ${status}`,
            userId: user.id.toString(),
        };
    }
    async getCompanies(query) {
        const { status, search, page = '1', limit = '10' } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const where = {};
        if (status)
            where.verificationStatus = status;
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        const [companies, total] = await Promise.all([
            this.prisma.company.findMany({
                where,
                skip,
                take,
                include: {
                    owner: { select: { id: true, fullName: true, email: true } },
                    _count: { select: { staff: true } },
                    ratingSummary: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.company.count({ where }),
        ]);
        const companiesWithStats = await Promise.all(companies.map(async (c) => {
            const stats = await this.prisma.booking.aggregate({
                where: { companyId: c.id, status: 'completed' },
                _sum: { companyEarnings: true },
                _count: { id: true },
            });
            return {
                ...c,
                id: c.id.toString(),
                ownerId: c.ownerId.toString(),
                owner: { ...c.owner, id: c.owner.id.toString() },
                totalRevenue: Number(stats._sum.companyEarnings || 0),
                totalBookings: stats._count.id,
                rating: Number(c.ratingSummary?.averageRating || 5.0),
                staffCount: c._count.staff,
            };
        }));
        return {
            success: true,
            data: companiesWithStats,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
        };
    }
    async getCompanyDetails(id) {
        const company = await this.prisma.company.findUnique({
            where: { id: BigInt(id) },
            include: {
                owner: {
                    select: { id: true, fullName: true, email: true, phone: true },
                },
                staff: {
                    include: { user: { select: { fullName: true, email: true } } },
                },
                services: true,
                bookings: {
                    select: { id: true, totalPrice: true, status: true, createdAt: true },
                }
            },
        });
        if (!company) {
            throw new common_2.ConflictException('Company not found');
        }
        return {
            ...company,
            id: company.id.toString(),
            ownerId: company.ownerId.toString(),
            owner: {
                ...company.owner,
                id: company.owner.id.toString(),
            },
            staff: company.staff.map((s) => ({
                ...s,
                id: s.id.toString(),
                userId: s.userId.toString(),
                companyId: s.companyId?.toString(),
                user: s.user ? {
                    ...s.user,
                } : null,
            })),
            services: company.services.map((s) => ({
                ...s,
                id: s.id.toString(),
                companyId: s.companyId.toString(),
                basePrice: s.basePrice ? Number(s.basePrice) : 0,
            })),
            bookings: company.bookings.map((b) => ({
                id: b.id.toString(),
                totalPrice: b.totalPrice ? Number(b.totalPrice) : 0,
                status: b.status,
            }))
        };
    }
    async updateCompany(id, dto) {
        const dataToUpdate = {};
        if (dto.name !== undefined)
            dataToUpdate.name = dto.name;
        if (dto.description !== undefined)
            dataToUpdate.description = dto.description;
        if (dto.address !== undefined)
            dataToUpdate.address = dto.address;
        if (dto.city !== undefined)
            dataToUpdate.city = dto.city;
        if (dto.phone !== undefined)
            dataToUpdate.phone = dto.phone;
        if (dto.email !== undefined)
            dataToUpdate.email = dto.email;
        if (dto.logoUrl !== undefined)
            dataToUpdate.logoUrl = dto.logoUrl;
        if (dto.coverImageUrl !== undefined)
            dataToUpdate.coverImageUrl = dto.coverImageUrl;
        if (dto.verificationDocumentUrl !== undefined)
            dataToUpdate.verificationDocumentUrl = dto.verificationDocumentUrl;
        if (dto.registrationNumber !== undefined)
            dataToUpdate.registrationNumber = dto.registrationNumber;
        if (dto.establishedYear !== undefined)
            dataToUpdate.establishedYear = dto.establishedYear;
        if (dto.latitude !== undefined)
            dataToUpdate.latitude = dto.latitude;
        if (dto.longitude !== undefined)
            dataToUpdate.longitude = dto.longitude;
        if (dto.cardHighlights !== undefined)
            dataToUpdate.cardHighlights = dto.cardHighlights;
        if (dto.detailHighlights !== undefined)
            dataToUpdate.detailHighlights = dto.detailHighlights;
        const company = await this.prisma.company.update({
            where: { id },
            data: dataToUpdate,
        });
        if (dto.services !== undefined) {
            const existingServices = await this.prisma.service.findMany({
                where: { companyId: company.id },
            });
            const existingIds = existingServices.map((s) => s.id.toString());
            const payloadIds = dto.services.filter((s) => s.id).map((s) => s.id);
            const toDelete = existingIds.filter((id) => !payloadIds.includes(id));
            const toUpdate = dto.services.filter((s) => s.id);
            const toCreate = dto.services.filter((s) => !s.id);
            await this.prisma.$transaction(async (tx) => {
                if (toDelete.length > 0) {
                    await tx.service.deleteMany({
                        where: {
                            id: { in: toDelete.map((id) => BigInt(id)) },
                            companyId: company.id,
                        },
                    });
                }
                for (const s of toUpdate) {
                    await tx.service.update({
                        where: { id: BigInt(s.id) },
                        data: {
                            name: s.name,
                            serviceTypeId: BigInt(s.typeId),
                            basePrice: s.basePrice ?? 0,
                            durationMin: s.durationMin ?? 60,
                            description: s.description || null,
                        },
                    });
                }
                if (toCreate.length > 0) {
                    await tx.service.createMany({
                        data: toCreate.map((s) => ({
                            companyId: company.id,
                            serviceTypeId: BigInt(s.typeId),
                            name: s.name,
                            basePrice: s.basePrice ?? 0,
                            durationMin: s.durationMin ?? 60,
                            description: s.description || null,
                            isActive: true,
                        })),
                    });
                }
            });
        }
        return {
            message: 'Company updated',
            company: {
                ...company,
                id: company.id.toString(),
                ownerId: company.ownerId.toString(),
            },
        };
    }
    async setCompanyVerification(id, status, reason) {
        const company = await this.prisma.company.update({
            where: { id },
            data: { verificationStatus: status },
        });
        await this.notificationsService
            .notifyCompanyVerified(company.ownerId, company.name, status === 'verified')
            .catch((e) => console.warn('Notification failed (verify):', e?.message));
        return {
            message: `Company verification set to ${status}`,
            companyId: company.id.toString(),
        };
    }
    async expireCompanyTrial(id) {
        const company = await this.prisma.company.update({
            where: { id },
            data: {
                subscriptionStatus: 'expired',
                trialEndsAt: new Date(),
            },
        });
        return {
            message: 'Company trial expired',
            companyId: company.id.toString(),
        };
    }
    async suspendCompany(id) {
        const company = await this.prisma.company.update({
            where: { id },
            data: {
                subscriptionStatus: 'suspended',
            },
        });
        return {
            message: 'Company has been suspended',
            companyId: company.id.toString(),
        };
    }
    async getAllDisputes(query) {
        const { status, page = '1', limit = '10' } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const where = {};
        if (status)
            where.status = status;
        const [disputes, total] = await Promise.all([
            this.prisma.dispute.findMany({
                where,
                skip,
                take,
                include: {
                    customer: { select: { id: true, fullName: true } },
                    company: { select: { id: true, name: true } },
                    booking: { select: { id: true, totalPrice: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.dispute.count({ where }),
        ]);
        return {
            success: true,
            data: disputes.map((d) => ({
                ...d,
                bookingId: d.bookingId.toString(),
                customerId: d.customerId.toString(),
                companyId: d.companyId.toString(),
                customer: { ...d.customer, id: d.customer.id.toString() },
                company: { ...d.company, id: d.company.id.toString() },
                booking: { ...d.booking, id: d.booking.id.toString() },
            })),
            meta: { total, page: Number(page), limit: take },
        };
    }
    async resolveDispute(id, dto) {
        return this.prisma.$transaction(async (tx) => {
            const dispute = await tx.dispute.findUnique({
                where: { id },
            });
            if (!dispute)
                throw new common_2.NotFoundException('Dispute not found');
            const updatedDispute = await tx.dispute.update({
                where: { id },
                data: {
                    status: dto.status,
                    adminDecision: dto.adminDecision,
                    refundAmount: dto.refundAmount || 0,
                    resolvedAt: dto.status === 'resolved' || dto.status === 'closed'
                        ? new Date()
                        : null,
                },
            });
            if (dto.refundAmount && dto.refundAmount > 0) {
                await tx.transaction.create({
                    data: {
                        ownerType: 'company',
                        ownerId: dispute.companyId,
                        amount: -dto.refundAmount,
                        type: 'debit',
                        category: 'refund',
                        description: `Refund for dispute #${dispute.id} (Booking #${dispute.bookingId})`,
                        bookingId: dispute.bookingId,
                    },
                });
            }
            return {
                ...updatedDispute,
                bookingId: updatedDispute.bookingId.toString(),
                customerId: updatedDispute.customerId.toString(),
                companyId: updatedDispute.companyId.toString(),
            };
        });
    }
    async processRefund(paymentId, body) {
        const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment)
            throw new common_2.NotFoundException('Payment not found');
        const updatedPayment = await this.prisma.payment.update({
            where: { id: paymentId },
            data: { status: 'refunded' },
        });
        return {
            message: 'KHQR Refund marked as processed. Please ensure the transfer is completed via your banking gateway (e.g. ABA/Bakong).',
            paymentId: paymentId.toString(),
            status: updatedPayment.status,
        };
    }
    async getTransactions(query) {
        const { type, page = '1', limit = '50' } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const where = {};
        if (type && type !== 'all')
            where.type = type;
        const [transactions, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.transaction.count({ where }),
        ]);
        const bookingIds = transactions
            .map((t) => t.bookingId)
            .filter((id) => id !== null);
        const bookings = await this.prisma.booking.findMany({
            where: { id: { in: bookingIds } },
            include: {
                customer: { select: { fullName: true } },
                company: { select: { name: true } },
            },
        });
        const bookingMap = new Map(bookings.map((b) => [b.id.toString(), b]));
        return {
            data: transactions.map((t) => {
                const booking = t.bookingId ? bookingMap.get(t.bookingId.toString()) : null;
                return {
                    ...t,
                    id: t.id.toString(),
                    ownerId: t.ownerId.toString(),
                    bookingId: t.bookingId?.toString(),
                    amount: Number(t.amount),
                    booking,
                };
            }),
            meta: { total, page: Number(page), limit: take },
        };
    }
    async getPayouts(query) {
        const { status, page = '1', limit = '10' } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const where = {};
        if (status)
            where.status = status;
        const [payouts, total] = await Promise.all([
            this.prisma.payout.findMany({
                where,
                skip,
                take,
                include: {
                    company: {
                        include: {
                            owner: { select: { email: true } },
                            paymentMethods: true,
                        },
                    },
                    staff: {
                        include: {
                            user: { select: { fullName: true, email: true } },
                            paymentMethods: true,
                        },
                    },
                },
                orderBy: { requestedAt: 'desc' },
            }),
            this.prisma.payout.count({ where }),
        ]);
        return {
            success: true,
            data: payouts.map((p) => ({
                ...p,
                amount: p.amount ? p.amount.toString() : '0',
                companyId: p.companyId?.toString(),
                staffId: p.staffId?.toString(),
                company: p.company
                    ? {
                        ...p.company,
                        id: p.company.id.toString(),
                        ownerId: p.company.ownerId?.toString(),
                    }
                    : null,
                staff: p.staff
                    ? {
                        ...p.staff,
                        id: p.staff.id.toString(),
                        companyId: p.staff.companyId?.toString(),
                        userId: p.staff.userId?.toString(),
                    }
                    : null,
            })),
            meta: { total, page: Number(page), limit: take },
        };
    }
    async getInvoices(query) {
        const { page = '1', limit = '50', search } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const where = {};
        if (search) {
            where.invoiceNumber = { contains: search };
        }
        const [invoices, total] = await Promise.all([
            this.prisma.invoice.findMany({
                where,
                skip,
                take,
                include: {
                    booking: {
                        include: {
                            customer: true,
                            company: true,
                        },
                    },
                },
                orderBy: { issuedAt: 'desc' },
            }),
            this.prisma.invoice.count({ where }),
        ]);
        return {
            data: invoices.map((i) => ({
                ...i,
                id: i.id.toString(),
                bookingId: i.bookingId.toString(),
                totalAmount: Number(i.totalAmount),
                booking: {
                    ...i.booking,
                    id: i.booking.id.toString(),
                    customerId: i.booking.customerId.toString(),
                    companyId: i.booking.companyId.toString(),
                    customer: i.booking.customer ? {
                        ...i.booking.customer,
                        id: i.booking.customer.id.toString(),
                    } : null,
                    company: i.booking.company ? {
                        ...i.booking.company,
                        id: i.booking.company.id.toString(),
                        ownerId: i.booking.company.ownerId?.toString(),
                    } : null,
                },
            })),
            meta: { total, page: Number(page), limit: take },
        };
    }
    async updatePayoutStatus(id, status) {
        const payout = await this.prisma.payout.update({
            where: { id },
            data: {
                status,
                processedAt: status === 'completed' || status === 'failed' ? new Date() : null,
            },
        });
        return {
            message: `Payout marked as ${status}`,
            payout: { ...payout, companyId: payout.companyId?.toString() },
        };
    }
    async createCompanyAdmin(dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.ownerEmail },
        });
        if (existingUser) {
            throw new common_2.ConflictException('User with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(dto.ownerPassword, 10);
        const result = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    fullName: dto.ownerName,
                    email: dto.ownerEmail,
                    passwordHash: hashedPassword,
                    phone: dto.ownerPhone || null,
                    role: 'company_admin',
                },
            });
            const company = await tx.company.create({
                data: {
                    ownerId: user.id,
                    name: dto.companyName,
                    description: dto.companyDescription || null,
                    address: dto.companyAddress || null,
                    city: dto.companyCity || null,
                    phone: dto.companyPhone || null,
                    email: dto.companyEmail || dto.ownerEmail,
                    logoUrl: dto.logoUrl || null,
                    registrationNumber: dto.registrationNumber || null,
                    latitude: dto.latitude || null,
                    longitude: dto.longitude || null,
                    coverImageUrl: dto.coverImageUrl || null,
                    verificationDocumentUrl: dto.verificationDocumentUrl || null,
                    establishedYear: dto.establishedYear || null,
                    cardHighlights: dto.cardHighlights || [],
                    detailHighlights: dto.detailHighlights || [],
                    verificationStatus: 'verified',
                },
            });
            let createdServices = [];
            if (dto.services && dto.services.length > 0) {
                await tx.service.createMany({
                    data: dto.services.map((s) => ({
                        companyId: company.id,
                        serviceTypeId: BigInt(s.typeId),
                        name: s.name,
                        basePrice: s.basePrice || 0,
                        durationMin: s.durationMin || 60,
                        description: s.description || null,
                        isActive: true,
                    })),
                });
                createdServices = await tx.service.findMany({
                    where: { companyId: company.id },
                });
            }
            else if (dto.serviceName && dto.serviceTypeId) {
                const service = await tx.service.create({
                    data: {
                        companyId: company.id,
                        serviceTypeId: BigInt(dto.serviceTypeId),
                        name: dto.serviceName,
                        basePrice: dto.serviceBasePrice || 0,
                        durationMin: dto.serviceDurationMin || 60,
                        description: dto.serviceDescription || null,
                        isActive: true,
                    },
                });
                createdServices.push(service);
            }
            return { user, company, createdServices };
        });
        return {
            message: 'Company and admin created successfully',
            companyId: result.company.id.toString(),
            ownerId: result.user.id.toString(),
            servicesCount: result.createdServices.length,
        };
    }
    async getEmailTemplates() {
        const templates = await this.prisma.emailTemplate.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return {
            success: true,
            data: templates,
        };
    }
    async createEmailTemplate(dto) {
        const template = await this.prisma.emailTemplate.create({
            data: {
                templateId: dto.templateId,
                name: dto.name,
                description: dto.description,
                subject: dto.subject,
                body: dto.body,
                variables: dto.variables || [],
                status: dto.status || 'active',
            },
        });
        return {
            success: true,
            data: template,
            message: 'Template created successfully',
        };
    }
    async updateEmailTemplate(id, dto) {
        const template = await this.prisma.emailTemplate.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                subject: dto.subject,
                body: dto.body,
                variables: dto.variables,
                status: dto.status,
            },
        });
        return {
            success: true,
            data: template,
            message: 'Template updated successfully',
        };
    }
    async seedEmailTemplates() {
        const defaultTemplates = [
            {
                templateId: "welcome",
                name: "Welcome Email",
                description: "Sent when a user signs up",
                subject: "Welcome to ServiceFinder, {{user_name}}!",
                body: "Hi {{user_name}},\n\nWelcome to ServiceFinder! We're thrilled to have you on board.\n\nBest,\nThe ServiceFinder Team",
                variables: ["user_name", "company_name", "login_url"],
                status: "active"
            },
            {
                templateId: "password_reset",
                name: "Password Reset",
                description: "Sent when a user requests a password reset",
                subject: "Reset Your Password - ServiceFinder",
                body: "Hi {{user_name}},\n\nWe received a request to reset your password. Click the link below to choose a new one:\n\n{{reset_url}}\n\nIf you did not request this, please ignore this email.\n\nBest,\nThe ServiceFinder Team",
                variables: ["user_name", "reset_url", "expiry_time"],
                status: "active"
            }
        ];
        for (const t of defaultTemplates) {
            await this.prisma.emailTemplate.upsert({
                where: { templateId: t.templateId },
                update: {},
                create: t,
            });
        }
        return {
            success: true,
            message: 'Templates seeded successfully',
        };
    }
    async testEmailTemplate(dto) {
        let subject = dto.subject || 'Test Email';
        let body = dto.body || 'This is a test email.';
        const dummyVariables = {
            user_name: 'John Doe',
            company_name: 'Test Company',
            reset_url: 'https://example.com/reset',
            expiry_time: '15 minutes',
            login_url: 'https://example.com/login',
            date: '2023-10-25',
            time: '14:00'
        };
        if (dto.variables && Array.isArray(dto.variables)) {
            dto.variables.forEach((v) => {
                const value = dummyVariables[v] || `[${v}]`;
                const regex = new RegExp(`{{${v}}}`, 'g');
                subject = subject.replace(regex, value);
                body = body.replace(regex, value);
            });
        }
        const testToEmail = dto.testEmail || 'admin@servicefinder.test';
        const text = body.replace(/<[^>]+>/g, '');
        try {
            await this.mailService.sendMail(testToEmail, subject, text, body);
            return {
                success: true,
                message: 'Test email logic triggered and email sent',
                preview: { subject, body }
            };
        }
        catch (e) {
            return {
                success: false,
                message: 'Failed to send test email: ' + e.message,
                preview: { subject, body }
            };
        }
    }
    async getBroadcasts() {
        return this.prisma.broadcast.findMany({
            orderBy: { sentAt: 'desc' },
        });
    }
    async createBroadcast(dto) {
        let sentCount = 0;
        let targetUserIds = [];
        if (dto.audience === 'all') {
            const users = await this.prisma.user.findMany({
                where: { status: 'active' },
                select: { id: true },
            });
            targetUserIds = users.map((u) => u.id);
        }
        else if (dto.audience === 'companies') {
            const companies = await this.prisma.company.findMany({
                select: { ownerId: true },
            });
            targetUserIds = companies.map((c) => c.ownerId);
        }
        else if (dto.audience === 'customers') {
            const users = await this.prisma.user.findMany({
                where: { role: 'customer', status: 'active' },
                select: { id: true },
            });
            targetUserIds = users.map((u) => u.id);
        }
        sentCount = targetUserIds.length;
        const broadcast = await this.prisma.broadcast.create({
            data: {
                title: dto.title,
                message: dto.message,
                audience: dto.audience,
                sentCount,
                openRate: Math.floor(Math.random() * 30) + 40,
                status: 'sent',
            },
        });
        if (targetUserIds.length > 0) {
            await this.prisma.notification.createMany({
                data: targetUserIds.map((userId) => ({
                    userId,
                    title: dto.title,
                    body: dto.message,
                    type: 'broadcast',
                    isRead: false,
                })),
            });
        }
        return broadcast;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        mail_service_1.MailService])
], AdminService);
//# sourceMappingURL=admin.service.js.map