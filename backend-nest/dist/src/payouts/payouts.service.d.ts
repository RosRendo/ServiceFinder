import { PrismaService } from '../prisma/prisma.service';
export declare class PayoutsService {
    private prisma;
    constructor(prisma: PrismaService);
    getCompanyByOwnerId(ownerId: bigint): Promise<{
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
    } | null>;
    getPayouts(companyId: bigint): Promise<{
        payouts: {
            id: number;
            status: string;
            companyId: bigint | null;
            method: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            staffId: bigint | null;
            payoutType: string;
            transactionId: string | null;
            requestedAt: Date;
            processedAt: Date | null;
        }[];
        availableBalance: number;
    }>;
    requestPayout(companyId: bigint, amount: number, method: string): Promise<{
        message: string;
        payout: {
            id: number;
            status: string;
            companyId: bigint | null;
            method: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            staffId: bigint | null;
            payoutType: string;
            transactionId: string | null;
            requestedAt: Date;
            processedAt: Date | null;
        };
    }>;
    getStaffPayouts(staffId: bigint): Promise<{
        payouts: {
            id: number;
            status: string;
            companyId: bigint | null;
            method: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            staffId: bigint | null;
            payoutType: string;
            transactionId: string | null;
            requestedAt: Date;
            processedAt: Date | null;
        }[];
        availableBalance: number;
    }>;
    requestStaffPayout(staffId: bigint, amount: number, method: string): Promise<{
        message: string;
        payout: {
            id: number;
            status: string;
            companyId: bigint | null;
            method: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            staffId: bigint | null;
            payoutType: string;
            transactionId: string | null;
            requestedAt: Date;
            processedAt: Date | null;
        };
    }>;
    getStaffPayoutsForCompanyMember(staffId: bigint, companyId: bigint): Promise<{
        payouts: {
            id: number;
            status: string;
            companyId: bigint | null;
            method: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            staffId: bigint | null;
            payoutType: string;
            transactionId: string | null;
            requestedAt: Date;
            processedAt: Date | null;
        }[];
    }>;
    approveStaffPayout(payoutId: number, companyId: bigint): Promise<{
        message: string;
        payout: {
            id: number;
            status: string;
            companyId: bigint | null;
            method: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            staffId: bigint | null;
            payoutType: string;
            transactionId: string | null;
            requestedAt: Date;
            processedAt: Date | null;
        };
    }>;
    rejectStaffPayout(payoutId: number, companyId: bigint): Promise<{
        message: string;
        payout: {
            id: number;
            status: string;
            companyId: bigint | null;
            method: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            staffId: bigint | null;
            payoutType: string;
            transactionId: string | null;
            requestedAt: Date;
            processedAt: Date | null;
        };
    }>;
    getPaymentMethods(companyId: bigint): Promise<{
        paymentMethods: {
            id: number;
            createdAt: Date;
            companyId: bigint;
            type: string;
            accountName: string;
            isDefault: boolean;
            isVerified: boolean;
        }[];
    }>;
    addPaymentMethod(companyId: bigint, dto: {
        type: string;
        accountName: string;
        accountNumber: string;
        routingNumber?: string;
        isDefault?: boolean;
    }): Promise<{
        message: string;
        paymentMethod: {
            id: number;
            createdAt: Date;
            companyId: bigint;
            type: string;
            accountName: string;
            isDefault: boolean;
            isVerified: boolean;
        };
    }>;
    updatePaymentMethod(id: number, companyId: bigint, dto: {
        accountName?: string;
        isDefault?: boolean;
    }): Promise<{
        message: string;
        paymentMethod: {
            id: number;
            companyId: bigint;
            type: string;
            accountName: string;
            isDefault: boolean;
            isVerified: boolean;
        };
    }>;
    deletePaymentMethod(id: number, companyId: bigint): Promise<{
        message: string;
    }>;
    getStaffPaymentMethods(staffId: bigint): Promise<{
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
    }>;
    addStaffPaymentMethod(staffId: bigint, dto: {
        type: string;
        accountName: string;
        accountNumber: string;
        routingNumber?: string;
        qrCodeUrl?: string;
        isDefault?: boolean;
    }): Promise<{
        message: string;
        paymentMethod: {
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
        };
    }>;
    updateStaffPaymentMethod(id: number, staffId: bigint, dto: {
        accountName?: string;
        isDefault?: boolean;
    }): Promise<{
        message: string;
        paymentMethod: {
            id: number;
            staffId: bigint;
            type: string;
            accountName: string;
            isDefault: boolean;
            isVerified: boolean;
        };
    }>;
    deleteStaffPaymentMethod(id: number, staffId: bigint): Promise<{
        message: string;
    }>;
    getAllPayouts(status?: string, type?: string): Promise<{
        payouts: ({
            staff: {
                id: bigint;
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
            } | null;
            company: {
                id: bigint;
                name: string;
                owner: {
                    email: string | null;
                    fullName: string;
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
            } | null;
        } & {
            id: number;
            status: string;
            companyId: bigint | null;
            method: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            staffId: bigint | null;
            payoutType: string;
            transactionId: string | null;
            requestedAt: Date;
            processedAt: Date | null;
        })[];
    }>;
    processPayout(payoutId: number, adminUserId: bigint, transactionId?: string): Promise<{
        message: string;
        payout: {
            id: number;
            status: string;
            companyId: bigint | null;
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
