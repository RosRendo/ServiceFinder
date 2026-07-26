import { AuthService } from './auth.service';
import * as express from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import { VerifyResetDto } from './dto/verify-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { FacebookLoginDto } from './dto/facebook-login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    private setAuthCookies;
    register(registerDto: RegisterDto, res: express.Response): Promise<{
        message: string;
        user: {
            id: bigint;
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            email: string | null;
            phone: string | null;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        token: string;
    }>;
    login(loginDto: LoginDto, res: express.Response): Promise<{
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
            id: string;
            email: string | null;
        } | {
            staffProfile: ({
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
            }) | null;
            id: bigint;
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
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
        token: string | undefined;
    }>;
    verifyMfa(body: {
        tempToken: string;
        code: string;
    }, res: express.Response): Promise<{
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
                role: import(".prisma/client").$Enums.StaffRole;
                walletBalance: import("@prisma/client/runtime/library").Decimal;
                companyId: bigint;
                creditLimit: import("@prisma/client/runtime/library").Decimal;
                userId: bigint;
            }) | null;
            id: bigint;
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
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
        token: string;
    }>;
    generateMfa(user: any): Promise<{
        secret: string;
        qrCodeUrl: string;
    }>;
    enableMfa(user: any, body: {
        secret: string;
        code: string;
    }): Promise<{
        message: string;
    }>;
    requestOtp(body: {
        phone: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(verifyOtpDto: VerifyOtpDto, res: express.Response): Promise<{
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
                role: import(".prisma/client").$Enums.StaffRole;
                walletBalance: import("@prisma/client/runtime/library").Decimal;
                companyId: bigint;
                creditLimit: import("@prisma/client/runtime/library").Decimal;
                userId: bigint;
            }) | null;
            id: bigint;
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
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
        token: string;
    }>;
    refresh(req: express.Request, res: express.Response): Promise<{
        message: string;
        token: string;
    }>;
    googleLogin(googleLoginDto: GoogleLoginDto, res: express.Response): Promise<{
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
                role: import(".prisma/client").$Enums.StaffRole;
                walletBalance: import("@prisma/client/runtime/library").Decimal;
                companyId: bigint;
                creditLimit: import("@prisma/client/runtime/library").Decimal;
                userId: bigint;
            }) | null;
            id: bigint;
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
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
        token: string;
    }>;
    facebookLogin(facebookLoginDto: FacebookLoginDto, res: express.Response): Promise<{
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
                role: import(".prisma/client").$Enums.StaffRole;
                walletBalance: import("@prisma/client/runtime/library").Decimal;
                companyId: bigint;
                creditLimit: import("@prisma/client/runtime/library").Decimal;
                userId: bigint;
            }) | null;
            id: bigint;
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
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
        token: string;
    }>;
    getMe(user: any): Promise<{
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
                role: import(".prisma/client").$Enums.StaffRole;
                walletBalance: import("@prisma/client/runtime/library").Decimal;
                companyId: bigint;
                creditLimit: import("@prisma/client/runtime/library").Decimal;
                userId: bigint;
            };
            id: bigint;
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
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
                role: import(".prisma/client").$Enums.StaffRole;
                walletBalance: import("@prisma/client/runtime/library").Decimal;
                companyId: bigint;
                creditLimit: import("@prisma/client/runtime/library").Decimal;
                userId: bigint;
            })[];
        };
    }>;
    logout(req: express.Request, res: express.Response): Promise<{
        success: boolean;
        message: string;
    }>;
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
}
