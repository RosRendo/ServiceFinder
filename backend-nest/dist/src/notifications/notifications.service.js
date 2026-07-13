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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const expo_server_sdk_1 = __importDefault(require("expo-server-sdk"));
const mail_service_1 = require("../mail/mail.service");
let NotificationsService = class NotificationsService {
    prisma;
    mailService;
    expo;
    constructor(prisma, mailService) {
        this.prisma = prisma;
        this.mailService = mailService;
        this.expo = new expo_server_sdk_1.default();
    }
    async savePushToken(userId, pushToken) {
        if (!expo_server_sdk_1.default.isExpoPushToken(pushToken)) {
            console.warn(`Invalid Expo push token: ${pushToken}`);
            return;
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { pushToken },
        });
    }
    async sendToUser(userId, title, body, data = {}) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { pushToken: true, pushNotificationsEnabled: true },
        });
        if (!user?.pushNotificationsEnabled ||
            !user?.pushToken ||
            !expo_server_sdk_1.default.isExpoPushToken(user.pushToken)) {
            return;
        }
        await this.sendMessages([
            {
                to: user.pushToken,
                sound: 'default',
                title,
                body,
                data,
            },
        ]);
    }
    async sendToUsers(userIds, title, body, data = {}) {
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { pushToken: true, pushNotificationsEnabled: true },
        });
        const messages = users
            .filter((u) => u.pushNotificationsEnabled &&
            u.pushToken &&
            expo_server_sdk_1.default.isExpoPushToken(u.pushToken))
            .map((u) => ({
            to: u.pushToken,
            sound: 'default',
            title,
            body,
            data,
        }));
        if (messages.length === 0)
            return;
        await this.sendMessages(messages);
    }
    async createNotification(userId, type, title, message, data = {}, sendPush = true) {
        await this.prisma.notification.create({
            data: {
                userId,
                type,
                title,
                body: message,
                isRead: false,
                link: data?.bookingId ? `/bookings/${data.bookingId}` : null,
            },
        });
        if (sendPush) {
            await this.sendToUser(userId, title, message, data).catch((err) => {
                console.error('Push notification failed (non-blocking):', err);
            });
        }
    }
    async notifyBookingCreated(customerId, companyOwnerId, serviceName, bookingId) {
        await Promise.all([
            this.createNotification(customerId, 'booking_confirmed', '✅ Booking Confirmed', `Your booking for "${serviceName}" has been received!`, { bookingId }),
            this.createNotification(companyOwnerId, 'new_booking', '🔔 New Booking', `You have a new booking request for "${serviceName}"`, { bookingId }),
        ]);
        const [customer, owner] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: customerId },
                select: { email: true, fullName: true },
            }),
            this.prisma.user.findUnique({
                where: { id: companyOwnerId },
                select: { email: true, fullName: true },
            }),
        ]);
        if (customer?.email) {
            await this.mailService
                .sendBookingConfirmationEmail(customer.email, customer.fullName, serviceName, owner?.fullName || 'Company', new Date().toLocaleDateString(), new Date().toLocaleTimeString())
                .catch(console.error);
        }
        if (owner?.email) {
            await this.mailService
                .sendNewBookingEmail(owner.email, owner.fullName, serviceName, new Date().toLocaleDateString(), new Date().toLocaleTimeString())
                .catch(console.error);
        }
    }
    async notifyBookingStatusChanged(customerId, status, serviceName, bookingId) {
        const statusMessages = {
            confirmed: {
                title: '✅ Booking Confirmed',
                body: `"${serviceName}" has been confirmed.`,
            },
            in_progress: {
                title: '🔧 Work Started',
                body: `Your "${serviceName}" service has started.`,
            },
            completed: {
                title: '🎉 Service Completed',
                body: `"${serviceName}" is done! Please leave a review.`,
            },
            cancelled: {
                title: '❌ Booking Cancelled',
                body: `Your booking for "${serviceName}" was cancelled.`,
            },
        };
        const msg = statusMessages[status];
        if (!msg)
            return;
        await this.createNotification(customerId, `booking_${status}`, msg.title, msg.body, { bookingId });
        const customer = await this.prisma.user.findUnique({
            where: { id: customerId },
            select: { email: true, fullName: true },
        });
        if (customer?.email) {
            await this.mailService
                .sendBookingStatusChangedEmail(customer.email, customer.fullName, serviceName, status)
                .catch(console.error);
        }
    }
    async notifyPayoutProcessed(companyOwnerId, amount) {
        await this.createNotification(companyOwnerId, 'payout_processed', '💰 Payout Processed', `Your payout of $${amount.toFixed(2)} has been processed.`, { amount });
        const owner = await this.prisma.user.findUnique({
            where: { id: companyOwnerId },
            select: { email: true, fullName: true },
        });
        if (owner?.email) {
            await this.mailService
                .sendPayoutProcessedEmail(owner.email, owner.fullName, amount)
                .catch(console.error);
        }
    }
    async notifyCompanyVerified(companyOwnerId, companyName, approved) {
        const title = approved
            ? '✅ Company Verified!'
            : '❌ Verification Rejected';
        const message = approved
            ? `"${companyName}" has been approved! You can now accept bookings.`
            : `"${companyName}" verification was rejected. Please update your details and resubmit.`;
        await this.createNotification(companyOwnerId, approved ? 'company_verified' : 'company_rejected', title, message, { companyName });
        const owner = await this.prisma.user.findUnique({
            where: { id: companyOwnerId },
            select: { email: true, fullName: true },
        });
        if (owner?.email) {
            await this.mailService
                .sendCompanyVerifiedEmail(owner.email, owner.fullName, approved)
                .catch(console.error);
        }
    }
    async getNotificationsForUser(userId) {
        const notifications = await this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return notifications.map((n) => ({
            id: n.id.toString(),
            userId: n.userId.toString(),
            title: n.title,
            body: n.body,
            type: n.type,
            isRead: n.isRead,
            link: n.link,
            createdAt: n.createdAt,
        }));
    }
    async markAsRead(notificationId, userId) {
        await this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
        return { success: true };
    }
    async markAllAsRead(userId) {
        await this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
    async getUnreadCount(userId) {
        return this.prisma.notification.count({
            where: { userId, isRead: false },
        });
    }
    async sendMessages(messages) {
        const chunks = this.expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            try {
                const tickets = await this.expo.sendPushNotificationsAsync(chunk);
                for (const ticket of tickets) {
                    if (ticket.status === 'error') {
                        console.error('Push error:', ticket.message, ticket.details);
                    }
                }
            }
            catch (error) {
                console.error('Failed to send push chunk:', error);
            }
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map