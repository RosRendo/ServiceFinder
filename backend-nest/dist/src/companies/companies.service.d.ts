import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';
export declare class CompaniesService {
    private prisma;
    private mailService;
    private settingsService;
    constructor(prisma: PrismaService, mailService: MailService, settingsService: SettingsService);
    getAllCompanies(query: any): Promise<{
        companies: any[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getCompanyById(id: bigint): Promise<{
        services: ({
            serviceType: {
                category: {
                    id: bigint;
                    slug: string;
                    name: string;
                    description: string | null;
                    icon: string | null;
                    imageUrl: string | null;
                    status: import(".prisma/client").$Enums.CategoryStatus;
                    displayOrder: number;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: bigint;
                slug: string;
                name: string;
                description: string | null;
                icon: string | null;
                imageUrl: string | null;
                status: import(".prisma/client").$Enums.CategoryStatus;
                displayOrder: number;
                createdAt: Date;
                updatedAt: Date;
                categoryId: bigint;
            };
        } & {
            id: bigint;
            name: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            discountPrice: import("@prisma/client/runtime/library").Decimal | null;
            companyId: bigint;
            image: string | null;
            basePrice: import("@prisma/client/runtime/library").Decimal;
            features: import("@prisma/client/runtime/library").JsonValue | null;
            durationMin: number;
            durationMax: number | null;
            isActive: boolean;
            serviceTypeId: bigint;
        })[];
        staff: {
            id: bigint;
        }[];
        owner: {
            id: bigint;
            email: string | null;
            phone: string | null;
            fullName: string;
        };
        ratingSummary: {
            averageRating: import("@prisma/client/runtime/library").Decimal | null;
            totalReviews: number;
            lastUpdated: Date;
            companyId: bigint;
        } | null;
        serviceAreas: {
            city: string;
            coverageRadiusKm: number | null;
        }[];
    } & {
        id: bigint;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        phone: string | null;
        registrationNumber: string | null;
        address: string | null;
        city: string | null;
        latitude: import("@prisma/client/runtime/library").Decimal | null;
        longitude: import("@prisma/client/runtime/library").Decimal | null;
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
        walletBalance: import("@prisma/client/runtime/library").Decimal;
        ownerId: bigint;
    }>;
    createCompany(userId: bigint, dto: CreateCompanyDto): Promise<{
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
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            registrationNumber: string | null;
            address: string | null;
            city: string | null;
            latitude: import("@prisma/client/runtime/library").Decimal | null;
            longitude: import("@prisma/client/runtime/library").Decimal | null;
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
            walletBalance: import("@prisma/client/runtime/library").Decimal;
            ownerId: bigint;
        };
    }>;
    updateCompany(id: bigint, userId: bigint, role: string, updates: UpdateCompanyDto): Promise<{
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
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            registrationNumber: string | null;
            address: string | null;
            city: string | null;
            latitude: import("@prisma/client/runtime/library").Decimal | null;
            longitude: import("@prisma/client/runtime/library").Decimal | null;
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
            walletBalance: import("@prisma/client/runtime/library").Decimal;
            ownerId: bigint;
        };
    }>;
    deleteCompany(id: bigint, userId: bigint, role: string): Promise<{
        message: string;
    }>;
    getMyCompany(userId: bigint): Promise<{
        services: {
            id: bigint;
            name: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            discountPrice: import("@prisma/client/runtime/library").Decimal | null;
            companyId: bigint;
            image: string | null;
            basePrice: import("@prisma/client/runtime/library").Decimal;
            features: import("@prisma/client/runtime/library").JsonValue | null;
            durationMin: number;
            durationMax: number | null;
            isActive: boolean;
            serviceTypeId: bigint;
        }[];
        ratingSummary: {
            averageRating: import("@prisma/client/runtime/library").Decimal | null;
            totalReviews: number;
            lastUpdated: Date;
            companyId: bigint;
        } | null;
        serviceAreas: {
            id: bigint;
            city: string;
            companyId: bigint;
            coverageRadiusKm: number | null;
        }[];
    } & {
        id: bigint;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        phone: string | null;
        registrationNumber: string | null;
        address: string | null;
        city: string | null;
        latitude: import("@prisma/client/runtime/library").Decimal | null;
        longitude: import("@prisma/client/runtime/library").Decimal | null;
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
        walletBalance: import("@prisma/client/runtime/library").Decimal;
        ownerId: bigint;
    }>;
    getMyCompanyMetrics(userId: bigint): Promise<{
        revenue: number;
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
    getMyCompanyStaff(userId: bigint): Promise<{
        id: string;
        userId: string;
        fullName: string;
        email: string | null;
        avatar: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.StaffRole;
        status: import(".prisma/client").$Enums.StaffStatus;
        activeRequests: number;
        completedJobs: number;
        averageRating: number | null;
        totalReviews: number;
        isAvailable: boolean;
        joinedAt: string;
        walletBalance: number;
        creditLimit: number;
    }[]>;
    getStaffMemberById(staffId: bigint, userId: bigint): Promise<{
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
            email: string | null;
            phone: string | null;
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
    addStaffMember(userId: bigint, dto: any): Promise<{
        message: string;
        staff: {
            id: string;
            userId: string;
            role: import(".prisma/client").$Enums.StaffRole;
        };
        defaultPassword: string | null;
    }>;
    updateStaffMember(staffId: bigint, userId: bigint, updates: any): Promise<{
        success: boolean;
    }>;
    removeStaffMember(staffId: bigint, userId: bigint): Promise<{
        success: boolean;
    }>;
    reactivateStaffMember(staffId: bigint, userId: bigint): Promise<{
        success: boolean;
    }>;
    getStaffWallet(staffId: bigint, userId: bigint, role: string): Promise<{
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
    topUpStaffWallet(staffId: bigint, userId: bigint, body: any): Promise<{
        success: boolean;
        newBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
    getMyCompanyCampaigns(userId: bigint): Promise<{
        id: string;
        companyId: string;
        name: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
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
    getCompaniesByCategory(categorySlug: string, query: any): Promise<{
        success: boolean;
        data: {
            category: {
                id: string;
                slug: string;
                name: string;
                description: string | null;
                icon: string | null;
                imageUrl: string | null;
                status: import(".prisma/client").$Enums.CategoryStatus;
                displayOrder: number;
                createdAt: Date;
                updatedAt: Date;
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
                slug: string;
                name: string;
                description: string | null;
                icon: string | null;
                imageUrl: string | null;
                status: import(".prisma/client").$Enums.CategoryStatus;
                displayOrder: number;
                createdAt: Date;
                updatedAt: Date;
            };
            serviceType: {
                id: string;
                categoryId: string;
                slug: string;
                name: string;
                description: string | null;
                icon: string | null;
                imageUrl: string | null;
                status: import(".prisma/client").$Enums.CategoryStatus;
                displayOrder: number;
                createdAt: Date;
                updatedAt: Date;
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
                status: import(".prisma/client").$Enums.UserStatus;
                email: string | null;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
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
    getCompanySubscription(userId: bigint): Promise<{
        success: boolean;
        data: {
            plan: string;
            trialEndsAt: Date | null;
            isActive: boolean;
        };
    }>;
    upgradeSubscription(userId: bigint, planId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            plan: string;
            trialEndsAt: Date | null;
        };
    }>;
    private formatCompanies;
    addStaffAvailability(userId: bigint, staffId: bigint, dto: any): Promise<{
        id: bigint;
        companyId: bigint;
        startTime: Date;
        endTime: Date;
        staffId: bigint | null;
        date: Date;
        isAvailable: boolean;
    }>;
    generateStaffAvailability(userId: bigint, staffId: bigint, dto: any): Promise<{
        message: string;
    }>;
    getStaffAvailability(userId: bigint, staffId: bigint, startDateStr?: string, endDateStr?: string): Promise<{
        id: string;
        companyId: string;
        staffId: string | undefined;
        startTime: Date;
        endTime: Date;
        date: Date;
        isAvailable: boolean;
    }[]>;
    removeStaffAvailability(userId: bigint, slotId: bigint): Promise<{
        message: string;
    }>;
}
