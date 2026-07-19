"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
const uuid_1 = require("uuid");
const google_auth_library_1 = require("google-auth-library");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const mfa_service_1 = require("./mfa.service");
const analytics_service_1 = require("../analytics/analytics.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    mailService;
    configService;
    auditLogs;
    mfaService;
    analytics;
    googleClient;
    constructor(prisma, jwtService, mailService, configService, auditLogs, mfaService, analytics) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.mailService = mailService;
        this.configService = configService;
        this.auditLogs = auditLogs;
        this.mfaService = mfaService;
        this.analytics = analytics;
        this.googleClient = new google_auth_library_1.OAuth2Client(this.configService.get('GOOGLE_CLIENT_ID'));
    }
    generateToken(userId) {
        return this.jwtService.sign({ userId: userId.toString() });
    }
    async generateRefreshToken(userId) {
        const token = (0, uuid_1.v4)();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await this.prisma.refreshToken.create({
            data: { token, userId, expiresAt },
        });
        return token;
    }
    async refreshAccessToken(refreshToken) {
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('No refresh token provided');
        }
        const stored = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });
        if (!stored || stored.expiresAt < new Date()) {
            if (stored) {
                await this.prisma.refreshToken.delete({ where: { id: stored.id } });
            }
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
        const accessToken = this.generateToken(stored.userId);
        const newRefreshToken = await this.generateRefreshToken(stored.userId);
        return { accessToken, refreshToken: newRefreshToken };
    }
    async revokeRefreshToken(refreshToken) {
        await this.prisma.refreshToken.deleteMany({
            where: { token: refreshToken },
        });
    }
    async revokeAllUserTokens(userId) {
        await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
    async register(registerDto) {
        const { fullName, email, phone, password, role = 'customer' } = registerDto;
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                fullName,
                email,
                phone,
                passwordHash,
                role: role,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });
        const accessToken = this.generateToken(user.id);
        const refreshToken = await this.generateRefreshToken(user.id);
        await this.auditLogs.log({
            action: 'user_registered',
            userId: user.id,
            entityType: 'user',
            entityId: user.id,
        });
        this.analytics.captureEvent(user.id.toString(), 'user_signed_up', {
            role: user.role,
            method: 'email',
        });
        return { user, accessToken, refreshToken };
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.status !== 'active') {
            throw new common_1.UnauthorizedException('Account is suspended');
        }
        if (!user.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid credentials or try logging in with OTP');
        }
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.mfaEnabled) {
            const tempMfaToken = this.jwtService.sign({ userId: user.id.toString(), isMfaTemp: true }, { expiresIn: '5m' });
            return {
                message: 'MFA required',
                requiresMfa: true,
                tempMfaToken,
                user: { id: user.id.toString(), email: user.email },
            };
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const accessToken = this.generateToken(user.id);
        const refreshToken = await this.generateRefreshToken(user.id);
        const { passwordHash, ...userWithoutPassword } = user;
        const fullUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            include: {
                staffMemberships: {
                    include: { company: { select: { id: true, name: true } } },
                },
            },
        });
        const staffProfile = fullUser?.staffMemberships?.[0] || null;
        await this.auditLogs.log({
            action: 'user_login',
            userId: user.id,
            entityType: 'user',
            entityId: user.id,
        });
        return {
            message: 'Login successful',
            user: { ...userWithoutPassword, staffProfile },
            accessToken,
            refreshToken,
        };
    }
    async verifyMfaLogin(tempToken, code) {
        try {
            const payload = this.jwtService.verify(tempToken);
            if (!payload.isMfaTemp) {
                throw new common_1.UnauthorizedException('Invalid MFA token');
            }
            const userId = BigInt(payload.userId);
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!user || !user.mfaEnabled || !user.mfaSecret) {
                throw new common_1.UnauthorizedException('MFA not properly configured for this user');
            }
            const isValid = this.mfaService.isMfaTokenValid(code, user.mfaSecret);
            if (!isValid) {
                throw new common_1.UnauthorizedException('Invalid MFA code');
            }
            await this.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
            const accessToken = this.generateToken(user.id);
            const refreshToken = await this.generateRefreshToken(user.id);
            const { passwordHash, ...userWithoutPassword } = user;
            const fullUser = await this.prisma.user.findUnique({
                where: { id: user.id },
                include: {
                    staffMemberships: {
                        include: { company: { select: { id: true, name: true } } },
                    },
                },
            });
            const staffProfile = fullUser?.staffMemberships?.[0] || null;
            await this.auditLogs.log({
                action: 'user_login_mfa',
                userId: user.id,
                entityType: 'user',
                entityId: user.id,
            });
            return {
                message: 'Login successful',
                user: { ...userWithoutPassword, staffProfile },
                accessToken,
                refreshToken,
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid or expired MFA token');
        }
    }
    async generateMfa(userId, email) {
        const { secret, qrCodeUrl } = await this.mfaService.generateMfaSecret(email);
        return { secret, qrCodeUrl };
    }
    async enableMfa(userId, secret, token) {
        const isValid = this.mfaService.isMfaTokenValid(token, secret);
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid TOTP token');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { mfaEnabled: true, mfaSecret: secret },
        });
        return { message: 'MFA enabled successfully' };
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                staffMemberships: {
                    include: { company: { select: { id: true, name: true } } },
                },
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const staffProfile = user.staffMemberships?.[0] || null;
        return {
            user: {
                ...user,
                staffProfile,
            },
        };
    }
    async verifyFirebaseToken(idToken) {
        if (!idToken) {
            throw new common_1.BadRequestException('Firebase ID token is required');
        }
        let decodedToken;
        try {
            const { getAuth } = require('firebase-admin/auth');
            decodedToken = await getAuth().verifyIdToken(idToken);
        }
        catch (error) {
            console.error('Firebase verifyIdToken error detail:', error.message || error);
            throw new common_1.UnauthorizedException(`Firebase Auth Error: ${error.message || 'Invalid token'}`);
        }
        const phone = decodedToken.phone_number;
        if (!phone) {
            throw new common_1.BadRequestException('Firebase token does not contain a verified phone number');
        }
        let user = await this.prisma.user.findUnique({
            where: { phone },
        });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    phone,
                    fullName: 'New User',
                    role: 'customer',
                },
            });
            await this.auditLogs.log({
                action: 'user_registered_otp',
                userId: user.id,
                entityType: 'user',
                entityId: user.id,
            });
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const accessToken = this.generateToken(user.id);
        const refreshToken = await this.generateRefreshToken(user.id);
        const fullUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            include: {
                staffMemberships: {
                    include: { company: { select: { id: true, name: true } } },
                },
            },
        });
        const staffProfile = fullUser?.staffMemberships?.[0] || null;
        const { passwordHash, ...userWithoutPassword } = user;
        await this.auditLogs.log({
            action: 'user_login_otp',
            userId: user.id,
            entityType: 'user',
            entityId: user.id,
        });
        return {
            message: 'Login successful',
            user: { ...userWithoutPassword, staffProfile },
            accessToken,
            refreshToken,
        };
    }
    async requestPasswordReset(dto) {
        const { email, phone } = dto;
        if (!email && !phone)
            throw new common_1.BadRequestException('Email or phone is required');
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
            },
        });
        if (!user) {
            return { message: 'If the email exists, a reset code has been sent' };
        }
        const code = this.generateCode();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        await this.prisma.passwordReset.updateMany({
            where: { userId: user.id, used: false },
            data: { used: true },
        });
        await this.prisma.passwordReset.create({
            data: {
                userId: user.id,
                code,
                expiresAt,
            },
        });
        if (email && user.email === email) {
            await this.mailService.sendPasswordResetEmail(user.email, code, user.fullName);
        }
        else if (phone && user.phone === phone) {
        }
        return { message: 'If the account exists, a reset code has been sent' };
    }
    async verifyResetCode(dto) {
        const { email, phone, code } = dto;
        if (!email && !phone)
            throw new common_1.BadRequestException('Email or phone is required');
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Invalid code');
        }
        const resetCode = await this.prisma.passwordReset.findFirst({
            where: {
                userId: user.id,
                code,
                used: false,
                expiresAt: { gt: new Date() },
            },
        });
        if (!resetCode) {
            throw new common_1.BadRequestException('Invalid or expired code');
        }
        return { message: 'Code verified successfully', valid: true };
    }
    async resetPassword(dto) {
        const { email, phone, code, newPassword } = dto;
        if (!email && !phone)
            throw new common_1.BadRequestException('Email or phone is required');
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Invalid code');
        }
        const resetCode = await this.prisma.passwordReset.findFirst({
            where: {
                userId: user.id,
                code,
                used: false,
                expiresAt: { gt: new Date() },
            },
        });
        if (!resetCode) {
            throw new common_1.BadRequestException('Invalid or expired code');
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: user.id },
                data: { passwordHash },
            }),
            this.prisma.passwordReset.update({
                where: { id: resetCode.id },
                data: { used: true },
            }),
        ]);
        await this.revokeAllUserTokens(user.id);
        await this.auditLogs.log({
            action: 'password_reset_completed',
            userId: user.id,
            entityType: 'user',
            entityId: user.id,
        });
        return { message: 'Password reset successfully' };
    }
    async googleLogin(dto) {
        const { token, role = 'customer' } = dto;
        const ticket = await this.googleClient.verifyIdToken({
            idToken: token,
            audience: [
                this.configService.get('GOOGLE_CLIENT_ID'),
                this.configService.get('GOOGLE_IOS_CLIENT_ID'),
                this.configService.get('GOOGLE_ANDROID_CLIENT_ID'),
            ].filter(Boolean),
        });
        const payload = ticket.getPayload();
        if (!payload)
            throw new common_1.BadRequestException('Invalid Google token');
        const { email, name, picture, sub: googleId } = payload;
        if (!email)
            throw new common_1.BadRequestException('Email not provided from Google');
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            const randomPassword = Math.random().toString(36).slice(-10) +
                Math.random().toString(36).slice(-10);
            const passwordHash = await bcrypt.hash(randomPassword, 10);
            user = await this.prisma.user.create({
                data: {
                    fullName: name || 'User',
                    email,
                    avatar: picture,
                    passwordHash,
                    role: role,
                    status: 'active',
                },
            });
        }
        if (user.status !== 'active') {
            throw new common_1.UnauthorizedException('Account is suspended');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const accessToken = this.generateToken(user.id);
        const refreshToken = await this.generateRefreshToken(user.id);
        const { passwordHash, ...userWithoutPassword } = user;
        const fullUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            include: {
                staffMemberships: {
                    include: { company: { select: { id: true, name: true } } },
                },
            },
        });
        const staffProfile = fullUser?.staffMemberships?.[0] || null;
        return {
            message: 'Google login successful',
            user: { ...userWithoutPassword, staffProfile },
            accessToken,
            refreshToken,
        };
    }
    async facebookLogin(dto) {
        const { token, role = 'customer' } = dto;
        try {
            const fbResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`);
            if (!fbResponse.ok) {
                throw new common_1.BadRequestException('Invalid Facebook token');
            }
            const payload = await fbResponse.json();
            if (!payload || !payload.email) {
                throw new common_1.BadRequestException('Email not provided from Facebook');
            }
            const { email, name, picture, id: facebookId } = payload;
            const avatarUrl = picture?.data?.url || null;
            let user = await this.prisma.user.findUnique({ where: { email } });
            if (!user) {
                const randomPassword = Math.random().toString(36).slice(-10) +
                    Math.random().toString(36).slice(-10);
                const passwordHash = await bcrypt.hash(randomPassword, 10);
                user = await this.prisma.user.create({
                    data: {
                        fullName: name || 'User',
                        email,
                        avatar: avatarUrl,
                        passwordHash,
                        role: role,
                        status: 'active',
                    },
                });
            }
            if (user.status !== 'active') {
                throw new common_1.UnauthorizedException('Account is suspended');
            }
            await this.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
            const accessToken = this.generateToken(user.id);
            const refreshToken = await this.generateRefreshToken(user.id);
            const { passwordHash, ...userWithoutPassword } = user;
            const fullUser = await this.prisma.user.findUnique({
                where: { id: user.id },
                include: {
                    staffMemberships: {
                        include: { company: { select: { id: true, name: true } } },
                    },
                },
            });
            const staffProfile = fullUser?.staffMemberships?.[0] || null;
            return {
                message: 'Facebook login successful',
                user: { ...userWithoutPassword, staffProfile },
                accessToken,
                refreshToken,
            };
        }
        catch (err) {
            throw new common_1.BadRequestException(err.message || 'Facebook authentication failed');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        mail_service_1.MailService,
        config_1.ConfigService,
        audit_logs_service_1.AuditLogsService,
        mfa_service_1.MfaService,
        analytics_service_1.AnalyticsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map