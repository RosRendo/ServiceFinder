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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
const swagger_1 = require("@nestjs/swagger");
const location_gateway_1 = require("./location.gateway");
const locationStore = new Map();
let LocationController = class LocationController {
    prisma;
    locationGateway;
    constructor(prisma, locationGateway) {
        this.prisma = prisma;
        this.locationGateway = locationGateway;
    }
    async updateLocation(bookingId, body, user) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: BigInt(bookingId) },
            include: { assignedStaff: { include: { user: true } } },
        });
        if (!booking)
            throw new common_1.ForbiddenException('Booking not found');
        const isAssigned = booking.assignedStaff?.userId === BigInt(user.id);
        const isAdmin = user.role === 'admin';
        if (!isAssigned && !isAdmin)
            throw new common_1.ForbiddenException('Not assigned to this booking');
        locationStore.set(bookingId, {
            lat: body.lat,
            lng: body.lng,
            accuracy: body.accuracy,
            heading: body.heading,
            updatedAt: new Date(),
        });
        this.locationGateway.server
            .to(`booking_${bookingId}`)
            .emit('staff_location_updated', {
            latitude: body.lat,
            longitude: body.lng,
            accuracy: body.accuracy,
            heading: body.heading,
        });
        return { success: true, message: 'Location updated' };
    }
    async getLocation(bookingId, user) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: BigInt(bookingId) },
            select: {
                customerId: true,
                assignedStaff: { select: { userId: true } },
                company: { select: { ownerId: true } },
                serviceAddress: true,
                latitude: true,
                longitude: true,
                status: true,
            },
        });
        if (!booking)
            throw new common_1.ForbiddenException('Booking not found');
        const uid = BigInt(user.id);
        const allowed = booking.customerId === uid ||
            booking.assignedStaff?.userId === uid ||
            booking.company.ownerId === uid ||
            user.role === 'admin';
        if (!allowed)
            throw new common_1.ForbiddenException('Access denied');
        const entry = locationStore.get(bookingId) ?? null;
        const isCustomer = booking.customerId === uid && user.role === 'customer';
        const showLocation = !isCustomer || ['confirmed', 'arrived', 'in_progress'].includes(booking.status);
        const activeEntry = showLocation ? entry : null;
        const stale = activeEntry && Date.now() - activeEntry.updatedAt.getTime() > 60_000;
        return {
            success: true,
            data: {
                staffLocation: activeEntry && !stale ? activeEntry : null,
                isOnline: !!activeEntry && !stale,
                serviceAddress: booking.serviceAddress,
                serviceLat: booking.latitude ? Number(booking.latitude) : null,
                serviceLng: booking.longitude ? Number(booking.longitude) : null,
                bookingStatus: booking.status,
                lastSeen: activeEntry?.updatedAt ?? null,
            },
        };
    }
};
exports.LocationController = LocationController;
__decorate([
    (0, common_1.Patch)(':bookingId'),
    (0, swagger_1.ApiOperation)({ summary: 'Staff updates their live location for a booking' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('bookingId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "updateLocation", null);
__decorate([
    (0, common_1.Get)(':bookingId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get staff live location for a booking' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('bookingId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getLocation", null);
exports.LocationController = LocationController = __decorate([
    (0, swagger_1.ApiTags)('Location'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('location'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        location_gateway_1.LocationGateway])
], LocationController);
//# sourceMappingURL=location.controller.js.map