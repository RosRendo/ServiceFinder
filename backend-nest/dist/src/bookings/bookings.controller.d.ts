import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto, AssignStaffDto, UpdateProgressDto, CancelBookingDto } from './dto/booking-actions.dto';
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    getAllBookings(query: any, req: any): Promise<{
        bookings: any[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getMyAssignedBookings(req: any, query: any): Promise<{
        success: boolean;
        bookings: any[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getBookingById(id: string, req: any): Promise<{
        booking: any;
    }>;
    createBooking(createBookingDto: CreateBookingDto, req: any): Promise<{
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
    updateBookingStatus(id: string, dto: UpdateBookingStatusDto, req: any): Promise<{
        message: string;
        booking: any;
    }>;
    assignStaff(id: string, dto: AssignStaffDto, req: any): Promise<{
        success: boolean;
        message: string;
        booking: any;
    }>;
    acceptAssignment(id: string, req: any): Promise<{
        success: boolean;
        message: string;
        booking: any;
    }>;
    rejectAssignment(id: string, req: any): Promise<{
        success: boolean;
        message: string;
        booking: any;
    }>;
    startJob(id: string, body: any, req: any): Promise<{
        success: boolean;
        message: string;
        booking: any;
    }>;
    updateProgress(id: string, dto: UpdateProgressDto, req: any): Promise<{
        success: boolean;
        message: string;
        booking: any;
    }>;
    completeJob(id: string, body: any, req: any): Promise<{
        success: boolean;
        message: string;
        booking: any;
    }>;
    cancelBooking(id: string, dto: CancelBookingDto, req: any): Promise<{
        message: string;
        booking: any;
    }>;
    uploadBookingPhoto(file: Express.Multer.File, bookingIdStr: string, photoType: 'before' | 'after', req: any): Promise<{
        success: boolean;
        imageUrl: string;
        photoType: "before" | "after";
    }>;
}
