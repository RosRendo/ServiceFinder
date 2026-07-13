import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import { Twilio } from 'twilio';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import { VerifyResetDto } from './dto/verify-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { FacebookLoginDto } from './dto/facebook-login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

import { MfaService } from './mfa.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  private twilioClient: Twilio;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,
    private auditLogs: AuditLogsService,
    private mfaService: MfaService,
    private analytics: AnalyticsService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
    const twilioSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const twilioToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    if (twilioSid && twilioToken) {
      this.twilioClient = new Twilio(twilioSid, twilioToken);
    }
  }

  /** Generate a short-lived access token (15 min) */
  generateToken(userId: bigint): string {
    return this.jwtService.sign({ userId: userId.toString() });
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

    const accessToken = this.generateToken(stored.userId);
    const newRefreshToken = await this.generateRefreshToken(stored.userId);

    return { accessToken, refreshToken: newRefreshToken };
  }

  /** Invalidate a specific refresh token on logout */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
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

    const accessToken = this.generateToken(user.id);
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

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(dto: SendOtpDto) {
    const { phone } = dto;

    // Generate a real 6-digit code
    const code = this.generateCode();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Invalidate previous OTPs for this phone
    await this.prisma.otpCode.updateMany({
      where: { phone, used: false },
      data: { used: true },
    });

    await this.prisma.otpCode.create({
      data: {
        phone,
        code,
        expiresAt,
      },
    });

    // Send SMS via Twilio if configured
    if (this.twilioClient) {
      try {
        await this.twilioClient.messages.create({
          body: `Your ServiceFinder verification code is: ${code}`,
          from: this.configService.get<string>('TWILIO_PHONE_NUMBER'),
          to: phone,
        });
        return { message: 'OTP sent successfully via SMS' };
      } catch (error) {
        console.error('Failed to send Twilio SMS:', error);
        // Fallback for development if Twilio fails
        console.log(`[DEV MODE] OTP for ${phone} is: ${code}`);
        return {
          message: `Failed to send SMS, but code generated (check server logs)`,
        };
      }
    } else {
      // Fallback if no Twilio keys are provided
      console.log(
        `[DEV MODE] Twilio not configured. OTP for ${phone} is: ${code}`,
      );
      return {
        message: `OTP generated successfully (Dev Mode - Check server logs for code)`,
      };
    }
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { phone, code } = dto;

    const otp = await this.prisma.otpCode.findFirst({
      where: { phone, code, used: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || otp.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired OTP code');
    }

    // Mark as used
    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { used: true },
    });

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

    const accessToken = this.generateToken(user.id);
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
      message: 'Login successful',
      user: { ...userWithoutPassword, staffProfile },
      accessToken,
      refreshToken,
    };
  }

  async requestPasswordReset(dto: RequestResetDto) {
    const { email, phone } = dto;
    if (!email && !phone)
      throw new BadRequestException('Email or phone is required');

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
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
    } else if (phone && user.phone === phone) {
      // In production, integrate Twilio or another SMS gateway
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
        },
      });
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is suspended');
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
          },
        });
      }

      if (user.status !== 'active') {
        throw new UnauthorizedException('Account is suspended');
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
    } catch (err: any) {
      throw new BadRequestException(
        err.message || 'Facebook authentication failed',
      );
    }
  }
}
