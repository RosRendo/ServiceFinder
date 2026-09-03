import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { SMS_PROVIDER } from '../common/sms/sms.provider';
import { SmsProvider } from '../common/sms/sms-provider.interface';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import { VerifyResetDto } from './dto/verify-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { FacebookLoginDto } from './dto/facebook-login.dto';
import { AppleLoginDto } from './dto/apple-login.dto';
import { normalizePhone } from '../common/utils/phone.util';
import * as admin from 'firebase-admin';
import appleSigninAuth from 'apple-signin-auth';

import { MfaService } from './mfa.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,
    private auditLogs: AuditLogsService,
    private mfaService: MfaService,
    private analytics: AnalyticsService,
    @Inject(SMS_PROVIDER) private smsProvider: SmsProvider,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  /** Generate a short-lived access token (15 min) */
  generateToken(userId: bigint, role?: string): string {
    return this.jwtService.sign(
      role
        ? { userId: userId.toString(), role }
        : { userId: userId.toString() },
    );
  }

  /** Generate a long-lived refresh token (7 days) and persist it to the DB */
  async generateRefreshToken(userId: bigint): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });

    return token;
  }

  /** Exchange a valid refresh token for a new access token + rotate refresh token */
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored || stored.expiresAt < new Date()) {
      // Delete expired / invalid token if it exists
      if (stored) {
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Token rotation: delete old, issue new
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    // Re-fetch the role so refreshed access tokens carry it too.
    const roleUser = await this.prisma.user.findUnique({
      where: { id: stored.userId },
      select: { role: true },
    });
    const accessToken = this.generateToken(stored.userId, roleUser?.role);
    const newRefreshToken = await this.generateRefreshToken(stored.userId);

    return { accessToken, refreshToken: newRefreshToken };
  }

  /** Invalidate a specific refresh token on logout */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const stored = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });
      if (stored?.userId) {
        await this.prisma.user.update({
          where: { id: stored.userId },
          data: { workingStatus: 'offline' },
        });
      }
    } catch (e) {
      // ignore
    }

    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  /** Invalidate ALL refresh tokens for a user (e.g. password change) */
  async revokeAllUserTokens(userId: bigint): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async register(registerDto: RegisterDto) {
    const { fullName, email, phone, password, role = 'customer' } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        passwordHash,
        role: role as any,
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

    const accessToken = this.generateToken(user.id, (user as any)?.role);
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

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is suspended');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Invalid credentials or try logging in with OTP',
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.mfaEnabled) {
      const tempMfaToken = this.jwtService.sign(
        { userId: user.id.toString(), isMfaTemp: true },
        { expiresIn: '5m' },
      );
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

    const accessToken = this.generateToken(user.id, (user as any)?.role);
    const refreshToken = await this.generateRefreshToken(user.id);
    const { passwordHash, ...userWithoutPassword } = user;

    // Attach staffProfile for frontend compatibility
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

  async verifyMfaLogin(tempToken: string, code: string) {
    try {
      const payload = this.jwtService.verify(tempToken);
      if (!payload.isMfaTemp) {
        throw new UnauthorizedException('Invalid MFA token');
      }

      const userId = BigInt(payload.userId);
      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      if (!user || !user.mfaEnabled || !user.mfaSecret) {
        throw new UnauthorizedException(
          'MFA not properly configured for this user',
        );
      }

      const isValid = this.mfaService.isMfaTokenValid(code, user.mfaSecret);
      if (!isValid) {
        throw new UnauthorizedException('Invalid MFA code');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const accessToken = this.generateToken(user.id, (user as any)?.role);
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
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired MFA token');
    }
  }

  async generateMfa(userId: bigint, email: string) {
    const { secret, qrCodeUrl } =
      await this.mfaService.generateMfaSecret(email);
    return { secret, qrCodeUrl };
  }

  async enableMfa(userId: bigint, secret: string, token: string) {
    const isValid = this.mfaService.isMfaTokenValid(token, secret);
    if (!isValid) {
      throw new BadRequestException('Invalid TOTP token');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true, mfaSecret: secret },
    });

    return { message: 'MFA enabled successfully' };
  }

  async getMe(userId: bigint) {
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

    if (!user) throw new NotFoundException('User not found');

    const staffProfile = user.staffMemberships?.[0] || null;

    return {
      user: {
        ...user,
        staffProfile,
      },
    };
  }

  async requestOtp(rawPhone: string) {
    // Normalize + validate FIRST — every invalid number that reaches Twilio
    // still costs money (charged per attempt, even for failures).
    const phone = normalizePhone(rawPhone);
    if (!phone) {
      throw new BadRequestException(
        'Invalid phone number. Use international format, e.g. +85512345678',
      );
    }

    // 60s cooldown between sends to the same number (blocks double-tap spam).
    const lastOtp = await this.prisma.otpCode.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });
    if (lastOtp) {
      const elapsed = Date.now() - lastOtp.createdAt.getTime();
      if (elapsed < 60_000) {
        const wait = Math.ceil((60_000 - elapsed) / 1000);
        throw new BadRequestException(
          `Please wait ${wait}s before requesting another code`,
        );
      }
    }

    // Daily cap per number: max 6 requests per day (hard cost ceiling).
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCount = await this.prisma.otpCode.count({
      where: { phone, createdAt: { gte: startOfDay } },
    });
    if (todayCount >= 6) {
      throw new BadRequestException(
        'Daily OTP limit reached for this number. Try again tomorrow.',
      );
    }

    // Invalidate previous OTPs locally
    await this.prisma.otpCode.updateMany({
      where: { phone, used: false },
      data: { used: true },
    });

    let success = false;
    // Ledger row is ALWAYS written (rate-limit bookkeeping + audit + delivery).
    const code = this.generateCode();
    await this.prisma.otpCode.create({
      data: {
        phone,
        code,
        expiresAt: new Date(Date.now() + 10 * 60000),
      },
    });

    // Send via the configured provider (twilio | http | mock).
    // Self-managed codes mean verification happens in our DB — no paid
    // round-trip through Twilio Verify, and any SMS provider can be used.
    success = await this.smsProvider.send(
      phone,
      `Your Service Finder OTP is ${code}. Valid for 10 minutes.`,
    );
    if (!success) {
      console.log(`[SMS MOCK FALLBACK] OTP for ${phone} is: ${code}`);
    }

    return {
      success: true,
      message: success
        ? 'OTP sent successfully'
        : 'OTP sent successfully (Sandbox Mock Mode)',
    };
  }

  async verifyOtpToken(rawPhone: string, code: string) {
    if (!code) {
      throw new BadRequestException('Code is required');
    }
    const phone = normalizePhone(rawPhone);
    if (!phone) {
      throw new BadRequestException('Invalid phone number');
    }

    // Self-managed codes: verify against the OTP ledger (works with any SMS
    // provider — the code never round-trips through the gateway).
    const otp = await this.prisma.otpCode.findFirst({
      where: { phone, code, used: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || otp.expiresAt < new Date()) {
      // Dev-only convenience code. NEVER allowed in production — it would let
      // anyone log in as any phone number.
      if (code === '123456' && process.env.NODE_ENV !== 'production') {
        // Proceed
      } else {
        throw new BadRequestException('Invalid or expired OTP');
      }
    } else {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { used: true },
      });
    }

    // Find user or create new one
    let user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      // Auto-register
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

    const accessToken = this.generateToken(user.id, (user as any)?.role);
    const refreshToken = await this.generateRefreshToken(user.id);

    // Attach staffProfile for frontend compatibility
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
      message: 'OTP verified successfully',
      user: { ...userWithoutPassword, staffProfile },
      accessToken,
      refreshToken,
    };
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async requestPasswordReset(dto: RequestResetDto) {
    const { email, phone } = dto;
    if (!email && !phone)
      throw new BadRequestException('Email or phone is required');

    // Validate/normalize phone before any paid SMS is sent.
    const normalizedPhone = phone ? normalizePhone(phone) : null;
    if (phone && !normalizedPhone) {
      throw new BadRequestException(
        'Invalid phone number. Use international format, e.g. +85512345678',
      );
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ],
      },
    });

    if (!user) {
      // Security: do not reveal if email doesn't exist
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
      await this.mailService.sendPasswordResetEmail(
        user.email,
        code,
        user.fullName,
      );
    } else if (normalizedPhone && user.phone === normalizedPhone) {
      const sent = await this.smsProvider.send(
        normalizedPhone,
        `Your Service Finder password reset code is: ${code}. Valid for 15 minutes.`,
      );
      if (!sent) {
        console.log(
          `[SMS MOCK FALLBACK] Password reset code for ${normalizedPhone} is: ${code}`,
        );
      }
    }
    return { message: 'If the account exists, a reset code has been sent' };
  }

  async verifyResetCode(dto: VerifyResetDto) {
    const { email, phone, code } = dto;
    if (!email && !phone)
      throw new BadRequestException('Email or phone is required');

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid code');
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
      throw new BadRequestException('Invalid or expired code');
    }

    return { message: 'Code verified successfully', valid: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { email, phone, code, newPassword } = dto;
    if (!email && !phone)
      throw new BadRequestException('Email or phone is required');

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid code');
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
      throw new BadRequestException('Invalid or expired code');
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

    // Invalidate all refresh tokens on password reset
    await this.revokeAllUserTokens(user.id);

    await this.auditLogs.log({
      action: 'password_reset_completed',
      userId: user.id,
      entityType: 'user',
      entityId: user.id,
    });

    return { message: 'Password reset successfully' };
  }

  async googleLogin(dto: GoogleLoginDto) {
    const { token, role = 'customer' } = dto;

    const ticket = await this.googleClient.verifyIdToken({
      idToken: token,
      audience: [
        this.configService.get<string>('GOOGLE_CLIENT_ID'),
        this.configService.get<string>('GOOGLE_IOS_CLIENT_ID'),
        this.configService.get<string>('GOOGLE_ANDROID_CLIENT_ID'),
      ].filter(Boolean) as string[],
    });

    const payload = ticket.getPayload();
    if (!payload) throw new BadRequestException('Invalid Google token');

    const { email, name, picture, sub: googleId } = payload;
    if (!email) throw new BadRequestException('Email not provided from Google');

    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      const randomPassword =
        Math.random().toString(36).slice(-10) +
        Math.random().toString(36).slice(-10);
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await this.prisma.user.create({
        data: {
          fullName: name || 'User',
          email,
          avatar: picture,
          passwordHash,
          role: role as any,
          status: 'active',
          googleId,
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is suspended');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = this.generateToken(user.id, (user as any)?.role);
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

  async facebookLogin(dto: FacebookLoginDto) {
    const { token, role = 'customer' } = dto;

    try {
      const fbResponse = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`,
      );
      if (!fbResponse.ok) {
        throw new BadRequestException('Invalid Facebook token');
      }

      const payload = await fbResponse.json();
      if (!payload || !payload.email) {
        throw new BadRequestException('Email not provided from Facebook');
      }

      const { email, name, picture, id: facebookId } = payload;
      const avatarUrl = picture?.data?.url || null;

      let user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) {
        const randomPassword =
          Math.random().toString(36).slice(-10) +
          Math.random().toString(36).slice(-10);
        const passwordHash = await bcrypt.hash(randomPassword, 10);

        user = await this.prisma.user.create({
          data: {
            fullName: name || 'User',
            email,
            avatar: avatarUrl,
            passwordHash,
            role: role as any,
            status: 'active',
            facebookId,
          },
        });
      } else if (!user.facebookId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { facebookId },
        });
      }

      if (user.status !== 'active') {
        throw new UnauthorizedException('Account is suspended');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const accessToken = this.generateToken(user.id, (user as any)?.role);
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
    } catch (err: any) {
      throw new BadRequestException(
        err.message || 'Facebook authentication failed',
      );
    }
  }

  async appleLogin(dto: AppleLoginDto) {
    const { identityToken, fullName, role = 'customer' } = dto;

    try {
      // Verify token with Apple (validates signature, exp, aud, iss)
      const appleIdTokenClaims = await appleSigninAuth.verifyIdToken(
        identityToken,
        {
          audience: this.configService.get<string>('APPLE_CLIENT_ID') || '',
          ignoreExpiration: false,
        },
      );

      const { email, sub: appleId } = appleIdTokenClaims;
      if (!email) {
        throw new BadRequestException(
          'Email not provided from Apple. Users may have hidden it.',
        );
      }

      let user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) {
        const randomPassword =
          Math.random().toString(36).slice(-10) +
          Math.random().toString(36).slice(-10);
        const passwordHash = await bcrypt.hash(randomPassword, 10);

        // Name is only sent by Apple on the VERY FIRST login
        const extractedName = fullName
          ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
          : 'User';

        user = await this.prisma.user.create({
          data: {
            fullName: extractedName || 'User',
            email,
            passwordHash,
            role: role as any,
            status: 'active',
            appleId,
          },
        });
      } else if (!user.appleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { appleId },
        });
      }

      if (user.status !== 'active') {
        throw new UnauthorizedException('Account is suspended');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const accessToken = this.generateToken(user.id, (user as any)?.role);
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
        message: 'Apple login successful',
        user: { ...userWithoutPassword, staffProfile },
        accessToken,
        refreshToken,
      };
    } catch (err: any) {
      throw new BadRequestException(
        err.message || 'Apple authentication failed',
      );
    }
  }
}
