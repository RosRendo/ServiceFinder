import { AdminService } from './admin.service';
import { CreateCompanyAdminDto } from './dto/create-company-admin.dto';
import { UpdateCompanyAdminDto } from './dto/update-company-admin.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getAnalytics(): Promise<{
        totalRevenue: number;
        revenueGrowth: number;
        totalBookings: number;
        bookingsGrowth: number;
        activeBookings: number;
        totalUsers: number;
        usersGrowth: number;
        totalCompanies: number;
        pendingCompanies: number;
        companiesGrowth: number;
        avgBookingValue: number;
        conversionRate: number;
        completedBookings: number;
        cancelledBookings: number;
        monthlyData: {
            name: string;
            revenue: number;
            bookings: number;
        }[];
        statusBreakdown: {
            name: string;
            value: number;
            color: string;
        }[];
        categoryData: {
            name: string;
            value: number;
        }[];
        weeklyStats: {
            day: string;
            newUsers: number;
            bookings: number;
        }[];
        topCompanies: {
            name: string;
            revenue: string;
            rating: number;
            completedJobs: number;
        }[];
        registrationTrend: {
            name: string;
            users: number;
            companies: number;
        }[];
    }>;
    getUsers(query: any): Promise<{
        data: {
            id: string;
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            email: string | null;
            phone: string | null;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
            lastLoginAt: Date | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    getUser(id: string): Promise<{
        user: {
            id: string;
            ownedCompanies: {
                id: bigint;
                name: string;
                verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
            }[];
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            fullName: string;
            avatar: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            lastLoginAt: Date | null;
            pushToken: string | null;
            mfaEnabled: boolean;
            mfaSecret: string | null;
            emailNotificationsEnabled: boolean;
            pushNotificationsEnabled: boolean;
        };
    }>;
    updateUser(id: string, dto: UpdateUserAdminDto): Promise<{
        message: string;
        user: {
            id: string;
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            fullName: string;
            avatar: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            lastLoginAt: Date | null;
            pushToken: string | null;
            mfaEnabled: boolean;
            mfaSecret: string | null;
            emailNotificationsEnabled: boolean;
            pushNotificationsEnabled: boolean;
        };
    }>;
    suspendUser(id: string, body: {
        reason?: string;
    }): Promise<{
        message: string;
        userId: string;
    }>;
    unsuspendUser(id: string): Promise<{
        message: string;
        userId: string;
    }>;
    getCompanies(query: any): Promise<{
        data: {
            id: string;
            ownerId: string;
            owner: {
                id: string;
                email: string | null;
                fullName: string;
            };
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
        }[];
        pagination: {
            total: number;
            page: any;
            limit: any;
            pages: number;
        };
    }>;
    updateCompany(id: string, dto: UpdateCompanyAdminDto): Promise<{
        message: string;
        company: {
            id: string;
            ownerId: string;
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
        };
    }>;
    getCompanyDetails(id: string): Promise<{
        id: string;
        ownerId: string;
        owner: {
            id: string;
            email: string | null;
            phone: string | null;
            fullName: string;
        };
        staff: {
            id: string;
            userId: string;
            companyId: string;
            status: import(".prisma/client").$Enums.StaffStatus;
            createdAt: Date;
            role: import(".prisma/client").$Enums.StaffRole;
            walletBalance: import("@prisma/client/runtime/library").Decimal;
            creditLimit: import("@prisma/client/runtime/library").Decimal;
        }[];
        services: {
            id: string;
            companyId: string;
            name: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            discountPrice: import("@prisma/client/runtime/library").Decimal | null;
            image: string | null;
            basePrice: import("@prisma/client/runtime/library").Decimal;
            features: import("@prisma/client/runtime/library").JsonValue | null;
            durationMin: number;
            durationMax: number | null;
            isActive: boolean;
            serviceTypeId: bigint;
        }[];
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
    }>;
    createCompanyAdmin(dto: CreateCompanyAdminDto): Promise<{
        message: string;
        companyId: string;
        ownerId: string;
        servicesCount: number;
    }>;
    verifyCompany(id: string): Promise<{
        message: string;
        companyId: string;
    }>;
    acceptCompany(id: string): Promise<{
        message: string;
        companyId: string;
    }>;
    rejectCompany(id: string, body: {
        reason?: string;
    }): Promise<{
        message: string;
        companyId: string;
    }>;
    expireCompanyTrial(id: string): Promise<{
        message: string;
        companyId: string;
    }>;
    getAllDisputes(query: any): Promise<{
        data: {
            bookingId: string;
            customerId: string;
            companyId: string;
            customer: {
                id: string;
                fullName: string;
            };
            company: {
                id: string;
                name: string;
            };
            booking: {
                id: string;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
            };
            id: number;
            description: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            photos: string | null;
            companyResponse: string | null;
            adminDecision: string | null;
            refundAmount: import("@prisma/client/runtime/library").Decimal | null;
            resolvedAt: Date | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    resolveDispute(id: string, dto: {
        status: string;
        adminDecision: string;
        refundAmount?: number;
    }): Promise<{
        bookingId: string;
        customerId: string;
        companyId: string;
        id: number;
        description: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        photos: string | null;
        companyResponse: string | null;
        adminDecision: string | null;
        refundAmount: import("@prisma/client/runtime/library").Decimal | null;
        resolvedAt: Date | null;
    }>;
    refundPayment(id: string, body: {
        amount?: number;
        reason?: string;
    }): Promise<{
        message: string;
        paymentId: string;
    }>;
    getPayouts(query: any): Promise<{
        data: {
            amount: string;
            companyId: string | undefined;
            staffId: string | undefined;
            company: {
                id: string;
                ownerId: string;
                owner: {
                    email: string | null;
                };
                paymentMethods: {
                    id: number;
                    createdAt: Date;
                    companyId: bigint;
                    qrCodeUrl: string | null;
                    type: string;
                    accountName: string;
                    accountNumber: string;
                    routingNumber: string | null;
                    isDefault: boolean;
                    isVerified: boolean;
                }[];
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
            } | null;
            staff: {
                id: string;
                companyId: string;
                userId: string;
                user: {
                    email: string | null;
                    fullName: string;
                };
                paymentMethods: {
                    id: number;
                    createdAt: Date;
                    staffId: bigint;
                    qrCodeUrl: string | null;
                    type: string;
                    accountName: string;
                    accountNumber: string;
                    routingNumber: string | null;
                    isDefault: boolean;
                    isVerified: boolean;
                }[];
                status: import(".prisma/client").$Enums.StaffStatus;
                createdAt: Date;
                role: import(".prisma/client").$Enums.StaffRole;
                walletBalance: import("@prisma/client/runtime/library").Decimal;
                creditLimit: import("@prisma/client/runtime/library").Decimal;
            } | null;
            id: number;
            status: string;
            method: string;
            payoutType: string;
            transactionId: string | null;
            requestedAt: Date;
            processedAt: Date | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    approvePayout(id: string): Promise<{
        message: string;
        payout: {
            companyId: string | undefined;
            id: number;
            status: string;
            method: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            staffId: bigint | null;
            payoutType: string;
            transactionId: string | null;
            requestedAt: Date;
            processedAt: Date | null;
        };
    }>;
    rejectPayout(id: string): Promise<{
        message: string;
        payout: {
            companyId: string | undefined;
            id: number;
            status: string;
            method: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            staffId: bigint | null;
            payoutType: string;
            transactionId: string | null;
            requestedAt: Date;
            processedAt: Date | null;
        };
    }>;
}
