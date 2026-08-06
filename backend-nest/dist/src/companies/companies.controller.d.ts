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
            bookingMode: string;
            ownerId: bigint;
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
            companyId: bigint;
            city: string;
            coverageRadiusKm: number | null;
        }[];
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
        bookingMode: string;
        ownerId: bigint;
    }>;
    updateMyCompany(user: any, body: any): Promise<{
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
            bookingMode: string;
            ownerId: bigint;
        };
    }>;
    getMyCompanyMetrics(user: any): Promise<{
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
        topStaff: {
            name: string;
            revenue: number;
            rating: number;
            jobs: number;
        }[];
        ratingTrend: {
            name: string;
            rating: number;
        }[];
        qualityRadar: {
            subject: string;
            A: number;
            B: number;
            fullMark: number;
        }[];
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
    getMyCompanyCustomer(user: any, customerId: string): Promise<{
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
    getMyCompanyReview(user: any, reviewId: string): Promise<{
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
    getMyCompanyRevenue(user: any): Promise<{
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
    getMyCompanyServices(user: any): Promise<{
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
    getMyCompanyService(user: any, serviceId: string): Promise<{
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
    createMyCompanyService(user: any, body: any): Promise<{
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
    updateMyCompanyService(user: any, serviceId: string, body: any): Promise<{
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
    getStaffMemberById(staffId: string, user: any): Promise<{
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
        documents: any;
        notes: any;
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
            createdAt: Date;
            description: string | null;
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
    getCompanyById(id: string): Promise<{
        staff: {
            id: bigint;
        }[];
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
        bookingMode: string;
        ownerId: bigint;
    }>;
    updateCompany(id: string, updateCompanyDto: UpdateCompanyDto, user: any): Promise<{
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
            bookingMode: string;
            ownerId: bigint;
        };
    }>;
    deleteCompany(id: string, user: any): Promise<{
        message: string;
    }>;
    addStaffAvailability(staffId: string, dto: AddAvailabilityDto, user: any): Promise<{
        id: bigint;
        startTime: Date;
        endTime: Date;
        companyId: bigint;
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
    addStaffDocument(staffId: string, dto: {
        name: string;
        documentUrl: string;
        expiryDate?: string;
    }, user: any): Promise<{
        id: any;
        name: any;
        documentUrl: any;
        status: any;
        expiryDate: any;
    }>;
    addStaffNote(staffId: string, dto: {
        note: string;
    }, user: any): Promise<{
        id: any;
        note: any;
        createdAt: any;
        authorName: any;
        authorAvatar: any;
    }>;
    deleteStaffNote(noteId: string, user: any): Promise<{
        message: string;
    }>;
}
