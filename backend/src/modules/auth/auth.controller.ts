import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestLoginOtpDto } from './dto/request-login-otp.dto';
import { VerifyLoginOtpDto } from './dto/verify-login-otp.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  issueCsrfCookie,
  readCookie,
} from '../../common/security/csrf.util';

/**
 * Browsers must not receive JWTs in JSON (HttpOnly cookies only).
 * Internal scripts may send `x-metaforge-return-tokens: 1` to receive Bearer tokens.
 */
function publicAuthPayload<T extends { accessToken?: string; refreshToken?: string; user?: unknown }>(
  result: T,
  req?: { headers?: Record<string, string | string[] | undefined> },
) {
  const flag = String(req?.headers?.['x-metaforge-return-tokens'] || '').toLowerCase();
  if (flag === '1' || flag === 'true') {
    return result;
  }
  const { accessToken: _a, refreshToken: _r, ...rest } = result as any;
  return rest;
}

function setSessionCookies(res: Response, result: { accessToken: string; refreshToken?: string }) {
  res.cookie('access_token', result.accessToken, ACCESS_COOKIE);
  if (result.refreshToken) {
    res.cookie('refresh_token', result.refreshToken, REFRESH_COOKIE);
  }
  issueCsrfCookie(res);
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('request-login-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request login OTP' })
  async requestLoginOtp(@Body() dto: RequestLoginOtpDto) {
    return this.authService.requestLoginOtp(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verify-login-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify login OTP and start session' })
  @ApiHeader({
    name: 'x-metaforge-return-tokens',
    required: false,
    description: 'Set to 1 to include accessToken/refreshToken in the JSON body (for Swagger / scripts)',
  })
  async verifyLoginOtp(
    @Body() dto: VerifyLoginOtpDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.verifyLoginOtp(dto, { ip, userAgent });
    setSessionCookies(res, result);
    return publicAuthPayload(result, req);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Email/password login' })
  @ApiHeader({
    name: 'x-metaforge-return-tokens',
    required: false,
    description: 'Set to 1 to include accessToken/refreshToken in the JSON body (for Swagger / scripts)',
  })
  async login(
    @Body() dto: LoginDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.login(dto, { ip, userAgent });
    setSessionCookies(res, result);
    return publicAuthPayload(result, req);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() body: { refreshToken?: string } = {},
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    let currentUser = req.user;
    if (!currentUser) {
      const authHeader = req.headers?.authorization;
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      const token = bearerToken || readCookie(req, 'access_token') || body?.refreshToken;
      if (token) {
        currentUser = this.authService.decodeToken(token);
      }
    }
    const refreshToken = body?.refreshToken || readCookie(req, 'refresh_token') || undefined;
    const result = await this.authService.logout(refreshToken, currentUser);
    clearAuthCookies(res);
    return result;
  }

  @Post('register-request')
  @HttpCode(HttpStatus.CREATED)
  async registerRequest(@Body() dto: RegisterRequestDto) {
    return this.authService.registerRequest(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = dto?.refreshToken || readCookie(req, 'refresh_token');
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }
    const result = await this.authService.refresh({ refreshToken });
    if (result?.accessToken) {
      setSessionCookies(res, result);
    }
    return publicAuthPayload(result, req);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Current user profile' })
  async getProfile(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    // Ensure browser always has a readable CSRF cookie for double-submit POSTs.
    if (!readCookie(req, 'csrf_token')) {
      issueCsrfCookie(res);
    }
    return this.authService.getProfile(req.user);
  }

  /** Bootstrap / refresh CSRF cookie for cookie-authenticated browsers. */
  @Get('csrf')
  @HttpCode(HttpStatus.OK)
  async csrf(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const token = issueCsrfCookie(res);
    return { ok: true, csrfToken: token };
  }
}
