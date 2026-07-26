import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AddAvailabilityDto, GenerateAvailabilityDto } from './dto/availability.dto';
export declare class CompaniesController {
    private readonly companiesService;
    constructor(companiesService: CompaniesService);
    getAllCompanies(query: any): Promise<{
        companies: any[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    createCompany(createCompanyDto: CreateCompanyDto, user: any): Promise<{
        message: string;
        company: {
            owner: {
                id: bigint;
                email: string | null;
                fullName: string;
            };
        } & {
            id: bigint;
            name: string;
            description: string | null;
            registrationNumber: string | null;
            address: string | null;
            city: string | null;
            latitude: import("@prisma/client/runtime/library").Decimal | null;
            longitude: import("@prisma/client/runtime/library").Decimal | null;
            phone: string | null;
            email: string | null;
            ownerId: bigint;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
            logoUrl: string | null;
            coverImageUrl: string | null;
            verificationDocumentUrl: string | null;
            establishedYear: number | null;
            cardHighlights: import("@prisma/client/runtime/library").JsonValue;
            detailHighlights: import("@prisma/client/runtime/library").JsonValue;
            subscriptionStatus: string;
            trialEndsAt: Date | null;
            nextBillingDate: Date | null;
            createdAt: Date;
            updatedAt: Date;
            walletBalance: import("@prisma/client/runtime/library").Decimal;
        };
    }>;
    getMyCompany(user: any): Promise<{
        ratingSummary: {
            companyId: bigint;
            averageRating: import("@prisma/client/runtime/library").Decimal | null;
            totalReviews: number;
            lastUpdated: Date;
        } | null;
        serviceAreas: {
            id: bigint;
            city: string;
            companyId: bigint;
            coverageRadiusKm: number | null;
        }[];
        services: {
            id: bigint;
            name: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            companyId: bigint;
            serviceTypeId: bigint;
            image: string | null;
            basePrice: import("@prisma/client/runtime/library").Decimal;
            discountPrice: import("@prisma/client/runtime/library").Decimal | null;
            features: import("@prisma/client/runtime/library").JsonValue | null;
            durationMin: number;
            durationMax: number | null;
        }[];
    } & {
        id: bigint;
        name: string;
        description: string | null;
        registrationNumber: string | null;
        address: string | null;
        city: string | null;
        latitude: import("@prisma/client/runtime/library").Decimal | null;
        longitude: import("@prisma/client/runtime/library").Decimal | null;
        phone: string | null;
        email: string | null;
        ownerId: bigint;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        logoUrl: string | null;
        coverImageUrl: string | null;
        verificationDocumentUrl: string | null;
        establishedYear: number | null;
        cardHighlights: import("@prisma/client/runtime/library").JsonValue;
        detailHighlights: import("@prisma/client/runtime/library").JsonValue;
        subscriptionStatus: string;
        trialEndsAt: Date | null;
        nextBillingDate: Date | null;
        createdAt: Date;
        updatedAt: Date;
        walletBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
    getMyCompanyMetrics(user: any): Promise<{
        revenue: number;
        escrowBalance: number;
        availableBalance: number;
        activeBookings: number;
        completionRate: number;
        averageRating: number;
        totalReviews: number;
        weeklyData: any[];
        weeklyTotal: any;
        activities: {
            id: string;
            type: string | null;
            icon: string;
            iconBg: string;
            iconColor: string;
            title: string;
            subtitle: string;
        }[];
        serviceBreakdown: {
            name: string;
            value: number;
        }[];
        statusDistribution: {
            name: string;
            value: number;
            fill: string;
        }[];
        monthlyData: any[];
    }>;
    getMyCompanyStaff(user: any): Promise<{
        id: string;
        userId: string;
        name: string;
        fullName: string;
        email: string | null;
        avatar: string | null;
        phone: string;
        role: string;
        status: string;
        rating: number;
        jobsCompleted: number;
        todayJobs: number;
        earningsToday: number;
        pendingPayout: number;
        tips: number;
        attendance: number;
        onTimeRate: number;
        currentLocation: string;
        activeJob: undefined;
        compliance: {
            label: string;
            verified: boolean;
        }[];
        schedule: {
            time: string;
            service: string;
            status: string;
        }[];
        activeRequests: number;
        averageRating: number | null;
        totalReviews: number;
        isAvailable: boolean;
        joinedAt: string;
        walletBalance: number;
        creditLimit: number;
    }[]>;
    getMyCompanyCustomers(user: any, query: any): Promise<{
        customers: {
            id: string;
            fullName: string;
            email: string | null;
            phone: string | null;
            profilePictureUrl: string | null;
            status: import(".prisma/client").$Enums.UserStatus;
            stats: {
                totalBookings: number;
                ltv: number;
                activeDisputes: number;
                lastActivity: Date | null;
            };
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getMyCompanyReviews(user: any, query: any): Promise<{
        reviews: {
            id: string;
            customer: string;
            company: string;
            staff: string;
            rating: number;
            text: string;
            service: string;
            date: string;
            status: string;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getMyCompanyRevenue(user: any): Promise<{
        revenueData: {
            gross: number;
            net: number;
            day: string;
        }[];
        kpis: {
            label: string;
            value: string;
            change: string;
            up: boolean;
        }[];
    }>;
    getStaffMemberById(staffId: string, user: any): Promise<{
        id: string;
        userId: string;
        role: import(".prisma/client").$Enums.StaffRole;
        status: import(".prisma/client").$Enums.StaffStatus;
        createdAt: string;
        activeRequests: number;
        completedJobs: number;
        averageRating: number | null;
        walletBalance: number;
        creditLimit: number;
        user: {
            id: bigint;
            phone: string | null;
            email: string | null;
            fullName: string;
            avatar: string | null;
        };
        recentBookings: {
            id: string;
            serviceName: string;
            customerName: string;
            customerAvatar: string | null;
            status: import(".prisma/client").$Enums.BookingStatus;
            date: string;
        }[];
        recentReviews: {
            id: string;
            rating: number;
            comment: string | null;
            customerName: string;
            customerAvatar: string | null;
            date: string;
        }[];
    }>;
    addStaffMember(body: any, user: any): Promise<{
        message: string;
        staff: {
            id: string;
            userId: string;
            role: import(".prisma/client").$Enums.StaffRole;
        };
        defaultPassword: string | null;
    }>;
    updateStaffMember(staffId: string, body: any, user: any): Promise<{
        success: boolean;
    }>;
    removeStaffMember(staffId: string, user: any): Promise<{
        success: boolean;
    }>;
    reactivateStaffMember(staffId: string, user: any): Promise<{
        success: boolean;
    }>;
    getStaffWallet(staffId: string, user: any): Promise<{
        walletBalance: import("@prisma/client/runtime/library").Decimal;
        creditLimit: import("@prisma/client/runtime/library").Decimal;
        transactions: {
            id: string;
            staffId: string;
            bookingId: string | undefined;
            booking: {
                id: bigint;
                service: {
                    name: string;
                };
            } | null;
            description: string | null;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            type: string;
        }[];
    }>;
    topUpStaffWallet(staffId: string, body: any, user: any): Promise<{
        success: boolean;
        newBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
    getCompanySubscription(user: any): Promise<{
        success: boolean;
        data: {
            plan: string;
            trialEndsAt: Date | null;
            isActive: boolean;
        };
    }>;
    upgradeSubscription(body: {
        planId: string;
    }, user: any): Promise<{
        success: boolean;
        message: string;
        data: {
            plan: string;
            trialEndsAt: Date | null;
        };
    }>;
    getMyCompanyCampaigns(user: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        budget: import("@prisma/client/runtime/library").Decimal;
        spent: import("@prisma/client/runtime/library").Decimal;
        impressions: number;
        clicks: number;
        conversions: number;
        startDate: Date;
        endDate: Date | null;
    }[]>;
    getFeaturedCompanies(query: any): Promise<{
        data: any[];
    }>;
    getNearbyCompanies(query: any): Promise<{
        data: any[];
    }>;
    getNewCompanies(query: any): Promise<{
        data: any[];
    }>;
    getRecommendedCompanies(query: any): Promise<{
        data: any[];
    }>;
    getAdminStats(): Promise<{
        success: boolean;
        stats: {
            totalUsers: number;
            newUsersThisWeek: number;
            totalCompanies: number;
            pendingCompanies: number;
            totalBookings: number;
            activeBookings: number;
            totalRevenue: number;
            recentUsers: {
                id: string;
                createdAt: string;
                email: string | null;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
                status: import(".prisma/client").$Enums.UserStatus;
            }[];
            recentBookings: {
                id: string;
                customerName: string;
                serviceName: string;
                companyName: string;
                status: import(".prisma/client").$Enums.BookingStatus;
                price: number;
                createdAt: string;
            }[];
            topCategories: {
                name: string;
                slug: string;
                bookings: number;
            }[];
            bookingsByMonth: {
                month: string;
                count: number;
            }[];
            usersByMonth: {
                month: string;
                count: number;
            }[];
        };
    }>;
    getAdminAnalytics(): Promise<{
        success: boolean;
        data: {
            totalRevenue: number;
            revenueGrowth: number;
            totalBookings: number;
            bookingsGrowth: number;
            totalUsers: number;
            usersGrowth: number;
            totalCompanies: number;
            pendingCompanies: number;
            activeBookings: number;
            completedBookings: number;
            cancelledBookings: number;
            avgBookingValue: number;
            conversionRate: number;
            monthlyData: {
                name: string;
                bookings: number;
                revenue: number;
            }[];
            statusBreakdown: {
                name: string;
                value: number;
                color: string;
            }[];
            weeklyStats: {
                day: string;
                bookings: number;
            }[];
            categoryData: {
                name: string;
                value: number;
            }[];
            topCompanies: {
                name: string;
                completedJobs: number;
                rating: number;
                revenue: string;
            }[];
        };
    }>;
    getCompaniesByCategory(categorySlug: string, query: any): Promise<{
        success: boolean;
        data: {
            category: {
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.CategoryStatus;
                slug: string;
                icon: string | null;
                imageUrl: string | null;
                displayOrder: number;
            };
            companies: any[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                pages: number;
            };
        };
    }>;
    getCompaniesByServiceType(categorySlug: string, serviceTypeSlug: string, query: any): Promise<{
        success: boolean;
        data: {
            category: {
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.CategoryStatus;
                slug: string;
                icon: string | null;
                imageUrl: string | null;
                displayOrder: number;
            };
            serviceType: {
                id: string;
                categoryId: string;
                name: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.CategoryStatus;
                slug: string;
                icon: string | null;
                imageUrl: string | null;
                displayOrder: number;
            };
            companies: any[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                pages: number;
            };
        };
    }>;
    getCompanyById(id: string): Promise<{
        owner: {
            id: bigint;
            phone: string | null;
            email: string | null;
            fullName: string;
        };
        ratingSummary: {
            companyId: bigint;
            averageRating: import("@prisma/client/runtime/library").Decimal | null;
            totalReviews: number;
            lastUpdated: Date;
        } | null;
        staff: {
            id: bigint;
        }[];
        serviceAreas: {
            city: string;
            coverageRadiusKm: number | null;
        }[];
        services: ({
            serviceType: {
                category: {
                    id: bigint;
                    name: string;
                    description: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    status: import(".prisma/client").$Enums.CategoryStatus;
                    slug: string;
                    icon: string | null;
                    imageUrl: string | null;
                    displayOrder: number;
                };
            } & {
                id: bigint;
                name: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.CategoryStatus;
                slug: string;
                icon: string | null;
                imageUrl: string | null;
                displayOrder: number;
                categoryId: bigint;
            };
        } & {
            id: bigint;
            name: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            companyId: bigint;
            serviceTypeId: bigint;
            image: string | null;
            basePrice: import("@prisma/client/runtime/library").Decimal;
            discountPrice: import("@prisma/client/runtime/library").Decimal | null;
            features: import("@prisma/client/runtime/library").JsonValue | null;
            durationMin: number;
            durationMax: number | null;
        })[];
    } & {
        id: bigint;
        name: string;
        description: string | null;
        registrationNumber: string | null;
        address: string | null;
        city: string | null;
        latitude: import("@prisma/client/runtime/library").Decimal | null;
        longitude: import("@prisma/client/runtime/library").Decimal | null;
        phone: string | null;
        email: string | null;
        ownerId: bigint;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        logoUrl: string | null;
        coverImageUrl: string | null;
        verificationDocumentUrl: string | null;
        establishedYear: number | null;
        cardHighlights: import("@prisma/client/runtime/library").JsonValue;
        detailHighlights: import("@prisma/client/runtime/library").JsonValue;
        subscriptionStatus: string;
        trialEndsAt: Date | null;
        nextBillingDate: Date | null;
        createdAt: Date;
        updatedAt: Date;
        walletBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateCompany(id: string, updateCompanyDto: UpdateCompanyDto, user: any): Promise<{
        message: string;
        company: {
            owner: {
                id: bigint;
                email: string | null;
                fullName: string;
            };
        } & {
            id: bigint;
            name: string;
            description: string | null;
            registrationNumber: string | null;
            address: string | null;
            city: string | null;
            latitude: import("@prisma/client/runtime/library").Decimal | null;
            longitude: import("@prisma/client/runtime/library").Decimal | null;
            phone: string | null;
            email: string | null;
            ownerId: bigint;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
            logoUrl: string | null;
            coverImageUrl: string | null;
            verificationDocumentUrl: string | null;
            establishedYear: number | null;
            cardHighlights: import("@prisma/client/runtime/library").JsonValue;
            detailHighlights: import("@prisma/client/runtime/library").JsonValue;
            subscriptionStatus: string;
            trialEndsAt: Date | null;
            nextBillingDate: Date | null;
            createdAt: Date;
            updatedAt: Date;
            walletBalance: import("@prisma/client/runtime/library").Decimal;
        };
    }>;
    deleteCompany(id: string, user: any): Promise<{
        message: string;
    }>;
    addStaffAvailability(staffId: string, dto: AddAvailabilityDto, user: any): Promise<{
        id: bigint;
        companyId: bigint;
        startTime: Date;
        endTime: Date;
        staffId: bigint | null;
        date: Date;
        isAvailable: boolean;
    }>;
    generateStaffAvailability(staffId: string, dto: GenerateAvailabilityDto, user: any): Promise<{
        message: string;
    }>;
    getStaffAvailability(staffId: string, startDate: string, endDate: string, user: any): Promise<{
        id: string;
        companyId: string;
        staffId: string | undefined;
        startTime: Date;
        endTime: Date;
        date: Date;
        isAvailable: boolean;
    }[]>;
    removeStaffAvailability(slotId: string, user: any): Promise<{
        message: string;
    }>;
}
