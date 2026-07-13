import { StaffPerformanceService } from './staff-performance.service';
export declare class StaffPerformanceController {
    private readonly staffPerformanceService;
    constructor(staffPerformanceService: StaffPerformanceService);
    getMyPerformance(req: any): Promise<{
        staffId: string;
        userId: string;
        user: {
            id: bigint;
            fullName: string;
            avatar: string | null;
        };
        company: {
            id: bigint;
            name: string;
        };
        role: import(".prisma/client").$Enums.StaffRole;
        status: import(".prisma/client").$Enums.StaffStatus;
        performance: {
            totalBookings: number;
            completedBookings: number;
            completionRate: number;
            avgRating: number;
            totalReviews: number;
            ratingDistribution: number[];
        };
    }>;
    getMyWallet(req: any): Promise<{
        walletBalance: number;
        creditLimit: number;
        transactions: {
            id: string;
            amount: number;
            type: string;
            description: string | null;
            createdAt: string;
        }[];
    }>;
    getStaffPerformance(id: string): Promise<{
        staffId: string;
        userId: string;
        user: {
            id: bigint;
            fullName: string;
            avatar: string | null;
        };
        company: {
            id: bigint;
            name: string;
        };
        role: import(".prisma/client").$Enums.StaffRole;
        status: import(".prisma/client").$Enums.StaffStatus;
        performance: {
            totalBookings: number;
            completedBookings: number;
            completionRate: number;
            avgRating: number;
            totalReviews: number;
            ratingDistribution: number[];
        };
    }>;
    getStaffAvailability(req: any, id: string): Promise<{
        availability: {
            id: bigint;
            companyId: bigint;
            startTime: Date;
            endTime: Date;
            staffId: bigint | null;
            date: Date;
            isAvailable: boolean;
        }[];
    }>;
    getMyReviews(req: any, page?: string, limit?: string): Promise<{
        reviews: ({
            customer: {
                id: bigint;
                fullName: string;
                avatar: string | null;
            };
            booking: {
                id: bigint;
                bookingDate: Date;
            };
        } & {
            id: bigint;
            createdAt: Date;
            customerId: bigint;
            bookingId: bigint;
            companyRating: number;
            companyComment: string | null;
            staffRating: number | null;
            staffComment: string | null;
            staffId: bigint | null;
        })[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getMyAvailability(req: any): Promise<{
        availability: {
            id: bigint;
            companyId: bigint;
            startTime: Date;
            endTime: Date;
            staffId: bigint | null;
            date: Date;
            isAvailable: boolean;
        }[];
    }>;
    updateMyAvailability(req: any, body: {
        slots: any[];
    }): Promise<{
        message: string;
        count: number;
    }>;
}
