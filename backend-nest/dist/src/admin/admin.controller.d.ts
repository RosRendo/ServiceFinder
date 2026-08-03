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
            createdAt: Date;
            role: import(".prisma/client").$Enums.UserRole;
            fullName: string;
            email: string | null;
            phone: string | null;
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
            role: import(".prisma/client").$Enums.UserRole;
            fullName: string;
            email: string | null;
            phone: string | null;
            avatar: string | null;
            workingStatus: string;
            lastSeen: Date | null;
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
            role: import(".prisma/client").$Enums.UserRole;
            fullName: string;
            email: string | null;
            phone: string | null;
            avatar: string | null;
            workingStatus: string;
            lastSeen: Date | null;
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
        success: boolean;
        data: {
            id: string;
            ownerId: string;
            owner: {
                id: string;
                fullName: string;
                email: string | null;
            };
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
            status: import(".prisma/client").$Enums.StaffStatus;
            createdAt: Date;
            role: import(".prisma/client").$Enums.StaffRole;
            creditLimit: import("@prisma/client/runtime/library").Decimal;
            walletBalance: import("@prisma/client/runtime/library").Decimal;
            splitPercent: import("@prisma/client/runtime/library").Decimal | null;
        }[];
        services: {
            id: string;
            companyId: string;
            checklist: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
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
            id: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
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
        id: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
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
            createdAt: Date;
            description: string;
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
                paymentMethods: {
                    id: number;
                    createdAt: Date;
                    companyId: bigint;
                    type: string;
                    accountName: string;
                    accountNumber: string;
                    routingNumber: string | null;
                    qrCodeUrl: string | null;
                    isDefault: boolean;
                    isVerified: boolean;
                }[];
                owner: {
                    email: string | null;
                };
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
                    staffId: bigint;
                    type: string;
                    accountName: string;
                    accountNumber: string;
                    routingNumber: string | null;
                    qrCodeUrl: string | null;
                    isDefault: boolean;
                    isVerified: boolean;
                }[];
                status: import(".prisma/client").$Enums.StaffStatus;
                createdAt: Date;
                role: import(".prisma/client").$Enums.StaffRole;
                creditLimit: import("@prisma/client/runtime/library").Decimal;
                walletBalance: import("@prisma/client/runtime/library").Decimal;
                splitPercent: import("@prisma/client/runtime/library").Decimal | null;
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
                    createdAt: Date;
                    updatedAt: Date;
                    role: import(".prisma/client").$Enums.UserRole;
                    fullName: string;
                    email: string | null;
                    phone: string | null;
                    avatar: string | null;
                    passwordHash: string | null;
                    workingStatus: string;
                    lastSeen: Date | null;
                    lastLoginAt: Date | null;
                    pushToken: string | null;
                    mfaEnabled: boolean;
                    mfaSecret: string | null;
                    emailNotificationsEnabled: boolean;
                    pushNotificationsEnabled: boolean;
                } | null;
                company: {
                    id: string;
                    ownerId: string;
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
                } | null;
                bookingDate: Date;
                startTime: Date;
                endTime: Date;
                actualStartTime: Date | null;
                actualEndTime: Date | null;
                serviceAddress: string;
                latitude: import("@prisma/client/runtime/library").Decimal | null;
                longitude: import("@prisma/client/runtime/library").Decimal | null;
                staffStartLatitude: import("@prisma/client/runtime/library").Decimal | null;
                staffStartLongitude: import("@prisma/client/runtime/library").Decimal | null;
                status: import(".prisma/client").$Enums.BookingStatus;
                progressPercent: number;
                checklist: import("@prisma/client/runtime/library").JsonValue | null;
                proofOfWorkPhoto: string | null;
                staffNotes: string | null;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                platformFee: import("@prisma/client/runtime/library").Decimal;
                companyEarnings: import("@prisma/client/runtime/library").Decimal;
                staffEarnings: import("@prisma/client/runtime/library").Decimal;
                createdAt: Date;
                updatedAt: Date;
                customerNotes: string | null;
                serviceId: bigint;
                assignedStaffId: bigint | null;
                promoCodeId: bigint | null;
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
