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
    getCompanyCustomers(companyId: bigint, query: any): Promise<{
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
    getCompanyCustomerDetail(companyId: bigint, customerId: bigint): Promise<{
        id: string;
        fullName: string;
        email: string | null;
        phone: string | null;
        profilePictureUrl: string | null;
        status: import(".prisma/client").$Enums.UserStatus;
        memberSince: Date;
        stats: {
            totalBookings: number;
            ltv: number;
            activeDisputes: number;
            lastActivity: Date | null;
        };
        bookings: {
            id: string;
            serviceName: string;
            serviceCategory: string;
            date: Date;
            startTime: Date;
            endTime: Date;
            status: import(".prisma/client").$Enums.BookingStatus;
            amount: import("@prisma/client/runtime/library").Decimal;
            staffName: string | null;
            dispute: {
                id: string;
                status: string;
                reason: string;
            } | null;
            hasMessages: boolean;
        }[];
    }>;
    getCompanyReviews(companyId: bigint, query: any): Promise<{
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
    getCompanyReviewDetail(companyId: bigint, reviewId: bigint): Promise<{
        id: string;
        customer: {
            name: string;
            email: string | null;
            phone: string | null;
            avatar: string | null;
        };
        staff: {
            name: string;
            avatar: string | null | undefined;
        };
        booking: {
            id: string;
            date: Date;
            service: string;
            amount: import("@prisma/client/runtime/library").Decimal;
        };
        rating: number;
        text: string;
        staffRating: number | null;
        staffText: string | null;
        date: string;
        status: string;
        dispute: {
            id: string;
            status: string;
            reason: string;
            createdAt: Date;
        } | null;
    }>;
    getCompanyRevenue(companyId: bigint): Promise<{
        kpis: {
            label: string;
            value: string;
            up: boolean;
            pct: string;
        }[];
        trendData: {
            day: string;
            gross: number;
            net: number;
        }[];
        breakdown: {
            gross: number;
            platformFee: number;
            staffPayout: number;
            discounts: number;
            refunds: number;
            net: number;
        };
        serviceData: {
            name: string;
            revenue: number;
            percentage: number;
        }[];
        staffData: {
            badge: string | null;
            id: string;
            name: string;
            avatar: string;
            jobs: number;
            revenue: number;
            rating: number;
        }[];
        transactions: {
            id: string;
            date: string;
            customer: string;
            staff: string;
            gross: number;
            fee: number;
            net: number;
            payment: string;
            status: import(".prisma/client").$Enums.BookingStatus;
        }[];
    }>;
    getCompanyById(id: bigint): Promise<{
        staff: {
            id: bigint;
        }[];
        services: ({
            serviceType: {
                category: {
                    id: bigint;
                    status: import(".prisma/client").$Enums.CategoryStatus;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    slug: string;
                    icon: string | null;
                    imageUrl: string | null;
                    displayOrder: number;
                };
            } & {
                id: bigint;
                status: import(".prisma/client").$Enums.CategoryStatus;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                slug: string;
                icon: string | null;
                imageUrl: string | null;
                displayOrder: number;
                categoryId: bigint;
            };
        } & {
            id: bigint;
            checklist: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
            companyId: bigint;
            name: string;
            serviceTypeId: bigint;
            image: string | null;
            description: string | null;
            basePrice: import("@prisma/client/runtime/library").Decimal;
            discountPrice: import("@prisma/client/runtime/library").Decimal | null;
            features: import("@prisma/client/runtime/library").JsonValue | null;
            durationMin: number;
            durationMax: number | null;
            isActive: boolean;
        })[];
        owner: {
            id: bigint;
            fullName: string;
            email: string | null;
            phone: string | null;
        };
        ratingSummary: {
            companyId: bigint;
            averageRating: import("@prisma/client/runtime/library").Decimal | null;
            totalReviews: number;
            lastUpdated: Date;
        } | null;
        serviceAreas: {
            city: string;
            coverageRadiusKm: number | null;
        }[];
    } & {
        id: bigint;
        latitude: import("@prisma/client/runtime/library").Decimal | null;
        longitude: import("@prisma/client/runtime/library").Decimal | null;
        createdAt: Date;
        updatedAt: Date;
        walletBalance: import("@prisma/client/runtime/library").Decimal;
        name: string;
        description: string | null;
        email: string | null;
        phone: string | null;
        registrationNumber: string | null;
        address: string | null;
        city: string | null;
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
        pendingBalance: import("@prisma/client/runtime/library").Decimal;
        availableBalance: import("@prisma/client/runtime/library").Decimal;
        platformFeePercent: import("@prisma/client/runtime/library").Decimal | null;
        completedJobs: number;
        isInsured: boolean;
        completionRate: import("@prisma/client/runtime/library").Decimal;
        coverageRadiusKm: number;
        ownerId: bigint;
    }>;
    createCompany(userId: bigint, dto: CreateCompanyDto): Promise<{
        message: string;
        company: {
            owner: {
                id: bigint;
                fullName: string;
                email: string | null;
            };
        } & {
            id: bigint;
            latitude: import("@prisma/client/runtime/library").Decimal | null;
            longitude: import("@prisma/client/runtime/library").Decimal | null;
            createdAt: Date;
            updatedAt: Date;
            walletBalance: import("@prisma/client/runtime/library").Decimal;
            name: string;
            description: string | null;
            email: string | null;
            phone: string | null;
            registrationNumber: string | null;
            address: string | null;
            city: string | null;
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
            pendingBalance: import("@prisma/client/runtime/library").Decimal;
            availableBalance: import("@prisma/client/runtime/library").Decimal;
            platformFeePercent: import("@prisma/client/runtime/library").Decimal | null;
            completedJobs: number;
            isInsured: boolean;
            completionRate: import("@prisma/client/runtime/library").Decimal;
            coverageRadiusKm: number;
            ownerId: bigint;
        };
    }>;
    updateCompany(id: bigint, userId: bigint, role: string, updates: UpdateCompanyDto): Promise<{
        message: string;
        company: {
            owner: {
                id: bigint;
                fullName: string;
                email: string | null;
            };
        } & {
            id: bigint;
            latitude: import("@prisma/client/runtime/library").Decimal | null;
            longitude: import("@prisma/client/runtime/library").Decimal | null;
            createdAt: Date;
            updatedAt: Date;
            walletBalance: import("@prisma/client/runtime/library").Decimal;
            name: string;
            description: string | null;
            email: string | null;
            phone: string | null;
            registrationNumber: string | null;
            address: string | null;
            city: string | null;
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
            pendingBalance: import("@prisma/client/runtime/library").Decimal;
            availableBalance: import("@prisma/client/runtime/library").Decimal;
            platformFeePercent: import("@prisma/client/runtime/library").Decimal | null;
            completedJobs: number;
            isInsured: boolean;
            completionRate: import("@prisma/client/runtime/library").Decimal;
            coverageRadiusKm: number;
            ownerId: bigint;
        };
    }>;
    deleteCompany(id: bigint, userId: bigint, role: string): Promise<{
        message: string;
    }>;
    getMyCompany(userId: bigint): Promise<{
        services: {
            id: bigint;
            checklist: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
            companyId: bigint;
            name: string;
            serviceTypeId: bigint;
            image: string | null;
            description: string | null;
            basePrice: import("@prisma/client/runtime/library").Decimal;
            discountPrice: import("@prisma/client/runtime/library").Decimal | null;
            features: import("@prisma/client/runtime/library").JsonValue | null;
            durationMin: number;
            durationMax: number | null;
            isActive: boolean;
        }[];
        ratingSummary: {
            companyId: bigint;
            averageRating: import("@prisma/client/runtime/library").Decimal | null;
            totalReviews: number;
            lastUpdated: Date;
        } | null;
        serviceAreas: {
            id: bigint;
            companyId: bigint;
            city: string;
            coverageRadiusKm: number | null;
        }[];
    } & {
        id: bigint;
        latitude: import("@prisma/client/runtime/library").Decimal | null;
        longitude: import("@prisma/client/runtime/library").Decimal | null;
        createdAt: Date;
        updatedAt: Date;
        walletBalance: import("@prisma/client/runtime/library").Decimal;
        name: string;
        description: string | null;
        email: string | null;
        phone: string | null;
        registrationNumber: string | null;
        address: string | null;
        city: string | null;
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
        pendingBalance: import("@prisma/client/runtime/library").Decimal;
        availableBalance: import("@prisma/client/runtime/library").Decimal;
        platformFeePercent: import("@prisma/client/runtime/library").Decimal | null;
        completedJobs: number;
        isInsured: boolean;
        completionRate: import("@prisma/client/runtime/library").Decimal;
        coverageRadiusKm: number;
        ownerId: bigint;
    }>;
    getMyCompanyMetrics(userId: bigint): Promise<{
        revenue: number;
        revenueGrowth: number;
        bookingsGrowth: number;
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
    getMyCompanyStaff(userId: bigint): Promise<{
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
    getStaffMemberById(staffId: bigint, userId: bigint): Promise<{
        id: string;
        generatedRevenue: number;
        completionRate: number;
        acceptanceRate: number;
        cancellationRate: number;
        onTimeArrival: number;
        returnRate: number;
        attendance: {
            present: number;
            late: number;
            absent: number;
            hours: string;
            overtime: string;
        };
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
            fullName: string;
            email: string | null;
            phone: string | null;
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
            createdAt: Date;
            description: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            type: string;
        }[];
    }>;
    topUpStaffWallet(staffId: bigint, userId: bigint, body: any): Promise<{
        success: boolean;
        newBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
    getCompanyServices(companyId: bigint): Promise<{
        id: string;
        companyId: string;
        serviceTypeId: string;
        basePrice: number;
        discountPrice: number | null;
        serviceType: {
            category: {
                id: bigint;
                status: import(".prisma/client").$Enums.CategoryStatus;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                slug: string;
                icon: string | null;
                imageUrl: string | null;
                displayOrder: number;
            };
        } & {
            id: bigint;
            status: import(".prisma/client").$Enums.CategoryStatus;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            slug: string;
            icon: string | null;
            imageUrl: string | null;
            displayOrder: number;
            categoryId: bigint;
        };
        checklist: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        image: string | null;
        description: string | null;
        features: import("@prisma/client/runtime/library").JsonValue | null;
        durationMin: number;
        durationMax: number | null;
        isActive: boolean;
    }[]>;
    getCompanyServiceDetail(companyId: bigint, serviceId: bigint): Promise<{
        id: string;
        name: string;
        description: string | null;
        basePrice: number;
        discountPrice: number | null;
        isActive: boolean;
        image: string | null;
        category: string;
        type: string;
        stats: {
            totalBookings: number;
            completedBookings: number;
            activeBookings: number;
            totalRevenue: number;
        };
        recentBookings: {
            id: string;
            status: import(".prisma/client").$Enums.BookingStatus;
            amount: number;
            date: Date;
        }[];
    }>;
    updateCompanyService(companyId: bigint, serviceId: bigint, data: any): Promise<{
        id: bigint;
        checklist: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: bigint;
        name: string;
        serviceTypeId: bigint;
        image: string | null;
        description: string | null;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        discountPrice: import("@prisma/client/runtime/library").Decimal | null;
        features: import("@prisma/client/runtime/library").JsonValue | null;
        durationMin: number;
        durationMax: number | null;
        isActive: boolean;
    }>;
    createCompanyService(companyId: bigint, data: any): Promise<{
        id: bigint;
        checklist: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: bigint;
        name: string;
        serviceTypeId: bigint;
        image: string | null;
        description: string | null;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        discountPrice: import("@prisma/client/runtime/library").Decimal | null;
        features: import("@prisma/client/runtime/library").JsonValue | null;
        durationMin: number;
        durationMax: number | null;
        isActive: boolean;
    }>;
    getMyCompanyCampaigns(userId: bigint): Promise<{
        id: string;
        companyId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
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
                status: import(".prisma/client").$Enums.CategoryStatus;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
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
                status: import(".prisma/client").$Enums.CategoryStatus;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                slug: string;
                icon: string | null;
                imageUrl: string | null;
                displayOrder: number;
            };
            serviceType: {
                id: string;
                categoryId: string;
                status: import(".prisma/client").$Enums.CategoryStatus;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
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
        startTime: Date;
        endTime: Date;
        companyId: bigint;
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
