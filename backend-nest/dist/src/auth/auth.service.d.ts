import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import { VerifyResetDto } from './dto/verify-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { FacebookLoginDto } from './dto/facebook-login.dto';
import { MfaService } from './mfa.service';
import { AnalyticsService } from '../analytics/analytics.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private mailService;
    private configService;
    private auditLogs;
    private mfaService;
    private analytics;
    private googleClient;
    constructor(prisma: PrismaService, jwtService: JwtService, mailService: MailService, configService: ConfigService, auditLogs: AuditLogsService, mfaService: MfaService, analytics: AnalyticsService);
    generateToken(userId: bigint): string;
    generateRefreshToken(userId: bigint): Promise<string>;
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    revokeRefreshToken(refreshToken: string): Promise<void>;
    revokeAllUserTokens(userId: bigint): Promise<void>;
    register(registerDto: RegisterDto): Promise<{
        user: {
            id: bigint;
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            role: import(".prisma/client").$Enums.UserRole;
            fullName: string;
            email: string | null;
            phone: string | null;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        message: string;
        requiresMfa: boolean;
        tempMfaToken: string;
        user: {
            id: string;
            email: string | null;
        };
        accessToken?: undefined;
        refreshToken?: undefined;
    } | {
        message: string;
        user: {
            staffProfile: ({
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
            }) | null;
            id: bigint;
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
        accessToken: string;
        refreshToken: string;
        requiresMfa?: undefined;
        tempMfaToken?: undefined;
    }>;
    verifyMfaLogin(tempToken: string, code: string): Promise<{
        message: string;
        user: {
            staffProfile: ({
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
            }) | null;
            id: bigint;
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
        accessToken: string;
        refreshToken: string;
    }>;
    generateMfa(userId: bigint, email: string): Promise<{
        secret: string;
        qrCodeUrl: string;
    }>;
    enableMfa(userId: bigint, secret: string, token: string): Promise<{
        message: string;
    }>;
    getMe(userId: bigint): Promise<{
        user: {
            staffProfile: {
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
            };
            id: bigint;
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            role: import(".prisma/client").$Enums.UserRole;
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
        };
    }>;
    requestOtp(phone: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtpToken(phone: string, code: string): Promise<{
        message: string;
        user: {
            staffProfile: ({
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
            }) | null;
            id: bigint;
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
        accessToken: string;
        refreshToken: string;
    }>;
    private generateCode;
    requestPasswordReset(dto: RequestResetDto): Promise<{
        message: string;
    }>;
    verifyResetCode(dto: VerifyResetDto): Promise<{
        message: string;
        valid: boolean;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    googleLogin(dto: GoogleLoginDto): Promise<{
        message: string;
        user: {
            staffProfile: ({
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
            }) | null;
            id: bigint;
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
        accessToken: string;
        refreshToken: string;
    }>;
    facebookLogin(dto: FacebookLoginDto): Promise<{
        message: string;
        user: {
            staffProfile: ({
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
            }) | null;
            id: bigint;
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
        accessToken: string;
        refreshToken: string;
    }>;
}
