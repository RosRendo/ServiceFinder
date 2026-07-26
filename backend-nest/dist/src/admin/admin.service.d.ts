import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCompanyAdminDto } from './dto/create-company-admin.dto';
import { UpdateCompanyAdminDto } from './dto/update-company-admin.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
export declare class AdminService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
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
            phone: string | null;
            email: string | null;
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
    getUserById(id: bigint): Promise<{
        user: {
            id: string;
            ownedCompanies: {
                verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
                id: bigint;
                name: string;
            }[];
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            email: string | null;
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
    updateUser(id: bigint, dto: UpdateUserAdminDto): Promise<{
        message: string;
        user: {
            id: string;
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            email: string | null;
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
    setUserStatus(id: bigint, status: string, reason?: string): Promise<{
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
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
            description: string | null;
            latitude: import("@prisma/client/runtime/library").Decimal | null;
            longitude: import("@prisma/client/runtime/library").Decimal | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            registrationNumber: string | null;
            address: string | null;
            city: string | null;
            phone: string | null;
            email: string | null;
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
    getCompanyDetails(id: string): Promise<{
        id: string;
        ownerId: string;
        owner: {
            id: string;
            phone: string | null;
            email: string | null;
            fullName: string;
        };
        staff: {
            id: string;
            userId: string;
            companyId: string;
            status: import(".prisma/client").$Enums.StaffStatus;
            createdAt: Date;
            walletBalance: import("@prisma/client/runtime/library").Decimal;
            role: import(".prisma/client").$Enums.StaffRole;
            creditLimit: import("@prisma/client/runtime/library").Decimal;
        }[];
        services: {
            id: string;
            companyId: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            serviceTypeId: bigint;
            image: string | null;
            basePrice: import("@prisma/client/runtime/library").Decimal;
            discountPrice: import("@prisma/client/runtime/library").Decimal | null;
            features: import("@prisma/client/runtime/library").JsonValue | null;
            durationMin: number;
            durationMax: number | null;
            isActive: boolean;
        }[];
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        description: string | null;
        latitude: import("@prisma/client/runtime/library").Decimal | null;
        longitude: import("@prisma/client/runtime/library").Decimal | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        registrationNumber: string | null;
        address: string | null;
        city: string | null;
        phone: string | null;
        email: string | null;
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
    updateCompany(id: bigint, dto: UpdateCompanyAdminDto): Promise<{
        message: string;
        company: {
            id: string;
            ownerId: string;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
            description: string | null;
            latitude: import("@prisma/client/runtime/library").Decimal | null;
            longitude: import("@prisma/client/runtime/library").Decimal | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            registrationNumber: string | null;
            address: string | null;
            city: string | null;
            phone: string | null;
            email: string | null;
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
    setCompanyVerification(id: bigint, status: string, reason?: string): Promise<{
        message: string;
        companyId: string;
    }>;
    expireCompanyTrial(id: bigint): Promise<{
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
        resolvedAt: Date | null;
    }>;
    processRefund(paymentId: bigint, body: {
        amount?: number;
        reason?: string;
    }): Promise<{
        message: string;
        paymentId: string;
    }>;
    getTransactions(query: any): Promise<{
        data: {
            id: string;
            ownerId: string;
            bookingId: string | undefined;
            amount: number;
            description: string;
            createdAt: Date;
            type: string;
            category: string;
            ownerType: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
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
                createdAt: Date;
                updatedAt: Date;
                name: string;
                registrationNumber: string | null;
                address: string | null;
                city: string | null;
                phone: string | null;
                email: string | null;
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
                user: {
                    email: string | null;
                    fullName: string;
                };
                status: import(".prisma/client").$Enums.StaffStatus;
                createdAt: Date;
                walletBalance: import("@prisma/client/runtime/library").Decimal;
                role: import(".prisma/client").$Enums.StaffRole;
                creditLimit: import("@prisma/client/runtime/library").Decimal;
            } | null;
            status: string;
            id: number;
            payoutType: string;
            method: string;
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
                    phone: string | null;
                    email: string | null;
                    fullName: string;
                    avatar: string | null;
                    passwordHash: string | null;
                    role: import(".prisma/client").$Enums.UserRole;
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
                    verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
                    description: string | null;
                    latitude: import("@prisma/client/runtime/library").Decimal | null;
                    longitude: import("@prisma/client/runtime/library").Decimal | null;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    registrationNumber: string | null;
                    address: string | null;
                    city: string | null;
                    phone: string | null;
                    email: string | null;
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
                status: import(".prisma/client").$Enums.BookingStatus;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                companyEarnings: import("@prisma/client/runtime/library").Decimal;
                serviceId: bigint;
                assignedStaffId: bigint | null;
                latitude: import("@prisma/client/runtime/library").Decimal | null;
                longitude: import("@prisma/client/runtime/library").Decimal | null;
                progressPercent: number;
                platformFee: import("@prisma/client/runtime/library").Decimal;
                staffEarnings: import("@prisma/client/runtime/library").Decimal;
                bookingDate: Date;
                startTime: Date;
                endTime: Date;
                actualStartTime: Date | null;
                actualEndTime: Date | null;
                serviceAddress: string;
                staffNotes: string | null;
                createdAt: Date;
                updatedAt: Date;
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
    updatePayoutStatus(id: number, status: string): Promise<{
        message: string;
        payout: {
            companyId: string | undefined;
            status: string;
            id: number;
            amount: import("@prisma/client/runtime/library").Decimal;
            staffId: bigint | null;
            payoutType: string;
            method: string;
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
}
