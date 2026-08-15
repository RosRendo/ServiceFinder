import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { RequestContactUpdateDto } from './dto/request-contact-update.dto';
import { VerifyContactUpdateDto } from './dto/verify-contact-update.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    createUser(body: any): Promise<{
        data: {
            id: bigint;
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            role: import(".prisma/client").$Enums.UserRole;
            fullName: string;
            email: string | null;
            phone: string | null;
            avatar: string | null;
            passwordHash: string | null;
            googleId: string | null;
            appleId: string | null;
            facebookId: string | null;
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
    getAllUsers(query: any): Promise<{
        users: {
            id: bigint;
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            role: import(".prisma/client").$Enums.UserRole;
            _count: {
                bookingsAsCustomer: number;
            };
            fullName: string;
            email: string | null;
            phone: string | null;
            lastLoginAt: Date | null;
            staffMemberships: ({
                company: {
                    id: bigint;
                    name: string;
                };
            } & {
                id: bigint;
                status: import(".prisma/client").$Enums.StaffStatus;
                createdAt: Date;
                companyId: bigint;
                userId: bigint;
                role: import(".prisma/client").$Enums.StaffRole;
                creditLimit: import("@prisma/client/runtime/library").Decimal;
                walletBalance: import("@prisma/client/runtime/library").Decimal;
                splitPercent: import("@prisma/client/runtime/library").Decimal | null;
            })[];
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
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
    getMyPreferences(user: any): Promise<{
        emailNotificationsEnabled: boolean;
        pushNotificationsEnabled: boolean;
    }>;
    updateMyPreferences(dto: {
        emailNotificationsEnabled?: boolean;
        pushNotificationsEnabled?: boolean;
        pushToken?: string;
    }, user: any): Promise<{
        pushToken: string | null;
        emailNotificationsEnabled: boolean;
        pushNotificationsEnabled: boolean;
    }>;
    getUserById(id: string): Promise<{
        user: {
            id: bigint;
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            role: import(".prisma/client").$Enums.UserRole;
            _count: {
                reviews: number;
                bookingsAsCustomer: number;
                cancellationsMade: number;
                messages: number;
                notifications: number;
            };
            fullName: string;
            email: string | null;
            phone: string | null;
            lastLoginAt: Date | null;
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
                bookingDate: Date;
                status: import(".prisma/client").$Enums.BookingStatus;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                platformFee: import("@prisma/client/runtime/library").Decimal;
                companyEarnings: import("@prisma/client/runtime/library").Decimal;
                createdAt: Date;
                company: {
                    id: bigint;
                    name: string;
                    logoUrl: string | null;
                };
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
                assignedStaff: {
                    id: bigint;
                    user: {
                        fullName: string;
                    };
                } | null;
            }[];
            cancellationsMade: {
                id: bigint;
                cancelledAt: Date;
            }[];
            ownedCompanies: {
                id: bigint;
                walletBalance: import("@prisma/client/runtime/library").Decimal;
                _count: {
                    bookings: number;
                    staff: number;
                    services: number;
                };
                name: string;
                bookings: {
                    bookingDate: Date;
                    totalPrice: import("@prisma/client/runtime/library").Decimal;
                    platformFee: import("@prisma/client/runtime/library").Decimal;
                    companyEarnings: import("@prisma/client/runtime/library").Decimal;
                    createdAt: Date;
                }[];
                verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
                logoUrl: string | null;
                pendingBalance: import("@prisma/client/runtime/library").Decimal;
                availableBalance: import("@prisma/client/runtime/library").Decimal;
                platformFeePercent: import("@prisma/client/runtime/library").Decimal | null;
                completedJobs: number;
                ratingSummary: {
                    averageRating: import("@prisma/client/runtime/library").Decimal | null;
                    totalReviews: number;
                } | null;
            }[];
            staffMemberships: ({
                assignedBookings: {
                    id: bigint;
                    bookingDate: Date;
                    status: import(".prisma/client").$Enums.BookingStatus;
                    totalPrice: import("@prisma/client/runtime/library").Decimal;
                    staffEarnings: import("@prisma/client/runtime/library").Decimal;
                    company: {
                        name: string;
                    };
                    service: {
                        name: string;
                    };
                    customer: {
                        fullName: string;
                    };
                }[];
                company: {
                    id: bigint;
                    name: string;
                    logoUrl: string | null;
                    ratingSummary: {
                        averageRating: import("@prisma/client/runtime/library").Decimal | null;
                    } | null;
                };
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
            } & {
                id: bigint;
                status: import(".prisma/client").$Enums.StaffStatus;
                createdAt: Date;
                companyId: bigint;
                userId: bigint;
                role: import(".prisma/client").$Enums.StaffRole;
                creditLimit: import("@prisma/client/runtime/library").Decimal;
                walletBalance: import("@prisma/client/runtime/library").Decimal;
                splitPercent: import("@prisma/client/runtime/library").Decimal | null;
            })[];
        };
    }>;
    updateUserPut(id: string, updateUserDto: UpdateUserDto, user: any): Promise<{
        message: string;
        user: {
            id: bigint;
            status: import(".prisma/client").$Enums.UserStatus;
            updatedAt: Date;
            role: import(".prisma/client").$Enums.UserRole;
            fullName: string;
            email: string | null;
            phone: string | null;
            avatar: string | null;
        };
    }>;
    updateUserPatch(id: string, updateUserDto: UpdateUserDto, user: any): Promise<{
        message: string;
        user: {
            id: bigint;
            status: import(".prisma/client").$Enums.UserStatus;
            updatedAt: Date;
            role: import(".prisma/client").$Enums.UserRole;
            fullName: string;
            email: string | null;
            phone: string | null;
            avatar: string | null;
        };
    }>;
    requestContactUpdate(requestContactUpdateDto: RequestContactUpdateDto, user: any): Promise<{
        message: string;
    }>;
    verifyContactUpdate(verifyContactUpdateDto: VerifyContactUpdateDto, user: any): Promise<{
        message: string;
        user: {
            id: bigint;
            status: import(".prisma/client").$Enums.UserStatus;
            updatedAt: Date;
            role: import(".prisma/client").$Enums.UserRole;
            fullName: string;
            email: string | null;
            phone: string | null;
            avatar: string | null;
        };
    }>;
    deleteOwnAccount(user: any): Promise<{
        message: string;
    }>;
    deleteUser(id: string, user: any): Promise<{
        message: string;
    }>;
    updateUserStatus(id: string, updateStatusDto: UpdateStatusDto, user: any): Promise<{
        message: string;
        user: {
            id: bigint;
            status: import(".prisma/client").$Enums.UserStatus;
            fullName: string;
            email: string | null;
        };
    }>;
    updateStaffStatus(status: 'active' | 'inactive', user: any): Promise<{
        message: string;
    }>;
}
