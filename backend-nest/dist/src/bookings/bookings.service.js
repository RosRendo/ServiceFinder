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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const status_transitions_util_1 = require("../common/status-transitions.util");
const bookings_gateway_1 = require("./bookings.gateway");
const admin_gateway_1 = require("../admin/admin.gateway");
const settings_service_1 = require("../settings/settings.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const analytics_service_1 = require("../analytics/analytics.service");
const notifications_service_1 = require("../notifications/notifications.service");
const promo_codes_service_1 = require("../promo-codes/promo-codes.service");
const conversations_service_1 = require("../conversations/conversations.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const booking_events_1 = require("./events/booking.events");
let BookingsService = class BookingsService {
    prisma;
    bookingsGateway;
    adminGateway;
    settingsService;
    analytics;
    notificationsService;
    promoCodesService;
    conversationsService;
    eventEmitter;
    constructor(prisma, bookingsGateway, adminGateway, settingsService, analytics, notificationsService, promoCodesService, conversationsService, eventEmitter) {
        this.prisma = prisma;
        this.bookingsGateway = bookingsGateway;
        this.adminGateway = adminGateway;
        this.settingsService = settingsService;
        this.analytics = analytics;
        this.notificationsService = notificationsService;
        this.promoCodesService = promoCodesService;
        this.conversationsService = conversationsService;
        this.eventEmitter = eventEmitter;
    }
    async getAllBookings(query, user) {
        const { customerId, companyId, status, staffId, page = 1, limit = 10, } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role === 'customer') {
            where.customerId = BigInt(user.id);
        }
        else if (customerId) {
            where.customerId = BigInt(customerId);
        }
        if (user.role === 'company_admin') {
            const company = await this.prisma.company.findFirst({
                where: { ownerId: BigInt(user.id) },
            });
            if (!company)
                throw new common_1.ForbiddenException('You do not own a company');
            where.companyId = company.id;
        }
        else if (user.role === 'staff') {
            const staff = await this.prisma.companyStaff.findFirst({
                where: { userId: BigInt(user.id) },
            });
            if (!staff)
                throw new common_1.ForbiddenException('You are not associated with any company');
            where.companyId = staff.companyId;
        }
        else if (companyId) {
            where.companyId = BigInt(companyId);
        }
        if (status && status !== 'all') {
            where.status = status.includes(',') ? { in: status.split(',') } : status;
        }
        if (staffId)
            where.assignedStaffId = BigInt(staffId);
        const [bookings, total] = await Promise.all([
            this.prisma.booking.findMany({
                where,
                skip: Number(skip),
                take: Number(limit),
                include: {
                    customer: {
                        select: { id: true, fullName: true, email: true, phone: true },
                    },
                    company: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            email: true,
                            logoUrl: true,
                        },
                    },
                    service: {
                        include: { serviceType: { include: { category: true } } },
                    },
                    assignedStaff: {
                        include: {
                            user: { select: { id: true, fullName: true, phone: true } },
                        },
                    },
                    payment: true,
                    review: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.booking.count({ where }),
        ]);
        return {
            bookings: bookings.map((b) => this.serializeBooking(b)),
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        };
    }
    async getBookingById(id, user) {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            include: {
                customer: {
                    select: { id: true, fullName: true, email: true, phone: true },
                },
                company: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        address: true,
                        ownerId: true,
                        logoUrl: true,
                    },
                },
                service: { include: { serviceType: { include: { category: true } } } },
                assignedStaff: {
                    include: {
                        user: {
                            select: { id: true, fullName: true, phone: true, email: true },
                        },
                    },
                },
                payment: true,
                review: true,
                cancellation: true,
                statusLogs: { orderBy: { changedAt: 'desc' } },
            },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (user.role === 'customer' && booking.customerId !== BigInt(user.id)) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return { booking: this.serializeBooking(booking) };
    }
    async createBooking(dto, user) {
        const service = await this.prisma.service.findUnique({
            where: { id: BigInt(dto.serviceId) },
        });
        if (!service)
            throw new common_1.NotFoundException('Service not found');
        if (!service.isActive)
            throw new common_1.BadRequestException('Service is not available');
        const cleanDate = dto.bookingDate.includes('T')
            ? dto.bookingDate.split('T')[0]
            : dto.bookingDate;
        let parsedTime = dto.startTime.trim();
        if (parsedTime.toLowerCase().includes('m')) {
            const isPM = parsedTime.toLowerCase().includes('pm');
            const timeParts = parsedTime.replace(/am|pm/i, '').trim().split(':');
            let h = parseInt(timeParts[0], 10);
            const m = timeParts[1] || '00';
            if (isPM && h < 12)
                h += 12;
            if (!isPM && h === 12)
                h = 0;
            parsedTime = `${h.toString().padStart(2, '0')}:${m}`;
        }
        else if (parsedTime.includes(':')) {
            const parts = parsedTime.split(':');
            parsedTime = `${parts[0].padStart(2, '0')}:${parts[1]}`;
        }
        const start = new Date(`${cleanDate}T${parsedTime}:00Z`);
        const end = new Date(start.getTime() + service.durationMin * 60000);
        const platformFeePercent = await this.settingsService.getSettingNumber('PLATFORM_FEE_PERCENT', 10);
        const companySplitPercent = await this.settingsService.getSettingNumber('COMPANY_SPLIT_PERCENT', 31);
        let discountPercent = 0;
        let promoCodeId = null;
        if (dto.promoCode) {
            const validation = await this.promoCodesService.validatePromoCode(dto.promoCode);
            if (validation.valid) {
                discountPercent = validation.discountPercent;
                promoCodeId = BigInt(validation.id);
            }
        }
        const basePrice = Number(service.basePrice);
        const bookingDay = new Date(cleanDate).getDay();
        const startHour = parseInt(parsedTime.split(':')[0], 10);
        const pricingRules = await this.prisma.pricingRule.findMany({
            where: { companyId: BigInt(dto.companyId), isActive: true },
        });
        let totalSurchargePercent = 0;
        pricingRules.forEach((rule) => {
            let matchesDay = true;
            let matchesTime = true;
            if (rule.dayOfWeek !== null && rule.dayOfWeek !== bookingDay) {
                matchesDay = false;
            }
            if (rule.startHour !== null && startHour < rule.startHour) {
                matchesTime = false;
            }
            if (rule.endHour !== null && startHour >= rule.endHour) {
                matchesTime = false;
            }
            if (matchesDay && matchesTime) {
                totalSurchargePercent += Number(rule.surchargePercent);
            }
        });
        const surchargeAmount = Number(((basePrice * totalSurchargePercent) / 100).toFixed(2));
        const priceBeforeDiscount = basePrice + surchargeAmount;
        const discountAmount = Number(((priceBeforeDiscount * discountPercent) / 100).toFixed(2));
        const totalPrice = Number((priceBeforeDiscount - discountAmount).toFixed(2));
        const platformFee = Number((totalPrice * (platformFeePercent / 100)).toFixed(2));
        const companyEarnings = Number((totalPrice - platformFee).toFixed(2));
        const staffEarnings = 0;
        let instantiatedChecklist = null;
        if (service.checklist && Array.isArray(service.checklist)) {
            instantiatedChecklist = service.checklist.map((item, index) => {
                if (typeof item === 'string') {
                    return { id: index + 1, title: item, completed: false };
                }
                return { id: index + 1, ...item, completed: false };
            });
        }
        const booking = (await this.prisma.booking.create({
            data: {
                customerId: BigInt(user.id),
                companyId: BigInt(dto.companyId),
                serviceId: BigInt(dto.serviceId),
                bookingDate: new Date(cleanDate),
                startTime: start,
                endTime: end,
                serviceAddress: dto.serviceAddress || '',
                latitude: dto.latitude,
                longitude: dto.longitude,
                customerNotes: dto.notes || '',
                totalPrice,
                platformFee,
                companyEarnings,
                staffEarnings,
                status: 'pending',
                promoCodeId: promoCodeId || null,
                checklist: instantiatedChecklist,
            },
            include: {
                customer: {
                    select: { id: true, fullName: true, email: true, phone: true },
                },
                company: {
                    select: { id: true, name: true, ownerId: true, logoUrl: true },
                },
                service: true,
            },
        }));
        await this.prisma.bookingStatusLog.create({
            data: {
                bookingId: booking.id,
                newStatus: 'pending',
                changedBy: BigInt(user.id),
            },
        });
        if (promoCodeId) {
            await this.prisma.promoCode.update({
                where: { id: promoCodeId },
                data: { usedCount: { increment: 1 } },
            });
        }
        if (booking.company?.ownerId) {
            await this.notificationsService.notifyBookingCreated(BigInt(user.id), booking.company.ownerId, booking.service.name, booking.id.toString());
        }
        this.analytics.captureEvent(user.id.toString(), 'booking_created', {
            bookingId: booking.id.toString(),
            serviceId: booking.serviceId.toString(),
            companyId: booking.companyId.toString(),
            totalPrice,
        });
        const result = {
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
                staffEarnings: Number(booking.staffEarnings),
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
        this.adminGateway.broadcastKpiUpdate('new_booking', {
            id: booking.id.toString(),
            totalPrice: Number(booking.totalPrice),
        });
        return result;
    }
    async updateBookingStatus(id, status, user) {
        const booking = await this.findOrFail(id);
        (0, status_transitions_util_1.validateTransition)(booking.status, status);
        const updated = await this.prisma.$transaction(async (tx) => {
            const u = await tx.booking.update({
                where: { id },
                data: { status: status },
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
        if (updated.customerId) {
            await this.notificationsService.notifyBookingStatusChanged(updated.customerId, status, updated.service.name, id.toString());
        }
        const result = {
            message: 'Booking status updated successfully',
            booking: this.serializeBooking(updated),
        };
        this.bookingsGateway.broadcastBookingUpdate(id.toString(), status, result.booking);
        this.adminGateway.broadcastKpiUpdate('booking_status_changed', {
            id: id.toString(),
            status,
        });
        return result;
    }
    async assignStaff(id, staffId, user) {
        const booking = await this.findOrFail(id, true);
        if (!['pending', 'confirmed'].includes(booking.status)) {
            throw new common_1.BadRequestException('Can only assign staff to pending or confirmed bookings');
        }
        const staff = await this.prisma.companyStaff.findFirst({
            where: {
                id: BigInt(staffId),
                companyId: booking.companyId,
                status: 'active',
            },
            include: { user: true },
        });
        if (!staff)
            throw new common_1.BadRequestException('Staff not found or not active in this company');
        const timeOff = await this.prisma.availabilitySlot.findFirst({
            where: {
                staffId: staff.id,
                isAvailable: false,
                date: booking.bookingDate,
            },
        });
        if (timeOff) {
            throw new common_1.BadRequestException('Staff member is on time off and unavailable for this date');
        }
        const overlapping = await this.prisma.booking.findFirst({
            where: {
                assignedStaffId: staff.id,
                id: { not: booking.id },
                status: { in: ['pending', 'confirmed', 'in_progress'] },
                bookingDate: booking.bookingDate,
                startTime: { lt: booking.endTime },
                endTime: { gt: booking.startTime },
            },
        });
        if (overlapping) {
            throw new common_1.ConflictException('Staff member already has a booking that overlaps with this time');
        }
        const company = await this.prisma.company.findUnique({
            where: { id: booking.companyId },
            select: { walletBalance: true },
        });
        const staffDebtLimit = await this.settingsService.getSettingNumber('STAFF_DEBT_LIMIT', -50);
        const companyDebtLimit = await this.settingsService.getSettingNumber('COMPANY_DEBT_LIMIT', -200);
        if (Number(staff.walletBalance) < staffDebtLimit) {
            throw new common_1.ForbiddenException(`Staff member's wallet balance is below the debt limit of $${Math.abs(staffDebtLimit)}. Cannot assign new jobs.`);
        }
        if (company && Number(company.walletBalance) < companyDebtLimit) {
            throw new common_1.ForbiddenException(`Company's wallet balance is below the debt limit of $${Math.abs(companyDebtLimit)}. Cannot assign new jobs.`);
        }
        (0, status_transitions_util_1.validateTransition)(booking.status, 'assigned');
        const updated = await this.prisma.$transaction(async (tx) => {
            const updateResult = await tx.booking.updateMany({
                where: {
                    id,
                    assignedStaffId: null,
                    status: { in: ['pending', 'confirmed'] },
                },
                data: {
                    assignedStaffId: BigInt(staffId),
                    status: 'assigned',
                },
            });
            if (updateResult.count === 0) {
                throw new common_1.ConflictException('Job already taken or no longer available.');
            }
            const u = await tx.booking.findUnique({
                where: { id },
                include: {
                    customer: true,
                    company: true,
                    service: true,
                    assignedStaff: { include: { user: true } },
                },
            });
            if (!u) {
                throw new common_1.ConflictException('Failed to retrieve updated booking.');
            }
            await tx.bookingStatusLog.create({
                data: {
                    bookingId: id,
                    oldStatus: booking.status,
                    newStatus: 'assigned',
                    changedBy: BigInt(user.id),
                },
            });
            return u;
        });
        const result = {
            success: true,
            message: 'Staff assigned successfully, awaiting acceptance',
            booking: this.serializeBooking(updated),
        };
        this.bookingsGateway.broadcastBookingUpdate(id.toString(), 'assigned', result.booking);
        this.eventEmitter.emit('booking.assigned', new booking_events_1.BookingAssignedEvent(id, staff.id, booking.companyId, booking.customerId));
        return result;
    }
    async claimBooking(bookingId, userId) {
        const staff = await this.prisma.companyStaff.findFirst({
            where: { userId, status: 'active' },
            include: { company: true },
        });
        if (!staff)
            throw new common_1.ForbiddenException('You are not registered as active staff');
        if (staff.company.bookingMode !== 'open_pool') {
            throw new common_1.BadRequestException('This company uses Dispatch Mode. Your manager assigns bookings to you.');
        }
        const booking = await this.findOrFail(bookingId, true);
        if (booking.companyId.toString() !== staff.companyId.toString()) {
            throw new common_1.ForbiddenException('This booking does not belong to your company');
        }
        if (booking.status !== 'pending') {
            throw new common_1.BadRequestException('Only pending bookings can be claimed');
        }
        if (booking.assignedStaffId) {
            throw new common_1.ConflictException('This booking has already been claimed by another staff member');
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const u = await tx.booking.update({
                where: { id: bookingId },
                data: { assignedStaffId: staff.id, status: 'confirmed' },
                include: {
                    customer: true,
                    company: true,
                    service: true,
                    assignedStaff: { include: { user: true } },
                },
            });
            await tx.bookingStatusLog.create({
                data: {
                    bookingId,
                    oldStatus: booking.status,
                    newStatus: 'confirmed',
                    changedBy: userId,
                },
            });
            return u;
        });
        const result = {
            success: true,
            message: 'Booking claimed successfully',
            booking: this.serializeBooking(updated),
        };
        this.bookingsGateway.broadcastBookingUpdate(bookingId.toString(), 'confirmed', result.booking);
        this.eventEmitter.emit('booking.accepted', new booking_events_1.BookingAcceptedEvent(bookingId, staff.id, booking.companyId, booking.customerId));
        return result;
    }
    async acceptAssignment(id, userId) {
        const staff = await this.prisma.companyStaff.findFirst({
            where: { userId },
        });
        if (!staff)
            throw new common_1.ForbiddenException('You are not registered as staff');
        const booking = await this.findOrFail(id, true);
        if (!booking.assignedStaffId ||
            booking.assignedStaffId.toString() !== staff.id.toString()) {
            throw new common_1.BadRequestException('You are not assigned to this booking');
        }
        (0, status_transitions_util_1.validateTransition)(booking.status, 'confirmed');
        const updated = await this.prisma.$transaction(async (tx) => {
            const u = await tx.booking.update({
                where: { id },
                data: { status: 'confirmed' },
                include: {
                    customer: true,
                    company: true,
                    service: true,
                    assignedStaff: { include: { user: true } },
                },
            });
            await tx.bookingStatusLog.create({
                data: {
                    bookingId: id,
                    oldStatus: booking.status,
                    newStatus: 'confirmed',
                    changedBy: userId,
                },
            });
            return u;
        });
        const result = {
            success: true,
            message: 'Job assignment accepted',
            booking: this.serializeBooking(updated),
        };
        this.bookingsGateway.broadcastBookingUpdate(id.toString(), 'confirmed', result.booking);
        this.eventEmitter.emit('booking.accepted', new booking_events_1.BookingAcceptedEvent(id, staff.id, booking.companyId, booking.customerId));
        return result;
    }
    async rejectAssignment(id, userId) {
        const staff = await this.prisma.companyStaff.findFirst({
            where: { userId },
        });
        if (!staff)
            throw new common_1.ForbiddenException('You are not registered as staff');
        const booking = await this.findOrFail(id, true);
        if (!booking.assignedStaffId ||
            booking.assignedStaffId.toString() !== staff.id.toString()) {
            throw new common_1.BadRequestException('You are not assigned to this booking');
        }
        (0, status_transitions_util_1.validateTransition)(booking.status, 'pending');
        const updated = await this.prisma.$transaction(async (tx) => {
            const u = await tx.booking.update({
                where: { id },
                data: {
                    status: 'pending',
                    assignedStaffId: null,
                },
                include: {
                    customer: true,
                    company: true,
                    service: true,
                    assignedStaff: { include: { user: true } },
                },
            });
            await tx.bookingStatusLog.create({
                data: {
                    bookingId: id,
                    oldStatus: booking.status,
                    newStatus: 'pending',
                    changedBy: userId,
                },
            });
            return u;
        });
        const result = {
            success: true,
            message: 'Job assignment rejected, returned to dispatch queue',
            booking: this.serializeBooking(updated),
        };
        this.bookingsGateway.broadcastBookingUpdate(id.toString(), 'pending', result.booking);
        this.eventEmitter.emit('booking.rejected', new booking_events_1.BookingRejectedEvent(id, staff.id, booking.companyId, booking.customerId));
        return result;
    }
    async startJob(id, userId, staffStartLat, staffStartLng) {
        const staff = await this.prisma.companyStaff.findFirst({
            where: { userId },
        });
        if (!staff)
            throw new common_1.ForbiddenException('You are not registered as staff');
        const booking = await this.findOrFail(id, true);
        if (!booking.assignedStaffId ||
            booking.assignedStaffId.toString() !== staff.id.toString()) {
            throw new common_1.BadRequestException('You are not assigned to this booking');
        }
        (0, status_transitions_util_1.validateTransition)(booking.status, 'in_progress');
        const updated = await this.prisma.$transaction(async (tx) => {
            const updateData = {
                status: 'in_progress',
                actualStartTime: new Date(),
                progressPercent: 0,
            };
            if (staffStartLat)
                updateData.staffStartLatitude = staffStartLat;
            if (staffStartLng)
                updateData.staffStartLongitude = staffStartLng;
            const u = await tx.booking.update({
                where: { id },
                data: updateData,
                include: {
                    customer: true,
                    company: true,
                    service: true,
                    assignedStaff: true,
                },
            });
            await tx.bookingStatusLog.create({
                data: {
                    bookingId: id,
                    oldStatus: booking.status,
                    newStatus: 'in_progress',
                    changedBy: userId,
                },
            });
            return u;
        });
        await this.notificationsService
            .notifyBookingStatusChanged(booking.customerId, 'in_progress', updated.service.name, id.toString())
            .catch((e) => console.warn('Notification create failed (in_progress):', e?.message));
        const result = {
            success: true,
            message: 'Job started successfully',
            booking: this.serializeBooking(updated),
        };
        this.bookingsGateway.broadcastBookingUpdate(id.toString(), 'in_progress', result.booking);
        this.adminGateway.broadcastKpiUpdate('booking_status_changed', {
            id: id.toString(),
            status: 'in_progress',
        });
        return result;
    }
    async arriveJob(id, userId) {
        const staff = await this.prisma.companyStaff.findFirst({
            where: { userId },
        });
        if (!staff)
            throw new common_1.ForbiddenException('You are not registered as staff');
        const booking = await this.findOrFail(id, true);
        if (!booking.assignedStaffId ||
            booking.assignedStaffId.toString() !== staff.id.toString()) {
            throw new common_1.BadRequestException('You are not assigned to this booking');
        }
        (0, status_transitions_util_1.validateTransition)(booking.status, 'arrived');
        const updated = await this.prisma.$transaction(async (tx) => {
            const u = await tx.booking.update({
                where: { id },
                data: {
                    status: 'arrived',
                },
                include: {
                    customer: true,
                    company: true,
                    service: true,
                    assignedStaff: true,
                },
            });
            await tx.bookingStatusLog.create({
                data: {
                    bookingId: id,
                    oldStatus: booking.status,
                    newStatus: 'arrived',
                    changedBy: userId,
                },
            });
            return u;
        });
        await this.notificationsService
            .notifyBookingStatusChanged(booking.customerId, 'arrived', updated.service.name, id.toString())
            .catch((e) => console.warn('Notification create failed (arrived):', e?.message));
        const result = {
            success: true,
            message: 'Arrived at job location successfully',
            booking: this.serializeBooking(updated),
        };
        this.bookingsGateway.broadcastBookingUpdate(id.toString(), 'arrived', result.booking);
        this.adminGateway.broadcastKpiUpdate('booking_status_changed', {
            id: id.toString(),
            status: 'arrived',
        });
        return result;
    }
    async updateProgress(id, userId, progressPercent, staffNotes, checklist) {
        if (progressPercent < 0 || progressPercent > 100) {
            throw new common_1.BadRequestException('progressPercent must be between 0 and 100');
        }
        const staff = await this.prisma.companyStaff.findFirst({
            where: { userId },
        });
        if (!staff)
            throw new common_1.ForbiddenException('You are not registered as staff');
        const booking = await this.findOrFail(id, true);
        if (!booking.assignedStaffId ||
            booking.assignedStaffId.toString() !== staff.id.toString()) {
            throw new common_1.BadRequestException('You are not assigned to this booking');
        }
        if (booking.status !== 'in_progress') {
            throw new common_1.BadRequestException('Can only update progress for in-progress bookings');
        }
        const updateData = { progressPercent };
        if (staffNotes !== undefined)
            updateData.staffNotes = staffNotes;
        if (checklist !== undefined)
            updateData.checklist = checklist;
        const updated = await this.prisma.booking.update({
            where: { id },
            data: updateData,
            include: { customer: true, service: true, assignedStaff: true },
        });
        if ([25, 50, 75].includes(progressPercent)) {
            await this.notificationsService
                .createNotification(booking.customerId, 'progress_update', 'Service Progress Update', `Your service is ${progressPercent}% complete`, { bookingId: id.toString() })
                .catch((e) => console.warn('Notification create failed (progress):', e?.message));
        }
        const result = {
            success: true,
            message: 'Progress updated successfully',
            booking: this.serializeBooking(updated),
        };
        this.bookingsGateway.broadcastBookingUpdate(id.toString(), booking.status, result.booking);
        return result;
    }
    async completeJob(id, userId, proofOfWorkPhoto) {
        const staff = await this.prisma.companyStaff.findFirst({
            where: { userId },
        });
        if (!staff)
            throw new common_1.ForbiddenException('You are not registered as staff');
        const booking = await this.findOrFail(id, true);
        if (!booking.assignedStaffId ||
            booking.assignedStaffId.toString() !== staff.id.toString()) {
            throw new common_1.BadRequestException('You are not assigned to this booking');
        }
        (0, status_transitions_util_1.validateTransition)(booking.status, 'completed');
        const updated = await this.prisma.$transaction(async (tx) => {
            const updateData = {
                status: 'completed',
                actualEndTime: new Date(),
                progressPercent: 100,
            };
            if (proofOfWorkPhoto) {
                updateData.proofOfWorkPhoto = proofOfWorkPhoto;
            }
            const u = await tx.booking.update({
                where: { id },
                data: updateData,
                include: {
                    customer: true,
                    company: true,
                    service: true,
                    assignedStaff: true,
                    payment: true,
                },
            });
            await tx.bookingStatusLog.create({
                data: {
                    bookingId: id,
                    oldStatus: booking.status,
                    newStatus: 'completed',
                    changedBy: userId,
                },
            });
            await this.processJobCompletionPayments(tx, u, staff, id);
            return u;
        });
        await this.notificationsService
            .notifyBookingStatusChanged(booking.customerId, 'completed', updated.service.name, id.toString())
            .catch((e) => console.warn('Notification create failed (completed):', e?.message));
        const result = {
            success: true,
            message: 'Job completed successfully',
            booking: this.serializeBooking(updated),
        };
        this.bookingsGateway.broadcastBookingUpdate(id.toString(), 'completed', result.booking);
        this.adminGateway.broadcastKpiUpdate('booking_status_changed', {
            id: id.toString(),
            status: 'completed',
        });
        const payoutHoldHours = await this.settingsService.getSettingNumber('PAYOUT_HOLD_HOURS', 72);
        await this.conversationsService
            .archiveJobConversation(id, payoutHoldHours)
            .catch((e) => console.warn('Failed to archive job conversation:', e?.message));
        return result;
    }
    async cancelBooking(id, reason, user) {
        const booking = await this.findOrFail(id);
        const isCustomer = booking.customerId === BigInt(user.id);
        const isAdmin = user.role === 'admin';
        let isCompanyOwner = false;
        if (user.role === 'company_admin') {
            const company = await this.prisma.company.findFirst({
                where: { ownerId: BigInt(user.id) },
            });
            if (company && company.id === booking.companyId) {
                isCompanyOwner = true;
            }
        }
        if (!isCustomer && !isAdmin && !isCompanyOwner) {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (booking.status === 'cancelled' || booking.status === 'completed') {
            throw new common_1.BadRequestException('Cannot cancel this booking');
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            (0, status_transitions_util_1.validateTransition)(booking.status, 'cancelled');
            const u = await tx.booking.update({
                where: { id },
                data: { status: 'cancelled' },
                include: {
                    customer: true,
                    company: {
                        select: { id: true, name: true, ownerId: true, logoUrl: true },
                    },
                    service: true,
                },
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
        if (user.role === 'customer' && updated.company?.ownerId) {
            await this.notificationsService
                .createNotification(updated.company.ownerId, 'booking_cancelled', 'Booking Cancelled', `A customer has cancelled booking #${id}. Reason: ${reason || 'None provided'}`, { bookingId: id.toString() })
                .catch((e) => console.warn('Notification create failed (cancelled):', e?.message));
        }
        else if (user.role !== 'customer') {
            await this.notificationsService
                .notifyBookingStatusChanged(booking.customerId, 'cancelled', updated.service.name, id.toString())
                .catch((e) => console.warn('Notification create failed (cancelled):', e?.message));
        }
        const result = {
            message: 'Booking cancelled successfully',
            booking: this.serializeBooking(updated),
        };
        this.bookingsGateway.broadcastBookingUpdate(id.toString(), 'cancelled', result.booking);
        this.adminGateway.broadcastKpiUpdate('booking_cancelled', {
            id: id.toString(),
        });
        return result;
    }
    async getMyAssignedBookings(userId, query) {
        const staff = await this.prisma.companyStaff.findFirst({
            where: { userId },
        });
        if (!staff)
            throw new common_1.ForbiddenException('You are not registered as staff');
        const { status, page = 1, limit = 10 } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { assignedStaffId: staff.id };
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
                    company: { select: { id: true, name: true, logoUrl: true } },
                    service: {
                        include: { serviceType: { include: { category: true } } },
                    },
                    payment: {
                        select: {
                            id: true,
                            bookingId: true,
                            userId: true,
                            amount: true,
                            status: true,
                            method: true,
                        },
                    },
                },
                orderBy: { bookingDate: 'asc' },
            }),
            this.prisma.booking.count({ where }),
        ]);
        return {
            success: true,
            bookings: bookings.map((b) => this.serializeBooking(b)),
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        };
    }
    async findOrFail(id, includeRelations = false) {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            include: includeRelations
                ? {
                    customer: true,
                    company: {
                        select: { id: true, name: true, ownerId: true, logoUrl: true },
                    },
                    service: true,
                    assignedStaff: { include: { user: true } },
                    payment: true,
                }
                : undefined,
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        return booking;
    }
    async processJobCompletionPayments(tx, u, staff, id) {
        if (u.payment && u.payment.method === 'cash') {
            if (u.payment.status === 'pending') {
                await tx.payment.update({
                    where: { id: u.payment.id },
                    data: { status: 'paid', paidAt: new Date() },
                });
            }
        }
        const platformFee = Number(u.platformFee || 0);
        const companyEarnings = Number(u.companyEarnings || 0);
        if (u.payment && u.payment.method === 'cash') {
            if (platformFee > 0) {
                await tx.transaction.create({
                    data: {
                        ownerType: 'company',
                        ownerId: u.companyId,
                        amount: platformFee,
                        type: 'debit',
                        category: 'commission',
                        description: `Platform fee for cash booking #${id}`,
                        bookingId: id,
                    },
                });
                const company = await tx.company.findUnique({
                    where: { id: u.companyId },
                    select: { availableBalance: true },
                });
                const currentAvail = Number(company?.availableBalance ?? 0);
                await tx.company.update({
                    where: { id: u.companyId },
                    data: {
                        availableBalance: Math.max(0, currentAvail - platformFee),
                        walletBalance: Math.max(0, currentAvail - platformFee),
                    },
                });
            }
        }
        else {
            if (companyEarnings > 0) {
                await tx.transaction.create({
                    data: {
                        ownerType: 'company',
                        ownerId: u.companyId,
                        amount: companyEarnings,
                        type: 'credit',
                        category: 'service_payment',
                        description: `Earnings pending for booking #${id} (held for dispute window)`,
                        bookingId: id,
                    },
                });
                await tx.company.update({
                    where: { id: u.companyId },
                    data: { pendingBalance: { increment: companyEarnings } },
                });
            }
        }
    }
    serializeBigIntFields(result) {
        const bigintFields = [
            'id',
            'customerId',
            'companyId',
            'serviceId',
            'assignedStaffId',
        ];
        for (const f of bigintFields) {
            if (result[f] != null)
                result[f] = result[f].toString();
        }
    }
    serializeRelatedEntities(result) {
        if (result.customer?.id) {
            result.customer = {
                ...result.customer,
                id: result.customer.id.toString(),
            };
        }
        if (result.company?.id) {
            result.company = {
                ...result.company,
                id: result.company.id.toString(),
                ownerId: result.company.ownerId?.toString(),
            };
        }
        if (result.service?.id) {
            result.service = {
                ...result.service,
                id: result.service.id.toString(),
                companyId: result.service.companyId?.toString(),
                serviceTypeId: result.service.serviceTypeId?.toString(),
                basePrice: result.service.basePrice
                    ? Number(result.service.basePrice)
                    : null,
            };
        }
        if (result.assignedStaff?.id) {
            const staff = result.assignedStaff;
            result.assignedStaff = {
                ...staff,
                id: staff.id.toString(),
                userId: staff.userId?.toString(),
                companyId: staff.companyId?.toString(),
                fullName: staff.user?.fullName ?? staff.fullName ?? null,
                phone: staff.user?.phone ?? staff.phone ?? null,
                email: staff.user?.email ?? staff.email ?? null,
                avatar: staff.user?.avatar ?? staff.avatar ?? null,
                user: staff.user
                    ? { ...staff.user, id: staff.user.id?.toString() }
                    : null,
            };
        }
    }
    serializeOptionalRecords(result) {
        if (result.payment?.id) {
            result.payment = {
                ...result.payment,
                id: result.payment.id.toString(),
                bookingId: result.payment.bookingId?.toString(),
                userId: result.payment.userId?.toString(),
                amount: result.payment.amount ? Number(result.payment.amount) : null,
            };
        }
        if (result.review?.id) {
            result.review = {
                ...result.review,
                id: result.review.id.toString(),
                bookingId: result.review.bookingId?.toString(),
                customerId: result.review.customerId?.toString(),
            };
        }
        if (result.cancellation?.id) {
            result.cancellation = {
                ...result.cancellation,
                id: result.cancellation.id.toString(),
                bookingId: result.cancellation.bookingId?.toString(),
                cancelledBy: result.cancellation.cancelledBy?.toString(),
            };
        }
        if (result.statusLogs) {
            result.statusLogs = result.statusLogs.map((l) => ({
                ...l,
                id: l.id?.toString(),
                bookingId: l.bookingId?.toString(),
                changedBy: l.changedBy?.toString(),
            }));
        }
    }
    serializeBooking(b) {
        if (!b)
            return null;
        const result = { ...b };
        this.serializeBigIntFields(result);
        this.serializeRelatedEntities(result);
        this.serializeOptionalRecords(result);
        if (result.totalPrice != null)
            result.totalPrice = Number(result.totalPrice);
        if (result.platformFee != null)
            result.platformFee = Number(result.platformFee);
        if (result.companyEarnings != null)
            result.companyEarnings = Number(result.companyEarnings);
        if (result.staffEarnings != null)
            result.staffEarnings = Number(result.staffEarnings);
        return result;
    }
    async uploadBookingPhoto(bookingId, file, photoType, user) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const fileExt = path.extname(file.originalname) || '.jpg';
        const fileName = `booking_${bookingId}_${photoType}_${Date.now()}${fileExt}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        const imageUrl = `/uploads/${fileName}`;
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        let notesObj = {};
        try {
            notesObj = JSON.parse(booking.staffNotes || '{}');
        }
        catch (e) {
            notesObj = { text: booking.staffNotes };
        }
        notesObj[photoType] = imageUrl;
        await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                staffNotes: JSON.stringify(notesObj),
            },
        });
        return {
            success: true,
            imageUrl,
            photoType,
        };
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => bookings_gateway_1.BookingsGateway))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => admin_gateway_1.AdminGateway))),
    __param(7, (0, common_1.Inject)((0, common_1.forwardRef)(() => conversations_service_1.ConversationsService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bookings_gateway_1.BookingsGateway,
        admin_gateway_1.AdminGateway,
        settings_service_1.SettingsService,
        analytics_service_1.AnalyticsService,
        notifications_service_1.NotificationsService,
        promo_codes_service_1.PromoCodesService,
        conversations_service_1.ConversationsService,
        event_emitter_1.EventEmitter2])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map