import { PrismaService } from '../../prisma/prisma.service';
import { ConversationsService } from '../../conversations/conversations.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { SettingsService } from '../../settings/settings.service';
import { BookingAssignedEvent, BookingAcceptedEvent, BookingRejectedEvent, BookingCompletedEvent, DisputeOpenedEvent } from '../events/booking.events';
export declare class BookingListener {
    private readonly prisma;
    private readonly notificationsService;
    private readonly settingsService;
    private readonly conversationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, settingsService: SettingsService, conversationsService: ConversationsService);
    handleBookingAssigned(event: BookingAssignedEvent): Promise<void>;
    handleBookingAccepted(event: BookingAcceptedEvent): Promise<void>;
    handleBookingRejected(event: BookingRejectedEvent): Promise<void>;
    handleBookingCompleted(event: BookingCompletedEvent): Promise<void>;
    handleDisputeOpened(event: DisputeOpenedEvent): Promise<void>;
}
