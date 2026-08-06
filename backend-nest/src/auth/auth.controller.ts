import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
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
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

const IS_PROD = process.env.NODE_ENV === 'production';

import { CookieOptions } from 'express';

const COOKIE_OPTIONS_ACCESS: CookieOptions = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? 'none' : 'lax',
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
};

const COOKIE_OPTIONS_REFRESH: CookieOptions = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth',
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(
    res: express.Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie('token', accessToken, COOKIE_OPTIONS_ACCESS);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS_REFRESH);
  }

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({
    status: 400,
    description: 'Bad request or email already in use',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.register(registerDto);
    this.setAuthCookies(res, accessToken, refreshToken);
    return {
      message: 'User registered successfully',
      user,
      token: accessToken,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.login(loginDto);
    if (result.requiresMfa) {
      return result;
    }
    this.setAuthCookies(
      res,
      result.accessToken as string,
      result.refreshToken as string,
    );
    return {
      message: result.message,
      user: result.user,
      token: result.accessToken,
    };
  }

  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify MFA code during login' })
  async verifyMfa(
    @Body() body: { tempToken: string; code: string },
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { message, user, accessToken, refreshToken } =
      await this.authService.verifyMfaLogin(body.tempToken, body.code);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { message, user, token: accessToken };
  }

  @Post('mfa/generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a new MFA secret and QR code' })
  async generateMfa(@CurrentUser() user: any) {
    const id = user?.id || user?.userId || user?.sub;
    if (!id) {
      throw new UnauthorizedException('User ID is missing');
    }
    return this.authService.generateMfa(BigInt(id), user.email);
  }

  @Post('mfa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify and enable MFA for the user' })
  async enableMfa(
    @CurrentUser() user: any,
    @Body() body: { secret: string; code: string },
  ) {
    const id = user?.id || user?.userId || user?.sub;
    if (!id) {
      throw new UnauthorizedException('User ID is missing');
    }
    return this.authService.enableMfa(BigInt(id), body.secret, body.code);
  }

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Request OTP for login/register' })
  async requestOtp(@Body() body: { phone: string }) {
    return this.authService.requestOtp(body.phone);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify OTP and login/register' })
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { message, user, accessToken, refreshToken } =
      await this.authService.verifyOtpToken(verifyOtpDto.phone, verifyOtpDto.code);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { message, user, token: accessToken };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'New access token issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    // Accept refresh token from cookie OR body for flexibility
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshAccessToken(refreshToken);
    this.setAuthCookies(res, accessToken, newRefreshToken);
    return { 
      message: 'Token refreshed', 
      token: accessToken,
      accessToken: accessToken,
      refreshToken: newRefreshToken
    };
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Google OAuth login' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in via Google',
  })
  @ApiResponse({ status: 401, description: 'Invalid Google token' })
  async googleLogin(
    @Body() googleLoginDto: GoogleLoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { message, user, accessToken, refreshToken } =
      await this.authService.googleLogin(googleLoginDto);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { message, user, token: accessToken };
  }

  @Post('facebook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Facebook OAuth login' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in via Facebook',
  })
  @ApiResponse({ status: 401, description: 'Invalid Facebook token' })
  async facebookLogin(
    @Body() facebookLoginDto: FacebookLoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { message, user, accessToken, refreshToken } =
      await this.authService.facebookLogin(facebookLoginDto);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { message, user, token: accessToken };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.id);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  async logout(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }
    const clearOpts = {
      path: '/',
      sameSite: IS_PROD ? 'none' : 'lax',
      secure: IS_PROD,
    } as const;
    res.clearCookie('token', clearOpts);
    res.clearCookie('refreshToken', { ...clearOpts, path: '/api/auth' });
    return { success: true, message: 'Logged out successfully' };
  }

  @Post('request')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @ApiOperation({ summary: 'Request password reset code' })
  @ApiResponse({ status: 200, description: 'Password reset code sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  requestPasswordReset(@Body() dto: RequestResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify password reset code' })
  @ApiResponse({ status: 200, description: 'Code verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  verifyResetCode(@Body() dto: VerifyResetDto) {
    return this.authService.verifyResetCode(dto);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
