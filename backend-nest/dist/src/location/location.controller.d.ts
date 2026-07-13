import { PrismaService } from '../prisma/prisma.service';
import { LocationGateway } from './location.gateway';
interface LocationEntry {
    lat: number;
    lng: number;
    accuracy?: number;
    heading?: number;
    updatedAt: Date;
}
export declare class LocationController {
    private readonly prisma;
    private readonly locationGateway;
    constructor(prisma: PrismaService, locationGateway: LocationGateway);
    updateLocation(bookingId: string, body: {
        lat: number;
        lng: number;
        accuracy?: number;
        heading?: number;
    }, user: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getLocation(bookingId: string, user: any): Promise<{
        success: boolean;
        data: {
            staffLocation: LocationEntry | null;
            isOnline: boolean;
            serviceAddress: string;
            serviceLat: number | null;
            serviceLng: number | null;
            bookingStatus: import(".prisma/client").$Enums.BookingStatus;
            lastSeen: Date | null;
        };
    }>;
}
export {};
