import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCompanyAdminDto } from './dto/create-company-admin.dto';
import { UpdateCompanyAdminDto } from './dto/update-company-admin.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { MailService } from '../mail/mail.service';
export declare class AdminService {
    private prisma;
    private notificationsService;
    private mailService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, mailService: MailService);
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
        categorySaturationData: {
            name: string;
            value: number;
            fill: string;
            status: string;
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
    getUserById(id: bigint): Promise<{
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
    updateUser(id: bigint, dto: UpdateUserAdminDto): Promise<{
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
    setUserStatus(id: bigint, status: string, reason?: string): Promise<{
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
            googleMapUrl: string | null;
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
            createdAt: Date;
            role: import(".prisma/client").$Enums.StaffRole;
            creditLimit: import("@prisma/client/runtime/library").Decimal;
            walletBalance: import("@prisma/client/runtime/library").Decimal;
            splitPercent: import("@prisma/client/runtime/library").Decimal | null;
        }[];
        services: {
            id: string;
            companyId: string;
            basePrice: number;
            checklist: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            serviceTypeId: bigint;
            image: string | null;
            description: string | null;
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
        googleMapUrl: string | null;
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
    updateCompany(id: bigint, dto: UpdateCompanyAdminDto): Promise<{
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
            googleMapUrl: string | null;
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
    setCompanyVerification(id: bigint, status: string, reason?: string): Promise<{
        message: string;
        companyId: string;
    }>;
    expireCompanyTrial(id: bigint): Promise<{
        message: string;
        companyId: string;
    }>;
    suspendCompany(id: bigint): Promise<{
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
    resolveDispute(id: number, dto: {
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
    processRefund(paymentId: bigint, body: {
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
                id: bigint;
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
                customerId: bigint;
                companyId: bigint;
                serviceId: bigint;
                assignedStaffId: bigint | null;
                promoCodeId: bigint | null;
            }) | null | undefined;
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
                    qrCodeUrl: string | null;
                    routingNumber: string | null;
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
                googleMapUrl: string | null;
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
                    qrCodeUrl: string | null;
                    routingNumber: string | null;
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
                    googleMapUrl: string | null;
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
    updatePayoutStatus(id: number, status: string): Promise<{
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
    createCompanyAdmin(dto: CreateCompanyAdminDto): Promise<{
        message: string;
        companyId: string;
        ownerId: string;
        servicesCount: number;
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
    updateEmailTemplate(id: number, dto: any): Promise<{
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
    getBroadcasts(): Promise<any>;
    createBroadcast(dto: {
        title: string;
        message: string;
        audience: string;
    }): Promise<any>;
}
