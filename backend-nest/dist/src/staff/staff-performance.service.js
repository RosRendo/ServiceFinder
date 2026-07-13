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
exports.StaffPerformanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StaffPerformanceService = class StaffPerformanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPerformance(staffId) {
        const staffRecord = await this.prisma.companyStaff.findFirst({
            where: { userId: staffId },
            include: {
                user: { select: { id: true, fullName: true, avatar: true } },
                company: { select: { id: true, name: true } },
            },
        });
        if (!staffRecord)
            throw new common_1.NotFoundException('Staff record not found');
        const [completedBookings, totalBookings, reviews] = await Promise.all([
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
        ]);
        const totalReviews = reviews.length;
        const avgRating = totalReviews > 0
            ? reviews.reduce((sum, r) => sum + (r.staffRating ?? 0), 0) /
                totalReviews
            : 0;
        const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
        const ratingDistribution = [0, 0, 0, 0, 0];
        reviews.forEach((r) => {
            if (r.staffRating && r.staffRating >= 1 && r.staffRating <= 5) {
                ratingDistribution[r.staffRating - 1]++;
            }
        });
        return {
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
            },
        };
    }
    async getWallet(userId) {
        const staffRecord = await this.prisma.companyStaff.findFirst({
            where: { userId },
            include: {
                walletTransactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
            },
        });
        if (!staffRecord)
            throw new common_1.NotFoundException('Staff record not found');
        return {
            walletBalance: staffRecord.walletBalance
                ? Number(staffRecord.walletBalance)
                : 0,
            creditLimit: staffRecord.creditLimit
                ? Number(staffRecord.creditLimit)
                : 0,
            transactions: staffRecord.walletTransactions.map((t) => ({
                id: t.id.toString(),
                amount: Number(t.amount),
                type: t.type,
                description: t.description,
                createdAt: t.createdAt.toISOString(),
            })),
        };
    }
    async getStaffReviews(staffId, page = 1, limit = 10) {
        const staffRecord = await this.prisma.companyStaff.findFirst({
            where: { userId: staffId },
        });
        if (!staffRecord)
            throw new common_1.NotFoundException('Staff record not found');
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
            reviews,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
        };
    }
    async getAvailability(staffId) {
        const staffRecord = await this.prisma.companyStaff.findFirst({
            where: { userId: staffId },
        });
        if (!staffRecord)
            throw new common_1.NotFoundException('Staff record not found');
        const slots = await this.prisma.availabilitySlot.findMany({
            where: { staffId: staffRecord.id },
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        });
        return { availability: slots };
    }
    async getStaffAvailabilityForCompany(userId, staffId) {
        const company = await this.prisma.company.findFirst({
            where: { ownerId: userId },
        });
        if (!company)
            throw new common_1.ForbiddenException('You do not own a company');
        const staffRecord = await this.prisma.companyStaff.findFirst({
            where: { id: BigInt(staffId), companyId: company.id },
        });
        if (!staffRecord)
            throw new common_1.NotFoundException('Staff record not found or does not belong to your company');
        const slots = await this.prisma.availabilitySlot.findMany({
            where: { staffId: staffRecord.id },
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        });
        return { availability: slots };
    }
    async updateAvailability(staffId, slots) {
        const staffRecord = await this.prisma.companyStaff.findFirst({
            where: { userId: staffId },
        });
        if (!staffRecord)
            throw new common_1.NotFoundException('Staff record not found');
        const results = await Promise.all(slots.map((slot) => this.prisma.availabilitySlot.create({
            data: {
                companyId: staffRecord.companyId,
                staffId: staffRecord.id,
                date: new Date(slot.date),
                startTime: new Date(`${slot.date}T${slot.startTime}`),
                endTime: new Date(`${slot.date}T${slot.endTime}`),
                isAvailable: slot.isAvailable,
            },
        })));
        return { message: 'Availability updated', count: results.length };
    }
    async getCompanyStaffPerformance(companyId) {
        const staffList = await this.prisma.companyStaff.findMany({
            where: { companyId, status: 'active' },
            include: {
                user: { select: { id: true, fullName: true, avatar: true } },
            },
        });
        const performances = await Promise.all(staffList.map(async (s) => {
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
            const avgRating = reviews.length > 0
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
        }));
        return { staff: performances };
    }
};
exports.StaffPerformanceService = StaffPerformanceService;
exports.StaffPerformanceService = StaffPerformanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StaffPerformanceService);
//# sourceMappingURL=staff-performance.service.js.map