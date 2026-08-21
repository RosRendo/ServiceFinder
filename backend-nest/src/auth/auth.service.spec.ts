import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { MfaService } from './mfa.service';
import { AnalyticsService } from '../analytics/analytics.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({}),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    otpCode: {
      findFirst: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mock.jwt.token'),
  };

  const mockMailService = {
    sendPasswordResetEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'GOOGLE_CLIENT_ID') return 'mock-client-id';
      return null;
    }),
  };

  const mockAuditLogsService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuditLogsService, useValue: mockAuditLogsService },
        { provide: MfaService, useValue: {} },
        { provide: AnalyticsService, useValue: { captureEvent: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw ConflictException if email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: 'test@test.com',
      });

      await expect(
        service.register({
          email: 'test@test.com',
          password: 'Password1!',
          fullName: 'Test User',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully register a user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.user.create.mockResolvedValueOnce({
        id: 1n,
        email: 'new@test.com',
        fullName: 'New User',
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.register({
        email: 'new@test.com',
        password: 'Password1!',
        fullName: 'New User',
      });

      expect(result).toHaveProperty('accessToken', 'mock.jwt.token');
      expect(result.user.email).toBe('new@test.com');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.login({ email: 'none@test.com', password: 'pwd' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if wrong password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 1n,
        email: 'test@test.com',
        passwordHash: 'hash',
        status: 'active',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return token and user if login successful', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 1n,
        email: 'test@test.com',
        passwordHash: 'hash',
        status: 'active',
      });
      mockPrismaService.user.update.mockResolvedValueOnce({});
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'test@test.com',
        password: 'correct',
      });

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });
  });

  describe('requestOtp', () => {
    it('rejects an invalid phone number BEFORE any SMS is sent', async () => {
      await expect(service.requestOtp('garbage')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.requestOtp('123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.requestOtp('')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.otpCode.create).not.toHaveBeenCalled();
    });

    it('blocks a resend within the 60s cooldown window', async () => {
      mockPrismaService.otpCode.findFirst.mockResolvedValueOnce({
        createdAt: new Date(Date.now() - 10_000), // 10s ago
      });

      await expect(service.requestOtp('012345678')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.otpCode.create).not.toHaveBeenCalled();
    });

    it('blocks when the daily per-number cap is reached', async () => {
      mockPrismaService.otpCode.findFirst.mockResolvedValueOnce(null);
      mockPrismaService.otpCode.count.mockResolvedValueOnce(6);

      await expect(service.requestOtp('012345678')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.otpCode.create).not.toHaveBeenCalled();
    });

    it('normalizes the phone and writes a ledger row on success', async () => {
      mockPrismaService.otpCode.findFirst.mockResolvedValueOnce(null);
      mockPrismaService.otpCode.count.mockResolvedValueOnce(0);
      mockPrismaService.otpCode.create.mockResolvedValueOnce({});

      const result = await service.requestOtp('012 345 678');

      expect(result.success).toBe(true);
      expect(mockPrismaService.otpCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ phone: '+85512345678' }),
        }),
      );
    });
  });
});
