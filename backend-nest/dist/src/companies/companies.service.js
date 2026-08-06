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
    async getCompanyCustomers(companyId, query) {
        const { page = 1, limit = 10, search } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {
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
            const activeDisputes = bookings.filter((b) => b.dispute && b.dispute.status !== 'resolved').length;
            const sortedBookings = [...bookings].sort((a, b) => b.bookingDate.getTime() - a.bookingDate.getTime());
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
    async getCompanyCustomerDetail(companyId, customerId) {
        const user = await this.prisma.user.findFirst({
            where: {
                id: customerId,
                bookingsAsCustomer: {
                    some: { companyId },
                },
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                avatar: true,
                status: true,
                createdAt: true,
                bookingsAsCustomer: {
                    where: { companyId },
                    select: {
                        id: true,
                        totalPrice: true,
                        status: true,
                        bookingDate: true,
                        startTime: true,
                        endTime: true,
                        service: { select: { name: true, serviceType: { select: { category: { select: { name: true } } } } } },
                        assignedStaff: { select: { user: { select: { fullName: true } } } },
                        dispute: { select: { id: true, status: true, description: true, createdAt: true } },
                        conversations: {
                            take: 1,
                            select: { id: true }
                        }
                    },
                    orderBy: { bookingDate: 'desc' },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Customer not found for this company');
        }
        const bookings = user.bookingsAsCustomer;
        const totalBookings = bookings.length;
        const ltv = bookings
            .filter((b) => b.status === 'completed')
            .reduce((sum, b) => sum + Number(b.totalPrice), 0);
        const activeDisputes = bookings.filter((b) => b.dispute && b.dispute.status !== 'resolved').length;
        const lastActivity = bookings.length > 0 ? bookings[0].bookingDate : null;
        return {
            id: user.id.toString(),
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            profilePictureUrl: user.avatar,
            status: user.status,
            memberSince: user.createdAt,
            stats: {
                totalBookings,
                ltv,
                activeDisputes,
                lastActivity,
            },
            bookings: bookings.map(b => ({
                id: b.id.toString(),
                serviceName: b.service?.name,
                serviceCategory: b.service?.serviceType?.category?.name,
                date: b.bookingDate,
                startTime: b.startTime,
                endTime: b.endTime,
                status: b.status,
                amount: b.totalPrice,
                staffName: b.assignedStaff?.user?.fullName || null,
                dispute: b.dispute ? { id: b.dispute.id.toString(), status: b.dispute.status, reason: b.dispute.description } : null,
                hasMessages: b.conversations.length > 0
            }))
        };
    }
    async getCompanyReviews(companyId, query) {
        const { page = 1, limit = 10, search } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {
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
            status: 'visible',
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
    async getCompanyReviewDetail(companyId, reviewId) {
        const review = await this.prisma.review.findFirst({
            where: {
                id: reviewId,
                booking: { companyId },
            },
            include: {
                customer: { select: { fullName: true, avatar: true, email: true, phone: true } },
                staff: { include: { user: { select: { fullName: true, avatar: true } } } },
                booking: { include: { service: true, dispute: true } },
            },
        });
        if (!review) {
            throw new common_1.NotFoundException('Review not found');
        }
        return {
            id: review.id.toString(),
            customer: {
                name: review.customer?.fullName || 'Unknown',
                email: review.customer?.email,
                phone: review.customer?.phone,
                avatar: review.customer?.avatar,
            },
            staff: {
                name: review.staff?.user?.fullName || 'Unassigned',
                avatar: review.staff?.user?.avatar,
            },
            booking: {
                id: review.booking.id.toString(),
                date: review.booking.bookingDate,
                service: review.booking.service?.name,
                amount: review.booking.totalPrice,
            },
            rating: review.companyRating,
            text: review.companyComment || 'No comment provided.',
            staffRating: review.staffRating,
            staffText: review.staffComment,
            date: review.createdAt.toISOString(),
            status: 'visible',
            dispute: review.booking.dispute ? {
                id: review.booking.dispute.id.toString(),
                status: review.booking.dispute.status,
                reason: review.booking.dispute.description,
                createdAt: review.booking.dispute.createdAt
            } : null
        };
    }
    async getCompanyRevenue(companyId) {
        const [bookings, transactions, services, staffMembers] = await Promise.all([
            this.prisma.booking.findMany({
                where: { companyId, status: 'completed' },
                select: {
                    totalPrice: true,
                    companyEarnings: true,
                    platformFee: true,
                    bookingDate: true,
                    assignedStaffId: true,
                    serviceId: true,
                },
                orderBy: { bookingDate: 'asc' }
            }),
            this.prisma.booking.findMany({
                where: { companyId },
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    customer: { select: { fullName: true } },
                    assignedStaff: { select: { user: { select: { fullName: true } } } },
                    payment: { select: { method: true } }
                }
            }),
            this.prisma.service.findMany({ where: { companyId }, select: { id: true, name: true } }),
            this.prisma.companyStaff.findMany({
                where: { companyId },
                include: {
                    user: { select: { fullName: true, avatar: true } },
                    reviews: { select: { staffRating: true } }
                }
            })
        ]);
        let totalGross = 0;
        let totalPlatformFee = 0;
        let totalNet = 0;
        const mappedTransactions = transactions.map(t => ({
            id: "BK-" + t.id.toString(),
            date: t.bookingDate.toISOString(),
            customer: t.customer?.fullName || 'Unknown',
            staff: t.assignedStaff?.user?.fullName || 'Unassigned',
            gross: Number(t.totalPrice || 0),
            fee: Number(t.platformFee || 0),
            net: Number(t.companyEarnings || 0),
            payment: t.payment?.method || 'Unknown',
            status: t.status
        }));
        const serviceRevenue = {};
        const staffRevenue = {};
        const staffJobs = {};
        const trendMap = {};
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            trendMap[dayName] = { gross: 0, net: 0 };
        }
        for (const b of bookings) {
            const gross = Number(b.totalPrice || 0);
            const net = Number(b.companyEarnings || 0);
            const fee = Number(b.platformFee || 0);
            totalGross += gross;
            totalNet += net;
            totalPlatformFee += fee;
            const dayName = b.bookingDate.toLocaleDateString('en-US', { weekday: 'short' });
            if (trendMap[dayName]) {
                trendMap[dayName].gross += gross;
                trendMap[dayName].net += net;
            }
            if (b.serviceId) {
                serviceRevenue[b.serviceId.toString()] = (serviceRevenue[b.serviceId.toString()] || 0) + gross;
            }
            if (b.assignedStaffId) {
                staffRevenue[b.assignedStaffId.toString()] = (staffRevenue[b.assignedStaffId.toString()] || 0) + gross;
                staffJobs[b.assignedStaffId.toString()] = (staffJobs[b.assignedStaffId.toString()] || 0) + 1;
            }
        }
        const staffPayout = totalNet * 0.6;
        const profit = totalNet - staffPayout;
        const kpis = [
            { label: "Gross Revenue", value: "$" + totalGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), up: true, pct: "12%" },
            { label: "Net Revenue", value: "$" + totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), up: true, pct: "8%" },
            { label: "Profit", value: "$" + profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), up: true, pct: "15%" },
            { label: "Avg Booking", value: "$" + (bookings.length ? totalGross / bookings.length : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), up: true, pct: "3%" },
        ];
        const trendData = Object.keys(trendMap).map(day => ({
            day,
            gross: trendMap[day].gross,
            net: trendMap[day].net
        }));
        const serviceData = Object.keys(serviceRevenue).map(sId => {
            const svc = services.find(s => s.id.toString() === sId);
            const rev = serviceRevenue[sId];
            return {
                name: svc ? svc.name : 'Unknown Service',
                revenue: rev,
                percentage: totalGross > 0 ? (rev / totalGross) * 100 : 0
            };
        }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
        const staffData = Object.keys(staffRevenue).map(sId => {
            const stf = staffMembers.find(s => s.id.toString() === sId);
            const rev = staffRevenue[sId];
            const jobs = staffJobs[sId];
            let rating = 0;
            if (stf && stf.reviews && stf.reviews.length > 0) {
                rating = stf.reviews.reduce((acc, r) => acc + (r.staffRating || 0), 0) / stf.reviews.length;
            }
            return {
                id: sId,
                name: stf?.user?.fullName || 'Unknown Staff',
                avatar: stf?.user?.avatar || '',
                jobs: jobs,
                revenue: rev,
                rating: Number(rating.toFixed(1))
            };
        }).sort((a, b) => b.revenue - a.revenue).map((s, i) => ({
            ...s,
            badge: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
        }));
        const breakdown = {
            gross: totalGross,
            platformFee: totalPlatformFee,
            staffPayout: staffPayout,
            discounts: 0,
            refunds: 0,
            net: totalNet
        };
        return {
            kpis,
            trendData,
            breakdown,
            serviceData,
            staffData,
            transactions: mappedTransactions
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
        if (updates.coverageRadiusKm !== undefined) {
            const radius = updates.coverageRadiusKm ? Number(updates.coverageRadiusKm) : 15;
            const serviceArea = await this.prisma.serviceArea.findFirst({
                where: { companyId: id },
            });
            if (serviceArea) {
                await this.prisma.serviceArea.update({
                    where: { id: serviceArea.id },
                    data: { coverageRadiusKm: radius, city: updates.city || company.city || 'Phnom Penh' },
                });
            }
            else {
                await this.prisma.serviceArea.create({
                    data: {
                        companyId: id,
                        city: updates.city || company.city || 'Phnom Penh',
                        coverageRadiusKm: radius,
                    },
                });
            }
            delete updateData.coverageRadiusKm;
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
        const [allBookings, weeklyBookings, recentActivity, escrowResult, completedEarnings, paidPayouts] = await Promise.all([
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
        const escrowBalance = Number(company.pendingBalance);
        const availableBalance = Number(company.availableBalance);
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
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const prevMonthBookings = await this.prisma.booking.findMany({
            where: {
                companyId,
                status: 'completed',
                updatedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
            },
            select: { companyEarnings: true },
        });
        const currMonthRevenue = monthlyBookings.reduce((sum, b) => sum + Number(b.companyEarnings), 0);
        const prevMonthRevenue = prevMonthBookings.reduce((sum, b) => sum + Number(b.companyEarnings), 0);
        const currMonthCount = monthlyBookings.length;
        const prevMonthCount = prevMonthBookings.length;
        const revenueGrowth = prevMonthRevenue > 0
            ? Number((((currMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(1))
            : (currMonthRevenue > 0 ? 100 : 0);
        const bookingsGrowth = prevMonthCount > 0
            ? Number((((currMonthCount - prevMonthCount) / prevMonthCount) * 100).toFixed(1))
            : (currMonthCount > 0 ? 100 : 0);
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
        const avgRatingVal = company.ratingSummary?.averageRating ? Number(company.ratingSummary.averageRating) : 4.5;
        const radarBase = avgRatingVal * 25;
        const qualityRadar = [
            { subject: 'Punctuality', A: Math.round(radarBase + (Math.random() * 10 - 5)), B: 110, fullMark: 150 },
            { subject: 'Communication', A: Math.round(radarBase + (Math.random() * 10 - 5)), B: 110, fullMark: 150 },
            { subject: 'Cleanliness', A: Math.round(radarBase + (Math.random() * 10 - 5)), B: 110, fullMark: 150 },
            { subject: 'Expertise', A: Math.round(radarBase + (Math.random() * 10 - 5)), B: 110, fullMark: 150 },
            { subject: 'Value', A: Math.round(radarBase + (Math.random() * 10 - 5)), B: 110, fullMark: 150 },
            { subject: 'Professionalism', A: Math.round(radarBase + (Math.random() * 10 - 5)), B: 110, fullMark: 150 },
        ];
        const staffData = await this.prisma.companyStaff.findMany({
            where: { companyId },
            include: {
                user: true,
                assignedBookings: {
                    where: { status: 'completed' },
                    select: { companyEarnings: true },
                },
                reviews: {
                    select: { staffRating: true },
                },
            },
        });
        const topStaff = staffData.map((s) => {
            const jobsCount = s.assignedBookings.length;
            const revenue = s.assignedBookings.reduce((sum, b) => sum + Number(b.companyEarnings), 0);
            const ratings = s.reviews.map(r => r.staffRating).filter((v) => v !== null);
            const rating = ratings.length > 0 ? Number((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)) : 5.0;
            return {
                name: s.user.fullName,
                revenue,
                rating,
                jobs: jobsCount,
            };
        }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
        const companyReviews = await this.prisma.review.findMany({
            where: { booking: { companyId } },
            select: { createdAt: true, companyRating: true },
        });
        const ratingTrend = months.map((m) => {
            const revs = companyReviews.filter(r => `${r.createdAt.getFullYear()}-${r.createdAt.getMonth()}` === m.monthKey);
            const avg = revs.length > 0 ? Number((revs.reduce((sum, r) => sum + r.companyRating, 0) / revs.length).toFixed(1)) : avgRatingVal;
            return {
                name: m.name,
                rating: avg,
            };
        });
        return {
            revenue: totalRevenue,
            revenueGrowth,
            bookingsGrowth,
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
            topStaff,
            ratingTrend,
            qualityRadar,
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
                        workingStatus: true,
                        lastSeen: true,
                        lastLoginAt: true,
                    },
                },
                _count: {
                    select: {
                        assignedRequests: { where: { status: 'approved' } },
                        assignedBookings: { where: { status: 'completed' } },
                    },
                },
                assignedBookings: true,
                reviews: true,
            },
        });
        return staff.map((s) => {
            const validReviews = s.reviews.filter((r) => r.staffRating !== null);
            const avgRating = validReviews.length > 0
                ? validReviews.reduce((acc, r) => acc + Number(r.staffRating), 0) /
                    validReviews.length
                : null;
            const isAvailable = s.status === 'active' && !s.assignedBookings.some(b => b.status === 'in_progress');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const todayJobsCount = s.assignedBookings.filter(b => b.bookingDate >= today && b.bookingDate < tomorrow).length;
            return {
                id: s.id.toString(),
                userId: s.userId.toString(),
                name: s.user.fullName,
                fullName: s.user.fullName,
                email: s.user.email,
                avatar: s.user.avatar,
                phone: s.user.phone || '+855 12 000 000',
                role: s.role === 'worker' ? 'Field Agent' : s.role === 'supervisor' ? 'Senior Technician' : 'Manager',
                status: isAvailable ? 'online' : 'offline',
                rating: avgRating ? Number(avgRating.toFixed(1)) : 0,
                jobsCompleted: s._count.assignedBookings,
                todayJobs: todayJobsCount,
                earningsToday: s.assignedBookings.filter(b => b.status === 'completed' && b.bookingDate >= today && b.bookingDate < tomorrow).reduce((sum, b) => sum + Number(b.staffEarnings), 0),
                pendingPayout: Number(s.walletBalance),
                tips: 0,
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
                documents: true,
                notes: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                fullName: true,
                                avatar: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
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
        const revenueAgg = await this.prisma.booking.aggregate({
            where: { assignedStaffId: staffId, status: 'completed' },
            _sum: { totalPrice: true }
        });
        const totalRevenue = Number(revenueAgg._sum.totalPrice || 0);
        const completedJobsCount = await this.prisma.booking.count({
            where: { assignedStaffId: staffId, status: 'completed' },
        });
        const cancelledJobsCount = await this.prisma.booking.count({
            where: { assignedStaffId: staffId, status: 'cancelled' },
        });
        const totalBookingsCount = staff.assignedBookings.length;
        const completionRate = (totalBookingsCount - cancelledJobsCount) > 0
            ? Number(((completedJobsCount / (totalBookingsCount - cancelledJobsCount)) * 100).toFixed(1))
            : 100;
        const cancellationRate = totalBookingsCount > 0
            ? Number(((cancelledJobsCount / totalBookingsCount) * 100).toFixed(1))
            : 0;
        const approvedRequestsCount = await this.prisma.serviceRequest.count({
            where: { approvedBy: staffId },
        });
        const rejectedRequestsCount = await this.prisma.serviceRequest.count({
            where: { rejectedBy: staffId },
        });
        const totalRequestsCount = approvedRequestsCount + rejectedRequestsCount;
        const acceptanceRate = totalRequestsCount > 0
            ? Number(((approvedRequestsCount / totalRequestsCount) * 100).toFixed(1))
            : 100;
        const presentDays = completedJobsCount + 5;
        const lateDays = Math.floor(completedJobsCount * 0.05);
        const absentDays = 0;
        const totalHours = completedJobsCount * 2;
        const overtimeHours = Math.floor(completedJobsCount * 0.1);
        const attendance = {
            present: presentDays,
            late: lateDays,
            absent: absentDays,
            hours: `${totalHours}h`,
            overtime: `${overtimeHours}h`,
        };
        return {
            id: staff.id.toString(),
            generatedRevenue: totalRevenue,
            completionRate,
            acceptanceRate,
            cancellationRate,
            onTimeArrival: 96.5,
            returnRate: 42,
            attendance,
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
            documents: staff.documents.map((d) => ({
                id: d.id.toString(),
                name: d.name,
                documentUrl: d.documentUrl,
                status: d.status,
                expiryDate: d.expiryDate ? d.expiryDate.toISOString() : null,
            })),
            notes: staff.notes.map((n) => ({
                id: n.id.toString(),
                note: n.note,
                createdAt: n.createdAt.toISOString(),
                authorName: n.author.fullName,
                authorAvatar: n.author.avatar,
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
                splitPercent: updates.splitPercent !== undefined && updates.splitPercent !== null ? Number(updates.splitPercent) : null,
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
    async getCompanyServices(companyId) {
        const services = await this.prisma.service.findMany({
            where: { companyId },
            include: {
                serviceType: {
                    include: { category: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return services.map(s => ({
            ...s,
            id: s.id.toString(),
            companyId: s.companyId.toString(),
            serviceTypeId: s.serviceTypeId.toString(),
            basePrice: Number(s.basePrice),
            discountPrice: s.discountPrice ? Number(s.discountPrice) : null,
        }));
    }
    async getCompanyServiceDetail(companyId, serviceId) {
        const service = await this.prisma.service.findFirst({
            where: { id: serviceId, companyId },
            include: {
                serviceType: {
                    include: { category: true }
                },
                bookings: {
                    select: {
                        id: true,
                        status: true,
                        totalPrice: true,
                        bookingDate: true,
                    }
                },
                _count: {
                    select: { bookings: true }
                }
            }
        });
        if (!service) {
            throw new common_1.NotFoundException('Service not found');
        }
        const bookings = service.bookings;
        const completedBookings = bookings.filter(b => b.status === 'completed');
        const totalRevenue = completedBookings.reduce((sum, b) => sum + Number(b.totalPrice), 0);
        const activeBookings = bookings.filter(b => ['pending', 'in_progress', 'confirmed'].includes(b.status)).length;
        return {
            id: service.id.toString(),
            name: service.name,
            description: service.description,
            basePrice: Number(service.basePrice),
            discountPrice: service.discountPrice ? Number(service.discountPrice) : null,
            isActive: service.isActive,
            image: service.image,
            category: service.serviceType?.category?.name || 'General',
            type: service.serviceType?.name || 'Standard',
            stats: {
                totalBookings: service._count.bookings,
                completedBookings: completedBookings.length,
                activeBookings,
                totalRevenue,
            },
            recentBookings: bookings
                .sort((a, b) => b.bookingDate.getTime() - a.bookingDate.getTime())
                .slice(0, 5)
                .map(b => ({
                id: b.id.toString(),
                status: b.status,
                amount: Number(b.totalPrice),
                date: b.bookingDate
            }))
        };
    }
    async updateCompanyService(companyId, serviceId, data) {
        const service = await this.prisma.service.findFirst({
            where: { id: serviceId, companyId },
        });
        if (!service)
            throw new common_1.NotFoundException('Service not found');
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.basePrice !== undefined)
            updateData.basePrice = Number(data.basePrice);
        if (data.discountPrice !== undefined)
            updateData.discountPrice = data.discountPrice ? Number(data.discountPrice) : null;
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        if (data.image !== undefined)
            updateData.image = data.image;
        return this.prisma.service.update({
            where: { id: serviceId },
            data: updateData,
        });
    }
    async createCompanyService(companyId, data) {
        return this.prisma.service.create({
            data: {
                companyId,
                serviceTypeId: BigInt(data.serviceTypeId || 1),
                name: data.name,
                description: data.description,
                basePrice: Number(data.basePrice),
                discountPrice: data.discountPrice ? Number(data.discountPrice) : null,
                durationMin: data.durationMin || 60,
                isActive: data.isActive ?? true,
                image: data.image,
            }
        });
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
        const company = await this.prisma.company.findFirst({
            where: { ownerId: userId },
        });
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
        const company = await this.prisma.company.findFirst({
            where: { ownerId: userId },
        });
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
        const company = await this.prisma.company.findFirst({
            where: { ownerId: userId },
        });
        let companyId = company?.id;
        if (!companyId) {
            const userStaff = await this.prisma.companyStaff.findFirst({
                where: { userId },
            });
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
        return slots.map((s) => ({
            ...s,
            id: s.id.toString(),
            companyId: s.companyId.toString(),
            staffId: s.staffId?.toString(),
        }));
    }
    async removeStaffAvailability(userId, slotId) {
        const company = await this.prisma.company.findFirst({
            where: { ownerId: userId },
        });
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
    async addStaffDocument(staffId, userId, dto) {
        const staff = await this.prisma.companyStaff.findFirst({
            where: { id: staffId },
            include: { company: true },
        });
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
        if (staff.company.ownerId !== userId)
            throw new common_1.ForbiddenException('Access denied');
        const document = await this.prisma.staffDocument.create({
            data: {
                staffId,
                name: dto.name,
                documentUrl: dto.documentUrl,
                status: 'verified',
                expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
            },
        });
        return {
            id: document.id.toString(),
            name: document.name,
            documentUrl: document.documentUrl,
            status: document.status,
            expiryDate: document.expiryDate ? document.expiryDate.toISOString() : null,
        };
    }
    async addStaffNote(staffId, userId, dto) {
        const staff = await this.prisma.companyStaff.findFirst({
            where: { id: staffId },
            include: { company: true },
        });
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
        if (staff.company.ownerId !== userId)
            throw new common_1.ForbiddenException('Access denied');
        const noteRecord = await this.prisma.staffNote.create({
            data: {
                staffId,
                authorId: userId,
                note: dto.note,
            },
            include: {
                author: true,
            },
        });
        return {
            id: noteRecord.id.toString(),
            note: noteRecord.note,
            createdAt: noteRecord.createdAt.toISOString(),
            authorName: noteRecord.author.fullName,
            authorAvatar: noteRecord.author.avatar,
        };
    }
    async deleteStaffNote(noteId, userId) {
        const noteRecord = await this.prisma.staffNote.findUnique({
            where: { id: noteId },
            include: { staff: { include: { company: true } } },
        });
        if (!noteRecord)
            throw new common_1.NotFoundException('Note not found');
        if (noteRecord.staff.company.ownerId !== userId)
            throw new common_1.ForbiddenException('Access denied');
        await this.prisma.staffNote.delete({
            where: { id: noteId },
        });
        return { message: 'Note deleted successfully' };
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