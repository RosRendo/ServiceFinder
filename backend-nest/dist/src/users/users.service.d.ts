import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { RequestContactUpdateDto } from './dto/request-contact-update.dto';
import { VerifyContactUpdateDto } from './dto/verify-contact-update.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    createUser(dto: any): Promise<{
        data: {
            id: bigint;
            fullName: string;
            email: string | null;
            phone: string | null;
            avatar: string | null;
            passwordHash: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            status: import(".prisma/client").$Enums.UserStatus;
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
    getAllUsers(query: {
        role?: string;
        status?: string;
        page?: string;
        limit?: string;
    }): Promise<{
        users: {
            id: bigint;
            fullName: string;
            email: string | null;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            status: import(".prisma/client").$Enums.UserStatus;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            staffMemberships: ({
                company: {
                    id: bigint;
                    name: string;
                };
            } & {
                id: bigint;
                role: import(".prisma/client").$Enums.StaffRole;
                status: import(".prisma/client").$Enums.StaffStatus;
                createdAt: Date;
                walletBalance: import("@prisma/client/runtime/library").Decimal;
                companyId: bigint;
                userId: bigint;
                creditLimit: import("@prisma/client/runtime/library").Decimal;
                splitPercent: import("@prisma/client/runtime/library").Decimal | null;
            })[];
            _count: {
                bookingsAsCustomer: number;
            };
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getPreferences(userId: bigint): Promise<{
        emailNotificationsEnabled: boolean;
        pushNotificationsEnabled: boolean;
    }>;
    updatePreferences(userId: bigint, dto: {
        emailNotificationsEnabled?: boolean;
        pushNotificationsEnabled?: boolean;
        pushToken?: string;
    }): Promise<{
        pushToken: string | null;
        emailNotificationsEnabled: boolean;
        pushNotificationsEnabled: boolean;
    }>;
    getUserById(id: bigint): Promise<{
        user: {
            id: bigint;
            fullName: string;
            email: string | null;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            status: import(".prisma/client").$Enums.UserStatus;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            auditLogs: {
                id: bigint;
                createdAt: Date;
                user: {
                    fullName: string;
                } | null;
                action: string | null;
            }[];
            bookingsAsCustomer: {
                id: bigint;
                status: import(".prisma/client").$Enums.BookingStatus;
                createdAt: Date;
                company: {
                    id: bigint;
                    name: string;
                    logoUrl: string | null;
                };
                bookingDate: Date;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                platformFee: import("@prisma/client/runtime/library").Decimal;
                companyEarnings: import("@prisma/client/runtime/library").Decimal;
                assignedStaff: {
                    id: bigint;
                    user: {
                        fullName: string;
                    };
                } | null;
                service: {
                    id: bigint;
                    name: string;
                    serviceType: {
                        id: bigint;
                        name: string;
                        category: {
                            id: bigint;
                            name: string;
                            icon: string | null;
                        };
                    };
                };
            }[];
            cancellationsMade: {
                id: bigint;
                cancelledAt: Date;
            }[];
            ownedCompanies: {
                id: bigint;
                name: string;
                _count: {
                    staff: number;
                    bookings: number;
                    services: number;
                };
                verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
                logoUrl: string | null;
                walletBalance: import("@prisma/client/runtime/library").Decimal;
                pendingBalance: import("@prisma/client/runtime/library").Decimal;
                availableBalance: import("@prisma/client/runtime/library").Decimal;
                platformFeePercent: import("@prisma/client/runtime/library").Decimal | null;
                completedJobs: number;
                bookings: {
                    createdAt: Date;
                    bookingDate: Date;
                    totalPrice: import("@prisma/client/runtime/library").Decimal;
                    platformFee: import("@prisma/client/runtime/library").Decimal;
                    companyEarnings: import("@prisma/client/runtime/library").Decimal;
                }[];
                ratingSummary: {
                    averageRating: import("@prisma/client/runtime/library").Decimal | null;
                    totalReviews: number;
                } | null;
            }[];
            staffMemberships: ({
                reviews: {
                    id: bigint;
                    createdAt: Date;
                    customer: {
                        fullName: string;
                    };
                    booking: {
                        service: {
                            name: string;
                        };
                    };
                    staffRating: number | null;
                    staffComment: string | null;
                }[];
                company: {
                    id: bigint;
                    name: string;
                    logoUrl: string | null;
                    ratingSummary: {
                        averageRating: import("@prisma/client/runtime/library").Decimal | null;
                    } | null;
                };
                assignedBookings: {
                    id: bigint;
                    status: import(".prisma/client").$Enums.BookingStatus;
                    customer: {
                        fullName: string;
                    };
                    company: {
                        name: string;
                    };
                    bookingDate: Date;
                    totalPrice: import("@prisma/client/runtime/library").Decimal;
                    staffEarnings: import("@prisma/client/runtime/library").Decimal;
                    service: {
                        name: string;
                    };
                }[];
            } & {
                id: bigint;
                role: import(".prisma/client").$Enums.StaffRole;
                status: import(".prisma/client").$Enums.StaffStatus;
                createdAt: Date;
                walletBalance: import("@prisma/client/runtime/library").Decimal;
                companyId: bigint;
                userId: bigint;
                creditLimit: import("@prisma/client/runtime/library").Decimal;
                splitPercent: import("@prisma/client/runtime/library").Decimal | null;
            })[];
            _count: {
                bookingsAsCustomer: number;
                cancellationsMade: number;
                messages: number;
                notifications: number;
                reviews: number;
            };
        };
    }>;
    updateUser(id: bigint, dto: UpdateUserDto, currentUser: any): Promise<{
        message: string;
        user: {
            id: bigint;
            fullName: string;
            email: string | null;
            phone: string | null;
            avatar: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            status: import(".prisma/client").$Enums.UserStatus;
            updatedAt: Date;
        };
    }>;
    requestContactUpdate(userId: bigint, dto: RequestContactUpdateDto): Promise<{
        message: string;
    }>;
    verifyContactUpdate(userId: bigint, dto: VerifyContactUpdateDto): Promise<{
        message: string;
        user: {
            id: bigint;
            fullName: string;
            email: string | null;
            phone: string | null;
            avatar: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            status: import(".prisma/client").$Enums.UserStatus;
            updatedAt: Date;
        };
    }>;
    deleteUser(id: bigint, currentUser: any): Promise<{
        message: string;
    }>;
    updateUserStatus(id: bigint, dto: UpdateStatusDto, currentUser: any): Promise<{
        message: string;
        user: {
            id: bigint;
            fullName: string;
            email: string | null;
            status: import(".prisma/client").$Enums.UserStatus;
        };
    }>;
    updateStaffStatus(userId: bigint, status: 'active' | 'inactive'): Promise<{
        message: string;
    }>;
    getAdminMetrics(): Promise<{
        totalUsers: number;
        totalCompanies: number;
        pendingCompanies: number;
        totalBookings: number;
        gmv: number;
        platformFees: number;
        recentCompanies: {
            id: bigint;
            createdAt: Date;
            name: string;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        }[];
    }>;
    getRecommendedStaff(query: any): Promise<{
        data: {
            id: string;
            userId: string;
            companyId: string;
            role: import(".prisma/client").$Enums.StaffRole;
            status: import(".prisma/client").$Enums.StaffStatus;
            user: {
                id: string;
                fullName: string;
                avatar: string | null;
            };
            company: {
                id: string;
                name: string;
            };
            jobsCompleted: number;
            rating: string;
        }[];
        count: number;
    }>;
    deleteAccount(userId: bigint): Promise<{
        message: string;
    }>;
}
