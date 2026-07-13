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
            email: string | null;
            phone: string | null;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
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
            _count: {
                bookingsAsCustomer: number;
                reviews: number;
            };
            email: string | null;
            phone: string | null;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
            lastLoginAt: Date | null;
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
                role: import(".prisma/client").$Enums.StaffRole;
                walletBalance: import("@prisma/client/runtime/library").Decimal;
                companyId: bigint;
                creditLimit: import("@prisma/client/runtime/library").Decimal;
                userId: bigint;
            })[];
        };
    }>;
    updateUser(id: bigint, dto: UpdateUserDto, currentUser: any): Promise<{
        message: string;
        user: {
            id: bigint;
            status: import(".prisma/client").$Enums.UserStatus;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            fullName: string;
            avatar: string | null;
            role: import(".prisma/client").$Enums.UserRole;
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
            email: string | null;
            phone: string | null;
            fullName: string;
            avatar: string | null;
            role: import(".prisma/client").$Enums.UserRole;
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
            email: string | null;
            fullName: string;
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
            name: string;
            createdAt: Date;
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
