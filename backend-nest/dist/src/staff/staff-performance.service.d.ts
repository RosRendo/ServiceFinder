import { PrismaService } from '../prisma/prisma.service';
export declare class StaffPerformanceService {
    private prisma;
    constructor(prisma: PrismaService);
    getPerformance(staffId: bigint): Promise<{
        success: boolean;
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
            todayCompleted: number;
            todayEarnings: number;
            weeklyCompleted: number;
            weeklyEarnings: number;
        };
    }>;
    getWallet(userId: bigint): Promise<{
        success: boolean;
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
    getStaffReviews(staffId: bigint, page?: number, limit?: number): Promise<{
        success: boolean;
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
    getAvailability(staffId: bigint): Promise<{
        success: boolean;
        availability: {
            id: bigint;
            startTime: Date;
            endTime: Date;
            companyId: bigint;
            staffId: bigint | null;
            date: Date;
            isAvailable: boolean;
        }[];
    }>;
    getStaffAvailabilityForCompany(userId: bigint, staffId: string): Promise<{
        success: boolean;
        availability: {
            id: bigint;
            startTime: Date;
            endTime: Date;
            companyId: bigint;
            staffId: bigint | null;
            date: Date;
            isAvailable: boolean;
        }[];
    }>;
    updateAvailability(staffId: bigint, slots: {
        date: string;
        startTime: string;
        endTime: string;
        isAvailable: boolean;
    }[]): Promise<{
        message: string;
        count: number;
    }>;
    getCompanyStaffPerformance(companyId: bigint): Promise<{
        success: boolean;
        staff: {
            staffId: string;
            user: {
                id: bigint;
                fullName: string;
                avatar: string | null;
            };
            role: import(".prisma/client").$Enums.StaffRole;
            completedJobs: number;
            totalJobs: number;
            avgRating: number;
            reviewCount: number;
        }[];
    }>;
}
