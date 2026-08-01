import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { RequestContactUpdateDto } from './dto/request-contact-update.dto';
import { VerifyContactUpdateDto } from './dto/verify-contact-update.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllUsers(query: {
        role?: string;
        status?: string;
        page?: string;
        limit?: string;
    }): Promise<{
        users: {
            id: bigint;
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            role: import(".prisma/client").$Enums.UserRole;
            fullName: string;
            email: string | null;
            phone: string | null;
            lastLoginAt: Date | null;
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
    updateUser(id: bigint, dto: UpdateUserDto, currentUser: any): Promise<{
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
    requestContactUpdate(userId: bigint, dto: RequestContactUpdateDto): Promise<{
        message: string;
    }>;
    verifyContactUpdate(userId: bigint, dto: VerifyContactUpdateDto): Promise<{
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
    deleteUser(id: bigint, currentUser: any): Promise<{
        message: string;
    }>;
    updateUserStatus(id: bigint, dto: UpdateStatusDto, currentUser: any): Promise<{
        message: string;
        user: {
            id: bigint;
            status: import(".prisma/client").$Enums.UserStatus;
            fullName: string;
            email: string | null;
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
