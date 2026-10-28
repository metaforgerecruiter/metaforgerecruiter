import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { hashPasswordArgon2id, verifyAndMigratePassword } from '../../common/security/password.util';
import { allowDemoCredentials, resolveDemoPassword } from '../../common/security/secrets.util';

import { User, UserDocument } from '../users/schemas/user.schema';
import { Organization, OrganizationDocument } from '../organizations/schemas/organization.schema';
import { RolePermission, RolePermissionDocument } from '../users/schemas/role-permission.schema';
import { MailService } from '../mail/mail.service';
import { RecruiterAttendanceService } from '../recruiter-attendance/recruiter-attendance.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestLoginOtpDto } from './dto/request-login-otp.dto';
import { VerifyLoginOtpDto } from './dto/verify-login-otp.dto';

interface OtpEntry {
  otpCode: string;
  expiresAt: Date;
}

interface ResetTokenEntry {
  email: string;
  expiresAt: Date;
}

/** Demo account metadata only — passwords come from env (SEED_DEMO_PASSWORD / DEMO_PASSWORD_*). */
const DEMO_ACCOUNT_META: Record<string, { role: string; name: string }> = {
  'r.haines@talentflow.io': { role: 'superadmin', name: 'Robert Haines' },
  'd.park@talentflow.io': { role: 'admin', name: 'David Park' },
  'harish.g@metaforgeit.com': { role: 'lead', name: 'Harish Gadipally' },
  'm.chen@talentflow.io': { role: 'recruiter', name: 'Marcus Chen' },
  'dev.team@talentflow.io': { role: 'devteam', name: 'Dev Team Engineer' },
  'client@accenture.com': { role: 'client', name: 'Client Account Lead' },
};

function getDemoCredentials(): Record<string, { password: string; role: string; name: string }> {
  if (!allowDemoCredentials()) return {};
  const out: Record<string, { password: string; role: string; name: string }> = {};
  for (const [email, meta] of Object.entries(DEMO_ACCOUNT_META)) {
    const password = resolveDemoPassword(meta.role) || resolveDemoPassword();
    if (!password) continue;
    out[email] = { ...meta, password };
  }
  return out;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private otpStore = new Map<string, OtpEntry>();
  private resetTokenStore = new Map<string, ResetTokenEntry>();
  private activeRefreshTokens = new Set<string>();

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Organization.name) private readonly orgModel: Model<OrganizationDocument>,
    @InjectModel(RolePermission.name) private readonly roleModel: Model<RolePermissionDocument>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly recruiterAttendanceService: RecruiterAttendanceService,
    private readonly auditService: AuditService,
  ) {}

  private async permissionsFor(role: string, orgId?: Types.ObjectId | string | null): Promise<string[]> {
    if (role === 'superadmin' || role === 'devteam') return ['*'];
    const filter: Record<string, any> = { roleCode: role };
    if (orgId) filter.orgId = new Types.ObjectId(orgId.toString());
    const doc = await this.roleModel.findOne(filter).exec();
    return doc?.permissions?.length ? doc.permissions : [];
  }

  private normalizeRole(role?: string): string {
    const r = (role || '').trim().toLowerCase();
    if (r === 'team lead' || r === 'team_lead' || r === 'lead') return 'lead';
    if (r === 'recruiter') return 'recruiter';
    if (r === 'admin') return 'admin';
    if (r === 'superadmin' || r === 'super_admin') return 'superadmin';
    if (r === 'devteam' || r === 'dev_team' || r === 'developer') return 'devteam';
    if (r === 'client') return 'client';
    return r;
  }

  private enforceMatchingRole(userRole: string, requestedRole?: string) {
    if (!requestedRole) return;
    const req = this.normalizeRole(requestedRole);
    const assigned = this.normalizeRole(userRole);
    if (req && req !== assigned) {
      throw new UnauthorizedException(
        `You are not authorized to log in as '${requestedRole}'. Assigned account role is '${userRole}'.`,
      );
    }
  }

  /**
   * Find default Organization ID for seeding / new registration
   */
  private async getDefaultOrgId(): Promise<Types.ObjectId> {
    const org = await this.orgModel.findOne().exec();
    if (org) return org._id as Types.ObjectId;
    return new Types.ObjectId('6ab4f38ff2e0e1823c038948');
  }

  /**
   * Authenticate user credentials against MongoDB users.
   * Demo bootstrap (env passwords only) is disabled in production.
   */
  async validateUser(email: string, pass: string): Promise<UserDocument> {
    const normalizedEmail = email.trim().toLowerCase();
    let user = await this.userModel.findOne({ email: normalizedEmail, deletedAt: null }).exec();
    const demoCredentials = getDemoCredentials();

    if (!user && demoCredentials[normalizedEmail]) {
      const demoInfo = demoCredentials[normalizedEmail];
      if (demoInfo.password === pass) {
        const orgId = await this.getDefaultOrgId();
        const passwordHash = await hashPasswordArgon2id(pass);
        user = new this.userModel({
          orgId,
          userId: `user-${Date.now()}`,
          name: demoInfo.name,
          email: normalizedEmail,
          passwordHash,
          role: demoInfo.role,
          active: true,
        });
        await user.save();
      }
    }

    if (user) {
      if (user.active === false) {
        throw new UnauthorizedException('User account has been deactivated or deleted');
      }

      const { isValid, needsRehash } = await verifyAndMigratePassword(pass, user.passwordHash);

      let isMatch = isValid;
      // Non-prod demo bootstrap only: allow env demo password to re-sync hash.
      if (!isMatch) {
        const demoInfo = demoCredentials[normalizedEmail];
        if (demoInfo && demoInfo.password === pass) {
          isMatch = true;
          user.passwordHash = await hashPasswordArgon2id(pass);
          await user.save();
        }
      } else if (needsRehash) {
        // Silent migration from bcrypt to Argon2id without forced password reset
        user.passwordHash = await hashPasswordArgon2id(pass);
        await user.save();
        this.logger.log(`[Security] Silently migrated password for ${user.email} from bcrypt to Argon2id`);
      }

      if (!isMatch) {
        throw new UnauthorizedException('Invalid email or password');
      }
      return user;
    }

    throw new UnauthorizedException('Invalid email or password');
  }

  /**
   * Login Endpoint — POST /auth/login
   */
  async login(dto: LoginDto, reqMeta?: { ip?: string; userAgent?: string }) {
    let user: UserDocument;
    try {
      user = await this.validateUser(dto.email, dto.password);
      this.enforceMatchingRole(user.role, dto.role);
    } catch (err) {
      // Never log password / tokens — email + IP only.
      await this.auditService
        .recordSecurityAlert({
          type: 'failed_login',
          action: 'Failed password login attempt',
          email: dto.email?.trim().toLowerCase(),
          ipAddress: reqMeta?.ip,
          userAgent: reqMeta?.userAgent,
          details: {
            reason: err instanceof UnauthorizedException ? 'invalid_credentials_or_role' : 'login_rejected',
            attemptedRole: dto.role || null,
          },
        })
        .catch(() => {});
      throw err;
    }

    // Update lastLoginAt timestamp
    user.lastLoginAt = new Date();
    await user.save();

    const sessionId = crypto.randomUUID();
    let loginHistorySessionId: string = sessionId;

    try {
      const loginRecord = await this.recruiterAttendanceService.recordLogin({
        userId: user.userId,
        userObjectId: user._id as Types.ObjectId,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId as any,
        ipAddress: reqMeta?.ip,
        userAgent: reqMeta?.userAgent,
        sessionId,
      });
      if (loginRecord?.sessionId) {
        loginHistorySessionId = loginRecord.sessionId;
      }
    } catch (attErr: any) {
      this.logger.error(`Failed to record login history for user ${user.userId}: ${attErr.message}`);
    }

    try {
      await this.auditService.recordUserLogin({
        userId: user.userId || user._id?.toString(),
        userObjectId: user._id as Types.ObjectId,
        userName: user.name,
        userEmail: user.email,
        role: user.role,
        orgId: user.orgId as any,
        ipAddress: reqMeta?.ip,
        userAgent: reqMeta?.userAgent,
      });
    } catch (auditErr: any) {
      this.logger.error(`Failed to record audit login for user ${user.userId}: ${auditErr.message}`);
    }

    const permissions = await this.permissionsFor(user.role, user.orgId as any);

    const payload = {
      sub: user._id.toString(),
      userId: user.userId,
      email: user.email,
      role: user.role,
      orgId: user.orgId ? user.orgId.toString() : null,
      name: user.name,
      permissions,
      sessionId: loginHistorySessionId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    this.activeRefreshTokens.add(refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.orgId,
        title: user.role,
        permissions,
        capabilities: user.capabilities || {},
        sessionId: loginHistorySessionId,
      },
    };
  }

  /**
   * Logout Endpoint — POST /auth/logout
   */
  async logout(refreshToken?: string, currentUser?: any) {
    if (refreshToken) {
      this.activeRefreshTokens.delete(refreshToken);
    }
    if (currentUser) {
      try {
        await this.recruiterAttendanceService.recordLogout({
          userObjectId: currentUser._id || currentUser.id || currentUser.sub,
          userId: currentUser.userId,
          sessionId: currentUser.sessionId,
        });
      } catch (attErr: any) {
        this.logger.error(`Failed to record logout for user: ${attErr.message}`);
      }

      try {
        await this.auditService.recordUserLogout({
          userObjectId: currentUser._id || currentUser.id || currentUser.sub,
          userId: currentUser.userId,
        });
      } catch (auditErr: any) {
        this.logger.error(`Failed to record audit logout for user: ${auditErr.message}`);
      }
    }
    return { message: 'Logged out successfully' };
  }

  decodeToken(token: string): any {
    try {
      return this.jwtService.decode(token);
    } catch {
      return null;
    }
  }

  /**
   * Register Request Endpoint — POST /auth/register-request
   */
  async registerRequest(dto: RegisterRequestDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.userModel.findOne({ email: normalizedEmail, deletedAt: null }).exec();

    if (existing) {
      throw new ConflictException('Email address is already registered');
    }

    const orgId = await this.getDefaultOrgId();
    const rawPass = dto.password || crypto.randomBytes(16).toString('hex');
    const passwordHash = await hashPasswordArgon2id(rawPass);

    const newUser = new this.userModel({
      orgId,
      userId: `user-${Date.now()}`,
      name: dto.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: dto.role || 'recruiter',
      phone: dto.phone ? dto.phone.trim() : null,
      active: true,
    });

    const saved = await newUser.save();

    return {
      message: 'Registration request submitted successfully',
      user: {
        id: saved._id.toString(),
        userId: saved.userId,
        email: saved.email,
        name: saved.name,
        role: saved.role,
      },
    };
  }

  /**
   * Forgot Password Endpoint — POST /auth/forgot-password
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.userModel.findOne({ email: normalizedEmail, deletedAt: null }).exec();
    const isDemo = Boolean(getDemoCredentials()[normalizedEmail]);

    if (!user && !isDemo) {
      return { message: 'If an account exists for this email, a recovery code has been issued.' };
    }

    // Generate 6-digit OTP code
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    this.otpStore.set(normalizedEmail, { otpCode, expiresAt });

    const payload: { message: string; otpCode?: string } = {
      message: 'If an account exists for this email, a recovery code has been issued.',
    };
    if (process.env.NODE_ENV !== 'production') {
      payload.otpCode = otpCode;
    }
    return payload;
  }

  /**
   * Verify OTP Endpoint — POST /auth/verify-otp
   */
  async verifyOtp(dto: VerifyOtpDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const entry = this.otpStore.get(normalizedEmail);

    if (!entry) {
      throw new BadRequestException('No password reset request found for this email');
    }

    if (new Date() > entry.expiresAt) {
      this.otpStore.delete(normalizedEmail);
      throw new BadRequestException('OTP code has expired. Request a new one.');
    }

    if (entry.otpCode !== dto.otpCode.trim()) {
      throw new BadRequestException('Invalid OTP code');
    }

    // Clear used OTP
    this.otpStore.delete(normalizedEmail);

    // Issue temporary reset token
    const resetToken = `rst-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    this.resetTokenStore.set(resetToken, { email: normalizedEmail, expiresAt });

    return { resetToken };
  }

  /**
   * Reset Password Endpoint — POST /auth/reset-password
   */
  async resetPassword(dto: ResetPasswordDto) {
    const entry = this.resetTokenStore.get(dto.token);

    if (!entry) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (new Date() > entry.expiresAt) {
      this.resetTokenStore.delete(dto.token);
      throw new BadRequestException('Reset token has expired');
    }

    const email = entry.email;
    let user = await this.userModel.findOne({ email, deletedAt: null }).exec();

    const newHash = await hashPasswordArgon2id(dto.newPassword);

    if (user) {
      user.passwordHash = newHash;
      await user.save();
    } else if (getDemoCredentials()[email]) {
      const demoInfo = getDemoCredentials()[email];
      const orgId = await this.getDefaultOrgId();
      user = new this.userModel({
        orgId,
        userId: `user-${Date.now()}`,
        name: demoInfo.name,
        email,
        passwordHash: newHash,
        role: demoInfo.role,
        active: true,
      });
      await user.save();
    } else {
      throw new NotFoundException('User account not found');
    }

    this.resetTokenStore.delete(dto.token);

    return { message: 'Password reset successfully' };
  }

  /**
   * Refresh Token Endpoint — POST /auth/refresh
   */
  async refresh(dto: RefreshTokenDto) {
    if (!this.activeRefreshTokens.has(dto.refreshToken)) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    try {
      const payload = this.jwtService.verify(dto.refreshToken);
      const user = await this.userModel.findById(payload.sub).exec();

      if (!user) {
        throw new UnauthorizedException('User account no longer exists');
      }

      this.activeRefreshTokens.delete(dto.refreshToken);

      const newPayload = {
        sub: user._id.toString(),
        userId: user.userId,
        email: user.email,
        role: user.role,
        orgId: user.orgId ? user.orgId.toString() : null,
        name: user.name,
      };

      const accessToken = this.jwtService.sign(newPayload);
      const refreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });
      this.activeRefreshTokens.add(refreshToken);

      return { accessToken, refreshToken };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Get Profile Endpoint — GET /auth/me
   */
  async getProfile(currentUser: any) {
    if (currentUser) {
      this.recruiterAttendanceService
        .recordHeartbeat({
          userObjectId: currentUser._id || currentUser.id || currentUser.sub,
          sessionId: currentUser.sessionId,
        })
        .catch(() => {});
      this.auditService
        .recordUserHeartbeat({
          userObjectId: currentUser._id || currentUser.id || currentUser.sub,
          userId: currentUser.userId,
        })
        .catch(() => {});
    }
    const user = await this.userModel.findById(currentUser.id || currentUser.userId).exec();
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    const permissions = await this.permissionsFor(user.role, user.orgId as any);
    return {
      id: user._id.toString(),
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId,
      title: user.role,
      permissions,
      capabilities: user.capabilities || {},
      lastLoginAt: user.lastLoginAt,
      sessionId: currentUser.sessionId,
    };
  }

  /**
   * Request Login OTP Endpoint — POST /auth/request-login-otp
   */
  async requestLoginOtp(dto: RequestLoginOtpDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    let user = await this.userModel.findOne({ email: normalizedEmail, deletedAt: null }).exec();

    const demoForOtp = getDemoCredentials()[normalizedEmail];
    if (!user && demoForOtp) {
      const orgId = await this.getDefaultOrgId();
      const passwordHash = await hashPasswordArgon2id(demoForOtp.password);
      user = new this.userModel({
        orgId,
        userId: `user-${Date.now()}`,
        name: demoForOtp.name,
        email: normalizedEmail,
        passwordHash,
        role: demoForOtp.role,
        active: true,
      });
      await user.save();
    }

    if (!user || user.active === false) {
      // Do not reveal whether account exists or is active
      return { message: 'If an account exists for this email, a login OTP has been sent.' };
    }

    // Role check BEFORE sending OTP (Requirement 3)
    this.enforceMatchingRole(user.role, dto.role);

    const now = new Date();

    // Check 60-second OTP resend cooldown
    if (user.loginOtpLastSentAt) {
      const elapsedMs = now.getTime() - new Date(user.loginOtpLastSentAt).getTime();
      if (elapsedMs < 60 * 1000) {
        const remainingSeconds = Math.ceil((60 * 1000 - elapsedMs) / 1000);
        throw new BadRequestException(
          `Resend cooldown active. Please wait ${remainingSeconds} second(s) before requesting another OTP.`,
        );
      }
    }

    const otpCode = String(crypto.randomInt(1000, 10000));

    // Hash OTP using Argon2id
    const hash = await hashPasswordArgon2id(otpCode);

    // Store OTP hash, expiry (5 minutes), attempts (0), and last-sent timestamp
    user.loginOtpHash = hash;
    user.loginOtpExpires = new Date(now.getTime() + 5 * 60 * 1000);
    user.loginOtpAttempts = 0;
    user.loginOtpLastSentAt = now;
    await user.save();

    // Send OTP through active mail service provider (Nodemailer / Graph)
    try {
      await this.mailService.sendMail({
        to: [normalizedEmail],
        subject: 'Your Login Verification Code - MetaForge Recruiter Portal',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #0f172a; margin: 0; font-size: 20px;">MetaForge Recruiter Command Centre</h2>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Single-Use Login Verification Code</p>
            </div>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">Hello,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">Use the following 4-digit verification code to complete your login. This code is valid for <strong>5 minutes</strong>.</p>
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
              <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #2563eb;">${otpCode}</span>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">If you did not request this code, no action is needed. Your account remains secure.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">&copy; MetaForge IT. Automated notification service.</p>
          </div>
        `,
      });
    } catch {
      user.loginOtpHash = null;
      user.loginOtpExpires = null;
      user.loginOtpAttempts = 0;
      user.loginOtpLastSentAt = null;
      await user.save();
      Logger.error(`Login code email was not accepted for ${normalizedEmail}`, 'AuthService');
      throw new ServiceUnavailableException('Failed to deliver the login code. Try again in a moment.');
    }

    // Never return the OTP or OTP hash in API response
    return { message: 'If an account exists for this email, a login OTP has been sent.' };
  }

  /**
   * Verify Login OTP Endpoint — POST /auth/verify-login-otp
   */
  async verifyLoginOtp(dto: VerifyLoginOtpDto, reqMeta?: { ip?: string; userAgent?: string }) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const code = (dto.code || '').trim();

    if (!/^\d{4}$/.test(code)) {
      throw new BadRequestException('OTP code must be exactly 4 digits');
    }

    let user = await this.userModel.findOne({ email: normalizedEmail, deletedAt: null }).exec();

    const demoForVerify = getDemoCredentials()[normalizedEmail];
    if (!user && demoForVerify) {
      const orgId = await this.getDefaultOrgId();
      const passwordHash = await hashPasswordArgon2id(demoForVerify.password);
      user = new this.userModel({
        orgId,
        userId: `user-${Date.now()}`,
        name: demoForVerify.name,
        email: normalizedEmail,
        passwordHash,
        role: demoForVerify.role,
        active: true,
      });
      await user.save();
    }

    if (!user) {
      throw new UnauthorizedException('Invalid email or OTP code');
    }

    if (user.active === false) {
      throw new UnauthorizedException('User account has been deactivated or deleted');
    }

    // Role check during OTP verification (Requirement 3)
    this.enforceMatchingRole(user.role, dto.role);

    if (!user.loginOtpHash || !user.loginOtpExpires) {
      throw new BadRequestException('No active OTP found. Please request a new OTP.');
    }

    // Check attempts before checking expiry
    if (user.loginOtpAttempts >= 5) {
      user.loginOtpHash = null;
      user.loginOtpExpires = null;
      await user.save();
      throw new BadRequestException('Maximum OTP verification attempts exceeded. Please request a new OTP.');
    }

    // Check expiration (5 minutes)
    if (new Date() > new Date(user.loginOtpExpires)) {
      user.loginOtpHash = null;
      user.loginOtpExpires = null;
      await user.save();
      throw new BadRequestException('OTP code has expired. Please request a new OTP.');
    }

    // Compare code with stored Argon2id/bcrypt hash
    const { isValid: isMatch } = await verifyAndMigratePassword(code, user.loginOtpHash);

    if (!isMatch) {
      user.loginOtpAttempts = (user.loginOtpAttempts || 0) + 1;
      await user.save();

      await this.auditService
        .recordSecurityAlert({
          type: 'failed_login',
          action: 'Failed OTP login verification',
          email: normalizedEmail,
          orgId: user.orgId,
          ipAddress: reqMeta?.ip,
          userAgent: reqMeta?.userAgent,
          details: {
            reason: 'invalid_otp',
            attempts: user.loginOtpAttempts,
            // Never include OTP code or hash
          },
        })
        .catch(() => {});

      if (user.loginOtpAttempts >= 5) {
        user.loginOtpHash = null;
        user.loginOtpExpires = null;
        await user.save();
        throw new BadRequestException('Maximum OTP verification attempts exceeded. Please request a new OTP.');
      }

      const remaining = 5 - user.loginOtpAttempts;
      throw new UnauthorizedException(`Invalid OTP code. ${remaining} attempt(s) remaining.`);
    }

    // On successful verification:
    // 1. Invalidate/remove OTP
    user.loginOtpHash = null;
    user.loginOtpExpires = null;
    user.loginOtpAttempts = 0;
    user.loginOtpLastSentAt = null;

    // 2. Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save();

    const sessionId = crypto.randomUUID();
    let loginHistorySessionId: string = sessionId;

    try {
      const loginRecord = await this.recruiterAttendanceService.recordLogin({
        userId: user.userId,
        userObjectId: user._id as Types.ObjectId,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId as any,
        ipAddress: reqMeta?.ip,
        userAgent: reqMeta?.userAgent,
        sessionId,
      });
      if (loginRecord?.sessionId) {
        loginHistorySessionId = loginRecord.sessionId;
      }
    } catch (attErr: any) {
      this.logger.error(`Failed to record login history for user ${user.userId}: ${attErr.message}`);
    }

    try {
      await this.auditService.recordUserLogin({
        userId: user.userId || user._id?.toString(),
        userObjectId: user._id as Types.ObjectId,
        userName: user.name,
        userEmail: user.email,
        role: user.role,
        orgId: user.orgId as any,
        ipAddress: reqMeta?.ip,
        userAgent: reqMeta?.userAgent,
      });
    } catch (auditErr: any) {
      this.logger.error(`Failed to record audit login for user ${user.userId}: ${auditErr.message}`);
    }

    // 3. Issue existing V2 JWT
    const permissions = await this.permissionsFor(user.role, user.orgId as any);

    const payload = {
      sub: user._id.toString(),
      userId: user.userId,
      email: user.email,
      role: user.role,
      orgId: user.orgId ? user.orgId.toString() : null,
      name: user.name,
      permissions,
      sessionId: loginHistorySessionId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    this.activeRefreshTokens.add(refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.orgId,
        title: user.role,
        permissions,
        capabilities: user.capabilities || {},
        sessionId: loginHistorySessionId,
      },
    };
  }
}
