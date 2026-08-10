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
exports.BookingListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../prisma/prisma.service");
const conversations_service_1 = require("../../conversations/conversations.service");
const notifications_service_1 = require("../../notifications/notifications.service");
const settings_service_1 = require("../../settings/settings.service");
const booking_events_1 = require("../events/booking.events");
let BookingListener = class BookingListener {
    prisma;
    notificationsService;
    settingsService;
    conversationsService;
    constructor(prisma, notificationsService, settingsService, conversationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.settingsService = settingsService;
        this.conversationsService = conversationsService;
    }
    async handleBookingAssigned(event) {
        const staff = await this.prisma.companyStaff.findUnique({
            where: { id: event.staffId },
            include: { user: true },
        });
        if (!staff)
            return;
        await this.notificationsService
            .createNotification(staff.userId, 'new_assignment', 'New Job Assignment', `You have been assigned to a new booking. Please accept or reject it.`, { bookingId: event.bookingId.toString() })
            .catch((e) => console.warn('Assigned notification failed:', e.message));
    }
    async handleBookingAccepted(event) {
        const staff = await this.prisma.companyStaff.findUnique({
            where: { id: event.staffId },
            include: { user: true },
        });
        if (!staff)
            return;
        await this.conversationsService
            .getOrCreateConversation(event.customerId, {
            type: 'job',
            bookingId: event.bookingId.toString(),
        })
            .catch((e) => console.warn('Failed to auto-create job chat:', e.message));
        await this.notificationsService
            .createNotification(event.customerId, 'staff_assigned', 'Staff Accepted Your Job', `${staff.user.fullName} has accepted your booking and is preparing for service.`, { bookingId: event.bookingId.toString() })
            .catch((e) => console.warn('Accepted notification failed:', e.message));
    }
    async handleBookingRejected(event) {
        const staff = await this.prisma.companyStaff.findUnique({
            where: { id: event.staffId },
            include: { user: true },
        });
        if (!staff)
            return;
        const company = await this.prisma.company.findUnique({
            where: { id: event.companyId },
        });
        if (!company)
            return;
        await this.notificationsService
            .createNotification(company.ownerId, 'assignment_rejected', 'Assignment Rejected by Staff', `Staff member ${staff.user.fullName} has rejected the assignment for booking #${event.bookingId.toString()}. Job returned to dispatch queue.`, { bookingId: event.bookingId.toString() })
            .catch((e) => console.warn('Rejected notification failed:', e.message));
    }
    async handleBookingCompleted(event) {
        const holdHours = await this.settingsService.getSettingNumber('PAYOUT_HOLD_HOURS', 72);
        const archivedAt = new Date(Date.now() + holdHours * 60 * 60 * 1000);
        await this.prisma.conversation
            .updateMany({
            where: { bookingId: event.bookingId },
            data: { archivedAt },
        })
            .catch((e) => console.warn('Failed to schedule chat archival:', e.message));
        await this.notificationsService
            .createNotification(event.customerId, 'job_completed', 'Service Completed', `Your booking has been completed! Please rate your service.`, { bookingId: event.bookingId.toString() })
            .catch((e) => console.warn('Completed notification failed:', e.message));
    }
    async handleDisputeOpened(event) {
        const company = await this.prisma.company.findUnique({
            where: { id: event.companyId },
        });
        if (!company)
            return;
        await this.notificationsService
            .createNotification(company.ownerId, 'dispute_opened', 'Dispute Opened', `A dispute has been opened for booking #${event.bookingId.toString()}. Payout frozen.`, { bookingId: event.bookingId.toString() })
            .catch((e) => console.warn('Dispute notification failed:', e.message));
    }
};
exports.BookingListener = BookingListener;
__decorate([
    (0, event_emitter_1.OnEvent)('booking.assigned'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [booking_events_1.BookingAssignedEvent]),
    __metadata("design:returntype", Promise)
], BookingListener.prototype, "handleBookingAssigned", null);
__decorate([
    (0, event_emitter_1.OnEvent)('booking.accepted'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [booking_events_1.BookingAcceptedEvent]),
    __metadata("design:returntype", Promise)
], BookingListener.prototype, "handleBookingAccepted", null);
__decorate([
    (0, event_emitter_1.OnEvent)('booking.rejected'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [booking_events_1.BookingRejectedEvent]),
    __metadata("design:returntype", Promise)
], BookingListener.prototype, "handleBookingRejected", null);
__decorate([
    (0, event_emitter_1.OnEvent)('booking.completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [booking_events_1.BookingCompletedEvent]),
    __metadata("design:returntype", Promise)
], BookingListener.prototype, "handleBookingCompleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)('dispute.opened'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [booking_events_1.DisputeOpenedEvent]),
    __metadata("design:returntype", Promise)
], BookingListener.prototype, "handleDisputeOpened", null);
exports.BookingListener = BookingListener = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => conversations_service_1.ConversationsService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        settings_service_1.SettingsService,
        conversations_service_1.ConversationsService])
], BookingListener);
//# sourceMappingURL=booking.listener.js.map