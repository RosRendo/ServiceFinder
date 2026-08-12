import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingsGateway } from './bookings.gateway';
import { AdminGateway } from '../admin/admin.gateway';
import { SettingsService } from '../settings/settings.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PromoCodesService } from '../promo-codes/promo-codes.service';
import { ConversationsService } from '../conversations/conversations.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class BookingsService {
    private prisma;
    private bookingsGateway;
    private adminGateway;
    private settingsService;
    private analytics;
    private notificationsService;
    private promoCodesService;
    private conversationsService;
    private eventEmitter;
    constructor(prisma: PrismaService, bookingsGateway: BookingsGateway, adminGateway: AdminGateway, settingsService: SettingsService, analytics: AnalyticsService, notificationsService: NotificationsService, promoCodesService: PromoCodesService, conversationsService: ConversationsService, eventEmitter: EventEmitter2);
    getAllBookings(query: any, user: any): Promise<{
        bookings: any[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getBookingById(id: bigint, user: any): Promise<{
        booking: any;
    }>;
    createBooking(dto: CreateBookingDto, user: any): Promise<{
        success: boolean;
        message: string;
        data: {
            id: any;
            customerId: any;
            companyId: any;
            serviceId: any;
            bookingDate: any;
            startTime: any;
            endTime: any;
            serviceAddress: any;
            latitude: any;
            longitude: any;
            basePrice: number;
            totalPrice: number;
            platformFee: number;
            companyEarnings: number;
            staffEarnings: number;
            status: any;
            customer: any;
            company: any;
            service: any;
            createdAt: any;
            updatedAt: any;
        };
    }>;
    updateBookingStatus(id: bigint, status: string, user: any): Promise<{
        message: string;
        booking: any;
    }>;
    assignStaff(id: bigint, staffId: string, user: any): Promise<{
        success: boolean;
        message: string;
        booking: any;
    }>;
    claimBooking(bookingId: bigint, userId: bigint): Promise<{
        success: boolean;
        message: string;
        booking: any;
    }>;
    acceptAssignment(id: bigint, userId: bigint): Promise<{
        success: boolean;
        message: string;
        booking: any;
    }>;
    enRouteJob(id: bigint, userId: bigint): Promise<{
        success: boolean;
        message: string;
        booking: any;
    }>;
    rejectAssignment(id: bigint, userId: bigint): Promise<{
        success: boolean;
        message: string;
        booking: any;
    }>;
    startJob(id: bigint, userId: bigint, staffStartLat?: number, staffStartLng?: number): Promise<{
        success: boolean;
        message: string;
        booking: any;
    }>;
    arriveJob(id: bigint, userId: bigint): Promise<{
        success: boolean;
        message: string;
        booking: any;
    }>;
    updateProgress(id: bigint, userId: bigint, progressPercent: number, staffNotes?: string, checklist?: any): Promise<{
        success: boolean;
        message: string;
        booking: any;
    }>;
    completeJob(id: bigint, userId: bigint, proofOfWorkPhoto?: string): Promise<{
        success: boolean;
        message: string;
        booking: any;
    }>;
    cancelBooking(id: bigint, reason: string | undefined, user: any): Promise<{
        message: string;
        booking: any;
    }>;
    getMyAssignedBookings(userId: bigint, query: any): Promise<{
        success: boolean;
        bookings: any[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    private findOrFail;
    private processJobCompletionPayments;
    private serializeBigIntFields;
    private serializeRelatedEntities;
    private serializeOptionalRecords;
    private serializeBooking;
    uploadBookingPhoto(bookingId: bigint, file: any, photoType: 'before' | 'after', user: any): Promise<{
        success: boolean;
        imageUrl: string;
        photoType: "before" | "after";
    }>;
}
