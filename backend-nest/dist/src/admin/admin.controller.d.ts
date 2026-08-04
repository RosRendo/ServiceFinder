import { AdminService } from './admin.service';
import { CreateCompanyAdminDto } from './dto/create-company-admin.dto';
import { UpdateCompanyAdminDto } from './dto/update-company-admin.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getAnalytics(): Promise<{
        totalRevenue: number;
        platformRevenue: number;
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
        openTickets: number;
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
        activeDisputes: number;
    }>;
    getUsers(query: any): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import(".prisma/client").$Enums.UserStatus;
            fullName: string;
            email: string | null;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            lastLoginAt: Date | null;
            createdAt: Date;
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
                verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
                id: bigint;
                name: string;
            }[];
            status: import(".prisma/client").$Enums.UserStatus;
            fullName: string;
            email: string | null;
            phone: string | null;
            avatar: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            workingStatus: string;
            lastSeen: Date | null;
            lastLoginAt: Date | null;
            pushToken: string | null;
            mfaEnabled: boolean;
            mfaSecret: string | null;
            emailNotificationsEnabled: boolean;
            pushNotificationsEnabled: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    updateUser(id: string, dto: UpdateUserAdminDto): Promise<{
        message: string;
        user: {
            id: string;
            status: import(".prisma/client").$Enums.UserStatus;
            fullName: string;
            email: string | null;
            phone: string | null;
            avatar: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            workingStatus: string;
            lastSeen: Date | null;
            lastLoginAt: Date | null;
            pushToken: string | null;
            mfaEnabled: boolean;
            mfaSecret: string | null;
            emailNotificationsEnabled: boolean;
            pushNotificationsEnabled: boolean;
            createdAt: Date;
            updatedAt: Date;
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
        success: boolean;
        data: {
            id: string;
            ownerId: string;
            owner: {
                id: string;
                fullName: string;
                email: string | null;
            };
            totalRevenue: number;
            totalBookings: number;
            rating: number;
            staffCount: number;
            _count: {
                staff: number;
            };
            ratingSummary: {
                companyId: bigint;
                averageRating: import("@prisma/client/runtime/library").Decimal | null;
                totalReviews: number;
                lastUpdated: Date;
            } | null;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
            description: string | null;
            latitude: import("@prisma/client/runtime/library").Decimal | null;
            longitude: import("@prisma/client/runtime/library").Decimal | null;
            email: string | null;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            registrationNumber: string | null;
            address: string | null;
            city: string | null;
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
            pendingBalance: import("@prisma/client/runtime/library").Decimal;
            availableBalance: import("@prisma/client/runtime/library").Decimal;
            platformFeePercent: import("@prisma/client/runtime/library").Decimal | null;
            completedJobs: number;
            isInsured: boolean;
            completionRate: import("@prisma/client/runtime/library").Decimal;
            coverageRadiusKm: number;
            bookingMode: string;
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
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
            description: string | null;
            latitude: import("@prisma/client/runtime/library").Decimal | null;
            longitude: import("@prisma/client/runtime/library").Decimal | null;
            email: string | null;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            registrationNumber: string | null;
            address: string | null;
            city: string | null;
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
            pendingBalance: import("@prisma/client/runtime/library").Decimal;
            availableBalance: import("@prisma/client/runtime/library").Decimal;
            platformFeePercent: import("@prisma/client/runtime/library").Decimal | null;
            completedJobs: number;
            isInsured: boolean;
            completionRate: import("@prisma/client/runtime/library").Decimal;
            coverageRadiusKm: number;
            bookingMode: string;
        };
    }>;
    getCompanyDetails(id: string): Promise<{
        id: string;
        ownerId: string;
        owner: {
            id: string;
            fullName: string;
            email: string | null;
            phone: string | null;
        };
        staff: {
            id: string;
            userId: string;
            companyId: string;
            user: {
                fullName: string;
                email: string | null;
            } | null;
            status: import(".prisma/client").$Enums.StaffStatus;
            role: import(".prisma/client").$Enums.StaffRole;
            createdAt: Date;
            walletBalance: import("@prisma/client/runtime/library").Decimal;
            creditLimit: import("@prisma/client/runtime/library").Decimal;
            splitPercent: import("@prisma/client/runtime/library").Decimal | null;
        }[];
        services: {
            id: string;
            companyId: string;
            basePrice: number;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            checklist: import("@prisma/client/runtime/library").JsonValue | null;
            serviceTypeId: bigint;
            image: string | null;
            discountPrice: import("@prisma/client/runtime/library").Decimal | null;
            features: import("@prisma/client/runtime/library").JsonValue | null;
            durationMin: number;
            durationMax: number | null;
            isActive: boolean;
        }[];
        bookings: {
            id: string;
            totalPrice: number;
            status: import(".prisma/client").$Enums.BookingStatus;
        }[];
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        description: string | null;
        latitude: import("@prisma/client/runtime/library").Decimal | null;
        longitude: import("@prisma/client/runtime/library").Decimal | null;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        registrationNumber: string | null;
        address: string | null;
        city: string | null;
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
        pendingBalance: import("@prisma/client/runtime/library").Decimal;
        availableBalance: import("@prisma/client/runtime/library").Decimal;
        platformFeePercent: import("@prisma/client/runtime/library").Decimal | null;
        completedJobs: number;
        isInsured: boolean;
        completionRate: import("@prisma/client/runtime/library").Decimal;
        coverageRadiusKm: number;
        bookingMode: string;
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
    suspendCompany(id: string): Promise<{
        message: string;
        companyId: string;
    }>;
    getAllDisputes(query: any): Promise<{
        success: boolean;
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
            status: string;
            description: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            photos: string | null;
            companyResponse: string | null;
            adminDecision: string | null;
            refundAmount: import("@prisma/client/runtime/library").Decimal | null;
            frozenAmount: import("@prisma/client/runtime/library").Decimal | null;
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
        status: string;
        description: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        photos: string | null;
        companyResponse: string | null;
        adminDecision: string | null;
        refundAmount: import("@prisma/client/runtime/library").Decimal | null;
        frozenAmount: import("@prisma/client/runtime/library").Decimal | null;
        resolvedAt: Date | null;
    }>;
    refundPayment(id: string, body: {
        amount?: number;
        reason?: string;
    }): Promise<{
        message: string;
        paymentId: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
    }>;
    getTransactions(query: any): Promise<{
        data: {
            id: string;
            ownerId: string;
            bookingId: string | undefined;
            amount: number;
            booking: ({
                company: {
                    name: string;
                };
                customer: {
                    fullName: string;
                };
            } & {
                status: import(".prisma/client").$Enums.BookingStatus;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                companyEarnings: import("@prisma/client/runtime/library").Decimal;
                platformFee: import("@prisma/client/runtime/library").Decimal;
                id: bigint;
                customerId: bigint;
                companyId: bigint;
                serviceId: bigint;
                assignedStaffId: bigint | null;
                latitude: import("@prisma/client/runtime/library").Decimal | null;
                longitude: import("@prisma/client/runtime/library").Decimal | null;
                staffStartLatitude: import("@prisma/client/runtime/library").Decimal | null;
                staffStartLongitude: import("@prisma/client/runtime/library").Decimal | null;
                progressPercent: number;
                staffEarnings: import("@prisma/client/runtime/library").Decimal;
                promoCodeId: bigint | null;
                createdAt: Date;
                updatedAt: Date;
                bookingDate: Date;
                startTime: Date;
                endTime: Date;
                actualStartTime: Date | null;
                actualEndTime: Date | null;
                serviceAddress: string;
                checklist: import("@prisma/client/runtime/library").JsonValue | null;
                proofOfWorkPhoto: string | null;
                staffNotes: string | null;
                customerNotes: string | null;
            }) | null | undefined;
            description: string;
            createdAt: Date;
            category: string;
            type: string;
            ownerType: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    getPayouts(query: any): Promise<{
        success: boolean;
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
                    companyId: bigint;
                    createdAt: Date;
                    type: string;
                    accountName: string;
                    accountNumber: string;
                    routingNumber: string | null;
                    qrCodeUrl: string | null;
                    isDefault: boolean;
                    isVerified: boolean;
                }[];
                verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
                description: string | null;
                latitude: import("@prisma/client/runtime/library").Decimal | null;
                longitude: import("@prisma/client/runtime/library").Decimal | null;
                email: string | null;
                phone: string | null;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                registrationNumber: string | null;
                address: string | null;
                city: string | null;
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
                pendingBalance: import("@prisma/client/runtime/library").Decimal;
                availableBalance: import("@prisma/client/runtime/library").Decimal;
                platformFeePercent: import("@prisma/client/runtime/library").Decimal | null;
                completedJobs: number;
                isInsured: boolean;
                completionRate: import("@prisma/client/runtime/library").Decimal;
                coverageRadiusKm: number;
                bookingMode: string;
            } | null;
            staff: {
                id: string;
                companyId: string;
                userId: string;
                user: {
                    fullName: string;
                    email: string | null;
                };
                paymentMethods: {
                    id: number;
                    createdAt: Date;
                    type: string;
                    staffId: bigint;
                    accountName: string;
                    accountNumber: string;
                    routingNumber: string | null;
                    qrCodeUrl: string | null;
                    isDefault: boolean;
                    isVerified: boolean;
                }[];
                status: import(".prisma/client").$Enums.StaffStatus;
                role: import(".prisma/client").$Enums.StaffRole;
                createdAt: Date;
                walletBalance: import("@prisma/client/runtime/library").Decimal;
                creditLimit: import("@prisma/client/runtime/library").Decimal;
                splitPercent: import("@prisma/client/runtime/library").Decimal | null;
            } | null;
            status: string;
            id: number;
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
            status: string;
            id: number;
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
            status: string;
            id: number;
            method: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            staffId: bigint | null;
            payoutType: string;
            transactionId: string | null;
            requestedAt: Date;
            processedAt: Date | null;
        };
    }>;
    getInvoices(query: any): Promise<{
        data: {
            id: string;
            bookingId: string;
            totalAmount: number;
            booking: {
                id: string;
                customerId: string;
                companyId: string;
                customer: {
                    id: string;
                    status: import(".prisma/client").$Enums.UserStatus;
                    fullName: string;
                    email: string | null;
                    phone: string | null;
                    avatar: string | null;
                    passwordHash: string | null;
                    role: import(".prisma/client").$Enums.UserRole;
                    workingStatus: string;
                    lastSeen: Date | null;
                    lastLoginAt: Date | null;
                    pushToken: string | null;
                    mfaEnabled: boolean;
                    mfaSecret: string | null;
                    emailNotificationsEnabled: boolean;
                    pushNotificationsEnabled: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                company: {
                    id: string;
                    ownerId: string;
                    verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
                    description: string | null;
                    latitude: import("@prisma/client/runtime/library").Decimal | null;
                    longitude: import("@prisma/client/runtime/library").Decimal | null;
                    email: string | null;
                    phone: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    registrationNumber: string | null;
                    address: string | null;
                    city: string | null;
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
                    pendingBalance: import("@prisma/client/runtime/library").Decimal;
                    availableBalance: import("@prisma/client/runtime/library").Decimal;
                    platformFeePercent: import("@prisma/client/runtime/library").Decimal | null;
                    completedJobs: number;
                    isInsured: boolean;
                    completionRate: import("@prisma/client/runtime/library").Decimal;
                    coverageRadiusKm: number;
                    bookingMode: string;
                } | null;
                status: import(".prisma/client").$Enums.BookingStatus;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                companyEarnings: import("@prisma/client/runtime/library").Decimal;
                platformFee: import("@prisma/client/runtime/library").Decimal;
                serviceId: bigint;
                assignedStaffId: bigint | null;
                latitude: import("@prisma/client/runtime/library").Decimal | null;
                longitude: import("@prisma/client/runtime/library").Decimal | null;
                staffStartLatitude: import("@prisma/client/runtime/library").Decimal | null;
                staffStartLongitude: import("@prisma/client/runtime/library").Decimal | null;
                progressPercent: number;
                staffEarnings: import("@prisma/client/runtime/library").Decimal;
                promoCodeId: bigint | null;
                createdAt: Date;
                updatedAt: Date;
                bookingDate: Date;
                startTime: Date;
                endTime: Date;
                actualStartTime: Date | null;
                actualEndTime: Date | null;
                serviceAddress: string;
                checklist: import("@prisma/client/runtime/library").JsonValue | null;
                proofOfWorkPhoto: string | null;
                staffNotes: string | null;
                customerNotes: string | null;
            };
            invoiceNumber: string;
            issuedAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    getEmailTemplates(): Promise<{
        success: boolean;
        data: any;
    }>;
    createEmailTemplate(dto: any): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    updateEmailTemplate(id: string, dto: any): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    seedEmailTemplates(): Promise<{
        success: boolean;
        message: string;
    }>;
    testEmailTemplate(dto: any): Promise<{
        success: boolean;
        message: string;
        preview: {
            subject: any;
            body: any;
        };
    }>;
}
