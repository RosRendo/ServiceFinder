import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { RequestContactUpdateDto } from './dto/request-contact-update.dto';
import { VerifyContactUpdateDto } from './dto/verify-contact-update.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
            ownedCompanies: {
                id: bigint;
                name: string;
                verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
            }[];
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
