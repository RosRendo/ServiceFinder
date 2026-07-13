import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
export declare class NotificationsService {
    private prisma;
    private mailService;
    private expo;
    constructor(prisma: PrismaService, mailService: MailService);
    savePushToken(userId: bigint, pushToken: string): Promise<void>;
    sendToUser(userId: bigint, title: string, body: string, data?: Record<string, any>): Promise<void>;
    sendToUsers(userIds: bigint[], title: string, body: string, data?: Record<string, any>): Promise<void>;
    createNotification(userId: bigint, type: string, title: string, message: string, data?: any, sendPush?: boolean): Promise<void>;
    notifyBookingCreated(customerId: bigint, companyOwnerId: bigint, serviceName: string, bookingId: string): Promise<void>;
    notifyBookingStatusChanged(customerId: bigint, status: string, serviceName: string, bookingId: string): Promise<void>;
    notifyPayoutProcessed(companyOwnerId: bigint, amount: number): Promise<void>;
    notifyCompanyVerified(companyOwnerId: bigint, companyName: string, approved: boolean): Promise<void>;
    getNotificationsForUser(userId: bigint): Promise<{
        id: string;
        userId: string;
        title: string;
        body: string;
        type: string;
        isRead: boolean;
        link: string | null;
        createdAt: Date;
    }[]>;
    markAsRead(notificationId: bigint, userId: bigint): Promise<{
        success: boolean;
    }>;
    markAllAsRead(userId: bigint): Promise<void>;
    getUnreadCount(userId: bigint): Promise<number>;
    private sendMessages;
}
