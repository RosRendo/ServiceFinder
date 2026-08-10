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
exports.BookingsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const bookings_service_1 = require("./bookings.service");
const create_booking_dto_1 = require("./dto/create-booking.dto");
const booking_actions_dto_1 = require("./dto/booking-actions.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let BookingsController = class BookingsController {
    bookingsService;
    constructor(bookingsService) {
        this.bookingsService = bookingsService;
    }
    getAllBookings(query, req) {
        const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
        return this.bookingsService.getAllBookings(query, user);
    }
    getMyAssignedBookings(req, query) {
        return this.bookingsService.getMyAssignedBookings(BigInt(req.user?.id || req.user?.userId || 0), query);
    }
    getBookingById(id, req) {
        const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
        return this.bookingsService.getBookingById(BigInt(id), user);
    }
    createBooking(createBookingDto, req) {
        const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
        return this.bookingsService.createBooking(createBookingDto, user);
    }
    updateBookingStatus(id, dto, req) {
        const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
        return this.bookingsService.updateBookingStatus(BigInt(id), dto.status, user);
    }
    assignStaff(id, dto, req) {
        const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
        return this.bookingsService.assignStaff(BigInt(id), dto.staffId, user);
    }
    acceptAssignment(id, req) {
        const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
        return this.bookingsService.acceptAssignment(BigInt(id), BigInt(user.id));
    }
    rejectAssignment(id, req) {
        const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
        return this.bookingsService.rejectAssignment(BigInt(id), BigInt(user.id));
    }
    claimBooking(id, req) {
        const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
        return this.bookingsService.claimBooking(BigInt(id), BigInt(user.id));
    }
    startJob(id, body, req) {
        const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
        return this.bookingsService.startJob(BigInt(id), BigInt(user.id), body?.staffStartLatitude, body?.staffStartLongitude);
    }
    updateProgress(id, dto, req) {
        const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
        return this.bookingsService.updateProgress(BigInt(id), BigInt(user.id), dto.progressPercent, dto.staffNotes, dto.checklist);
    }
    completeJob(id, body, req) {
        const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
        return this.bookingsService.completeJob(BigInt(id), BigInt(user.id), body?.proofOfWorkPhoto);
    }
    cancelBooking(id, dto, req) {
        const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
        return this.bookingsService.cancelBooking(BigInt(id), dto.reason, user);
    }
    async uploadBookingPhoto(file, bookingIdStr, photoType, req) {
        const bookingId = BigInt(bookingIdStr);
        return this.bookingsService.uploadBookingPhoto(bookingId, file, photoType, req.user);
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all bookings' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return all bookings.' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "getAllBookings", null);
__decorate([
    (0, common_1.Get)('my-assignments'),
    (0, swagger_1.ApiOperation)({ summary: 'Get bookings assigned to the current staff user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return assigned bookings.' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "getMyAssignedBookings", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get booking by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return booking details.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Booking not found.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "getBookingById", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('customer', 'company_admin', 'admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new booking' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Booking successfully created.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_booking_dto_1.CreateBookingDto, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "createBooking", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'company_admin', 'staff'),
    (0, swagger_1.ApiOperation)({ summary: 'Update booking status (Admin/Company Admin)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The booking status has been successfully updated.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, booking_actions_dto_1.UpdateBookingStatusDto, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "updateBookingStatus", null);
__decorate([
    (0, common_1.Patch)(':id/assign-staff'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'company_admin', 'staff'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign staff to booking (Admin/Company Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Staff successfully assigned.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, booking_actions_dto_1.AssignStaffDto, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "assignStaff", null);
__decorate([
    (0, common_1.Patch)(':id/accept'),
    (0, swagger_1.ApiOperation)({ summary: 'Accept a job assignment (Assigned staff only)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Job assignment successfully accepted.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "acceptAssignment", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a job assignment (Assigned staff only)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Job assignment successfully rejected.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "rejectAssignment", null);
__decorate([
    (0, common_1.Patch)(':id/claim'),
    (0, swagger_1.ApiOperation)({
        summary: 'Claim an unassigned booking from the company pool (Open Pool mode, Staff only)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Booking successfully claimed.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "claimBooking", null);
__decorate([
    (0, common_1.Patch)(':id/start'),
    (0, swagger_1.ApiOperation)({ summary: 'Start a job (Assigned staff only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Job successfully started.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "startJob", null);
__decorate([
    (0, common_1.Patch)(':id/progress'),
    (0, swagger_1.ApiOperation)({ summary: 'Update job progress (Assigned staff only)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Job progress successfully updated.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, booking_actions_dto_1.UpdateProgressDto, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "updateProgress", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Complete a job (Assigned staff only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Job successfully completed.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "completeJob", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a booking' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Booking successfully canceled.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, booking_actions_dto_1.CancelBookingDto, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "cancelBooking", null);
__decorate([
    (0, common_1.Post)('photos'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload before/after evidence photos for a booking',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Photo uploaded successfully.' }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('bookingId')),
    __param(2, (0, common_1.Body)('photoType')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "uploadBookingPhoto", null);
exports.BookingsController = BookingsController = __decorate([
    (0, swagger_1.ApiTags)('Bookings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('bookings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map