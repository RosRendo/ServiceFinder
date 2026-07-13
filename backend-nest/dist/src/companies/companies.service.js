"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const settings_service_1 = require("../settings/settings.service");
let CompaniesService = class CompaniesService {
    prisma;
    mailService;
    settingsService;
    constructor(prisma, mailService, settingsService) {
        this.prisma = prisma;
        this.mailService = mailService;
        this.settingsService = settingsService;
    }
    async getAllCompanies(query) {
        const { status, city, search, categoryId, minPrice, maxPrice, rating, distance, page = 1, limit = 10, lat, lng, } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.verificationStatus = status;
        if (city)
            where.city = city;
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
            const priceFilter = {};
            if (minPrice)
                priceFilter.gte = parseFloat(minPrice);
            if (maxPrice)
                priceFilter.lte = parseFloat(maxPrice);
            const serviceFilter = { some: { basePrice: priceFilter } };
            if (where.services) {
                where.services.some = {
                    ...where.services.some,
                    basePrice: priceFilter,
                };
            }
            else {
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
        if (lat && lng) {
            const userLat = parseFloat(lat);
            const userLng = parseFloat(lng);
            const toRad = (value) => (value * Math.PI) / 180;
            companies.forEach((company) => {
                if (company.latitude !== null && company.longitude !== null) {
                    const R = 6371;
                    const dLat = toRad(company.latitude - userLat);
                    const dLng = toRad(company.longitude - userLng);
                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(toRad(userLat)) *
                            Math.cos(toRad(company.latitude)) *
                            Math.sin(dLng / 2) *
                            Math.sin(dLng / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    company.distance = R * c;
                }
                else {
                    company.distance = 999999;
                }
            });
            companies.sort((a, b) => a.distance - b.distance);
            if (distance) {
                const maxDist = parseFloat(distance);
                companies = companies.filter((c) => c.distance <= maxDist);
            }
        }
        else {
            companies.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        const total = companies.length;
        const paginatedCompanies = companies.slice(parseInt(skip.toString()), parseInt(skip.toString()) + parseInt(limit.toString()));
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
    async getCompanyById(id) {
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
            throw new common_1.NotFoundException('Company not found');
        }
        return company;
    }
    async createCompany(userId, dto) {
        const existingCompany = await this.prisma.company.findFirst({
            where: { ownerId: userId },
        });
        if (existingCompany) {
            throw new common_1.ConflictException('User already has a company');
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
    async updateCompany(id, userId, role, updates) {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        if (company.ownerId !== userId && role !== 'admin') {
            throw new common_1.ForbiddenException('Access denied');
        }
        const updateData = { ...updates };
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
    async deleteCompany(id, userId, role) {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        if (company.ownerId !== userId && role !== 'admin') {
            throw new common_1.ForbiddenException('Access denied');
        }
        await this.prisma.company.delete({ where: { id } });
        return { message: 'Company deleted successfully' };
    }
    async getMyCompany(userId) {
        const company = await this.prisma.company.findFirst({
            where: { ownerId: userId },
            include: {
                services: { where: { isActive: true } },
                serviceAreas: true,
                ratingSummary: true,
            },
        });
        if (!company) {
            throw new common_1.NotFoundException('You do not own a company');
        }
        return company;
    }
    async getMyCompanyMetrics(userId) {
        const company = await this.prisma.company.findFirst({
            where: { ownerId: userId },
            include: { ratingSummary: true },
        });
        if (!company) {
            throw new common_1.NotFoundException('You do not own a company');
        }
        const companyId = company.id;
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 7);
        const [allBookings, weeklyBookings, recentActivity] = await Promise.all([
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
        ]);
        let totalRevenue = 0;
        let activeBookings = 0;
        let completedCount = 0;
        let totalNonPendingOrCancelled = 0;
        const serviceCounts = {};
        const statusCounts = {
            pending: 0,
            confirmed: 0,
            in_progress: 0,
            completed: 0,
            cancelled: 0,
        };
        for (const b of allBookings) {
            if (statusCounts[b.status] !== undefined) {
                statusCounts[b.status]++;
            }
            else {
                statusCounts[b.status] = 1;
            }
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
        const completionRate = totalNonPendingOrCancelled > 0
            ? Math.round((completedCount / totalNonPendingOrCancelled) * 100)
            : 100;
        const serviceBreakdown = Object.entries(serviceCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
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
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayLabel = days[d.getDay()][0];
            const revenueForDay = weeklyBookings
                .filter((b) => new Date(b.updatedAt).toDateString() === d.toDateString())
                .reduce((sum, b) => sum + Number(b.companyEarnings), 0);
            weeklyData.push({
                day: dayLabel,
                value: revenueForDay,
                label: dayLabel,
                latest: i === 0,
            });
        }
        const maxRev = Math.max(...weeklyData.map((d) => d.value), 1);
        const normalizedWeeklyData = weeklyData.map((d) => ({
            ...d,
            value: (d.value / maxRev) * 100,
            actualValue: d.value,
        }));
        const monthlyData = [];
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
            }
            else if (log.newStatus === 'completed') {
                icon = 'check-circle';
                iconColor = '#22c55e';
                iconBg = 'bg-green-100';
                title = `Job completed by ${log.booking.assignedStaff?.user.fullName || 'Staff'}`;
            }
            else if (log.newStatus === 'confirmed') {
                icon = 'calendar-check';
                iconColor = '#1ba9ed';
                iconBg = 'bg-blue-100';
                title = `Booking confirmed`;
            }
            else if (log.newStatus === 'in_progress') {
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
    async getMyCompanyStaff(userId) {
        const company = await this.prisma.company.findFirst({
            where: { ownerId: userId },
        });
        if (!company) {
            throw new common_1.NotFoundException('You do not own a company');
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
            const avgRating = validReviews.length > 0
                ? validReviews.reduce((acc, r) => acc + Number(r.staffRating), 0) /
                    validReviews.length
                : null;
            const isAvailable = s.status === 'active';
            return {
                id: s.id.toString(),
                userId: s.userId.toString(),
                fullName: s.user.fullName,
                email: s.user.email,
                avatar: s.user.avatar,
                phone: s.user.phone,
                role: s.role,
                status: s.status,
                activeRequests: s._count.assignedRequests,
                completedJobs: s._count.assignedBookings,
                averageRating: avgRating ? Number(avgRating.toFixed(1)) : null,
                totalReviews: s.reviews.length,
                isAvailable,
                joinedAt: s.createdAt.toISOString(),
                walletBalance: s.walletBalance ? Number(s.walletBalance) : 0,
                creditLimit: s.creditLimit ? Number(s.creditLimit) : 0,
            };
        });
    }
    async getStaffMemberById(staffId, userId) {
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
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
        if (staff.company.ownerId !== userId)
            throw new common_1.ForbiddenException('Access denied');
        const validReviews = staff.reviews.filter((r) => r.staffRating !== null);
        const avgRating = validReviews.length > 0
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
    async addStaffMember(userId, dto) {
        const company = await this.prisma.company.findFirst({
            where: { ownerId: userId },
        });
        if (!company)
            throw new common_1.NotFoundException('You do not own a company');
        let user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        let defaultPassword = null;
        if (!user) {
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
            throw new common_1.ConflictException('User is already a staff member');
        }
        const staff = await this.prisma.companyStaff.create({
            data: {
                companyId: company.id,
                userId: user.id,
                role: dto.role || 'cleaner',
                status: 'active',
            },
        });
        if (defaultPassword && user.email) {
            try {
                await this.mailService.sendStaffWelcomeEmail(user.email, defaultPassword, company.name, user.fullName);
            }
            catch (emailError) {
                console.error('Failed to send staff welcome email:', emailError);
            }
        }
        return {
            message: 'Staff added successfully',
            staff: {
                id: staff.id.toString(),
                userId: staff.userId.toString(),
                role: staff.role,
            },
            defaultPassword,
        };
    }
    async updateStaffMember(staffId, userId, updates) {
        const staff = await this.prisma.companyStaff.findUnique({
            where: { id: staffId },
            include: { company: true },
        });
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
        if (staff.company.ownerId !== userId)
            throw new common_1.ForbiddenException('Access denied');
        await this.prisma.companyStaff.update({
            where: { id: staffId },
            data: {
                role: updates.role,
                status: updates.status,
            },
        });
        return { success: true };
    }
    async removeStaffMember(staffId, userId) {
        const staff = await this.prisma.companyStaff.findUnique({
            where: { id: staffId },
            include: { company: true },
        });
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
        if (staff.company.ownerId !== userId)
            throw new common_1.ForbiddenException('Access denied');
        await this.prisma.companyStaff.update({
            where: { id: staffId },
            data: { status: 'inactive' },
        });
        return { success: true };
    }
    async reactivateStaffMember(staffId, userId) {
        const staff = await this.prisma.companyStaff.findUnique({
            where: { id: staffId },
            include: { company: true },
        });
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
        if (staff.company.ownerId !== userId)
            throw new common_1.ForbiddenException('Access denied');
        await this.prisma.companyStaff.update({
            where: { id: staffId },
            data: { status: 'active' },
        });
        return { success: true };
    }
    async getStaffWallet(staffId, userId, role) {
        const staff = await this.prisma.companyStaff.findUnique({
            where: { id: staffId },
            include: { company: true },
        });
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
        if (role === 'staff' && staff.userId !== userId) {
            throw new common_1.ForbiddenException('You can only view your own wallet');
        }
        else if (role === 'company_admin' && staff.company.ownerId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
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
    async topUpStaffWallet(staffId, userId, body) {
        const amount = Number(body.amount);
        if (isNaN(amount) || amount <= 0) {
            throw new common_1.BadRequestException('Invalid top-up amount');
        }
        const staff = await this.prisma.companyStaff.findUnique({
            where: { id: staffId },
            include: { company: true, user: true },
        });
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
        if (staff.company.ownerId !== userId)
            throw new common_1.ForbiddenException('Access denied');
        const updated = await this.prisma.$transaction(async (tx) => {
            await tx.walletTransaction.create({
                data: {
                    staffId,
                    amount,
                    type: 'credit',
                    description: body.description || 'Manual wallet top-up by company admin',
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
    async getMyCompanyCampaigns(userId) {
        const company = await this.prisma.company.findFirst({
            where: { ownerId: userId },
            select: { id: true },
        });
        if (!company) {
            throw new common_1.NotFoundException('You do not own a company');
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
    async getFeaturedCompanies(query) {
        const { limit = 6, sortBy = 'rating' } = query;
        const take = parseInt(limit.toString());
        const orderBy = sortBy === 'rating'
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
    async getNearbyCompanies(query) {
        const { lat, lng, radius = 5, limit = 12 } = query;
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
    async getNewCompanies(query) {
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
    async getRecommendedCompanies(query) {
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
            orderBy: { ratingSummary: { totalReviews: 'desc' } },
        });
        return { data: this.formatCompanies(companies) };
    }
    async getCompaniesByCategory(categorySlug, query) {
        const { page = 1, limit = 20, search, city, sortBy } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const category = await this.prisma.category.findUnique({
            where: { slug: categorySlug },
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        const companyDebtLimit = parseFloat(await this.settingsService.getSetting('COMPANY_DEBT_LIMIT', '-200'));
        const where = {
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
        if (city)
            where.city = { contains: city };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        const orderBy = sortBy === 'rating'
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
    async getCompaniesByServiceType(categorySlug, serviceTypeSlug, query) {
        const { page = 1, limit = 20, search, city, sortBy } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const category = await this.prisma.category.findUnique({
            where: { slug: categorySlug },
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        const serviceType = await this.prisma.serviceType.findUnique({
            where: { slug: serviceTypeSlug },
        });
        if (!serviceType) {
            throw new common_1.NotFoundException('Service Type not found');
        }
        const companyDebtLimit = parseFloat(await this.settingsService.getSetting('COMPANY_DEBT_LIMIT', '-200'));
        const where = {
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
        if (city)
            where.city = { contains: city };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        const orderBy = sortBy === 'rating'
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
        const [totalUsers, newUsersThisWeek, totalCompanies, pendingCompanies, totalBookings, activeBookings, totalRevenueRaw, recentUsersRaw, categoriesData, bookingsLastYear, usersLastYear, bookingsData,] = await Promise.all([
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
            const bookings = c.serviceTypes.reduce((acc, st) => acc + st.services.reduce((acc2, s) => acc2 + s._count.bookings, 0), 0);
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
        const buckets = [];
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
            const bucket = buckets.find((bkt) => bkt.monthIndex === m && bkt.year === y);
            if (bucket)
                bucket.bookingCount++;
        });
        usersLastYear.forEach((u) => {
            const m = u.createdAt.getMonth();
            const y = u.createdAt.getFullYear();
            const bucket = buckets.find((bkt) => bkt.monthIndex === m && bkt.year === y);
            if (bucket)
                bucket.userCount++;
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
        const [totalUsers, totalCompanies, pendingCompanies, totalBookings, activeBookings, completedBookings, cancelledBookings, totalRevenueRaw, categoriesData, topCompaniesData,] = await Promise.all([
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
        const categoryData = categoriesData
            .map((c) => {
            const bookings = c.serviceTypes.reduce((acc, st) => acc + st.services.reduce((acc2, s) => acc2 + s._count.bookings, 0), 0);
            return { name: c.name, value: bookings };
        })
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        const topCompanies = topCompaniesData
            .map((c) => {
            const revenue = c.bookings.reduce((sum, b) => sum + Number(b.payment?.amount || 0), 0);
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
            { name: 'Completed', value: completedBookings, color: '#10B981' },
            { name: 'Active', value: activeBookings, color: '#3B82F6' },
            {
                name: 'Pending',
                value: totalBookings -
                    activeBookings -
                    completedBookings -
                    cancelledBookings,
                color: '#F59E0B',
            },
            { name: 'Cancelled', value: cancelledBookings, color: '#EF4444' },
        ].filter((s) => s.value > 0);
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
                revenueGrowth: 15,
                totalBookings,
                bookingsGrowth: 12,
                totalUsers,
                usersGrowth: 8,
                totalCompanies,
                pendingCompanies,
                activeBookings,
                completedBookings,
                cancelledBookings,
                avgBookingValue: totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0,
                conversionRate: 64,
                monthlyData,
                statusBreakdown,
                weeklyStats,
                categoryData,
                topCompanies,
            },
        };
    }
    async getCompanySubscription(userId) {
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
            throw new common_1.NotFoundException('Company not found');
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
    async upgradeSubscription(userId, planId) {
        const company = await this.prisma.company.findFirst({
            where: { ownerId: userId },
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
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
    formatCompanies(companies) {
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
    async addStaffAvailability(userId, staffId, dto) {
        const company = await this.prisma.company.findFirst({ where: { ownerId: userId } });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        const staff = await this.prisma.companyStaff.findFirst({
            where: { id: staffId, companyId: company.id },
        });
        if (!staff)
            throw new common_1.NotFoundException('Staff not found');
        const date = new Date(dto.date);
        const startTime = new Date(dto.startTime);
        const endTime = new Date(dto.endTime);
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
    async generateStaffAvailability(userId, staffId, dto) {
        const company = await this.prisma.company.findFirst({ where: { ownerId: userId } });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        const staff = await this.prisma.companyStaff.findFirst({
            where: { id: staffId, companyId: company.id },
        });
        if (!staff)
            throw new common_1.NotFoundException('Staff not found');
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new common_1.BadRequestException('Invalid date format');
        }
        const slots = [];
        const daysOff = dto.daysOff || [0, 6];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            if (daysOff.includes(d.getDay()))
                continue;
            const currentDate = new Date(d);
            const baseStart = new Date(dto.startTime);
            const startTime = new Date(currentDate);
            startTime.setUTCHours(baseStart.getUTCHours(), baseStart.getUTCMinutes(), 0, 0);
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
    async getStaffAvailability(userId, staffId, startDateStr, endDateStr) {
        const company = await this.prisma.company.findFirst({ where: { ownerId: userId } });
        let companyId = company?.id;
        if (!companyId) {
            const userStaff = await this.prisma.companyStaff.findFirst({ where: { userId } });
            if (userStaff) {
                companyId = userStaff.companyId;
            }
        }
        if (!companyId)
            throw new common_1.NotFoundException('Company not found');
        const staff = await this.prisma.companyStaff.findFirst({
            where: { id: staffId, companyId },
        });
        if (!staff)
            throw new common_1.NotFoundException('Staff not found');
        const where = { staffId };
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
        return slots.map(s => ({
            ...s,
            id: s.id.toString(),
            companyId: s.companyId.toString(),
            staffId: s.staffId?.toString(),
        }));
    }
    async removeStaffAvailability(userId, slotId) {
        const company = await this.prisma.company.findFirst({ where: { ownerId: userId } });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        const slot = await this.prisma.availabilitySlot.findFirst({
            where: { id: slotId, companyId: company.id },
        });
        if (!slot)
            throw new common_1.NotFoundException('Slot not found');
        await this.prisma.availabilitySlot.delete({ where: { id: slotId } });
        return { message: 'Slot deleted successfully' };
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService,
        settings_service_1.SettingsService])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map