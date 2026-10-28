import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

import {
  RecruiterLoginHistory,
  RecruiterLoginHistoryDocument,
  SessionStatus,
} from './schemas/recruiter-login-history.schema';
import {
  DailyAttendanceReport,
  DailyAttendanceReportDocument,
} from './schemas/daily-attendance-report.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QueryLoginHistoryDto } from './dto/query-login-history.dto';
import { TriggerReportDto } from './dto/trigger-report.dto';

export interface RecruiterAttendanceItem {
  userId: string;
  userObjectId?: Types.ObjectId | string;
  name: string;
  email: string;
  role: string;
  status: 'LOGGED_IN' | 'MISSING';
  loginTime: Date | null;
  loginTimeFormattedIST: string | null;
  lastActiveFormattedIST?: string | null;
  sessionStatus?: string | null;
}

export interface TodayAttendanceResult {
  date: string;
  displayDateIST: string;
  isWorkingDay: boolean;
  isHoliday: boolean;
  holidayReason?: string;
  totalRecruiters: number;
  loggedInCount: number;
  missingCount: number;
  allClear: boolean;
  recruiters: RecruiterAttendanceItem[];
}

export interface PaginatedLoginHistoryResult {
  success: boolean;
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class RecruiterAttendanceService implements OnModuleInit {
  private readonly logger = new Logger(RecruiterAttendanceService.name);
  private isDispatchingReport = false;
  private readonly EXCLUDED_ROLES = ['superadmin', 'super_admin', 'admin', 'devteam', 'client'];
  private readonly DEFAULT_TRACKED_ROLES = ['recruiter', 'lead'];

  constructor(
    @InjectModel(RecruiterLoginHistory.name)
    private readonly loginHistoryModel: Model<RecruiterLoginHistoryDocument>,
    @InjectModel(DailyAttendanceReport.name)
    private readonly reportModel: Model<DailyAttendanceReportDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    try {
      await Promise.all([
        this.loginHistoryModel.createIndexes(),
        this.reportModel.createIndexes(),
      ]);
      this.logger.log('Recruiter attendance MongoDB indexes ensured.');
    } catch (err: any) {
      this.logger.warn(`Could not ensure recruiter attendance indexes: ${err.message}`);
    }
  }

  /**
   * Helper: Formats a Date as YYYY-MM-DD in Asia/Kolkata timezone
   */
  getISTDateString(date: Date = new Date()): string {
    const tz = process.env.ATTENDANCE_TIMEZONE || 'Asia/Kolkata';
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  /**
   * Helper: Formats a Date as hh:mm:ss A IST
   */
  formatTimeIST(date?: Date | null): string | null {
    if (!date) return null;
    const tz = process.env.ATTENDANCE_TIMEZONE || 'Asia/Kolkata';
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date(date));
  }

  /**
   * Helper: Formats a Date nicely (e.g. "Thursday, 22 October 2026")
   */
  formatDisplayDateIST(date: Date = new Date()): string {
    const tz = process.env.ATTENDANCE_TIMEZONE || 'Asia/Kolkata';
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  /**
   * Helper: Returns whether the given date is a weekday (Monday-Friday) in IST
   */
  isWorkingDayIST(date: Date = new Date()): boolean {
    const tz = process.env.ATTENDANCE_TIMEZONE || 'Asia/Kolkata';
    const weekdayStr = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
    }).format(date);
    return weekdayStr !== 'Sat' && weekdayStr !== 'Sun';
  }

  /**
   * Helper: Returns list of configured excluded dates (e.g. public holidays)
   */
  getExcludedDates(): string[] {
    const raw = process.env.ATTENDANCE_EXCLUDED_DATES || '';
    return raw
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
  }

  /**
   * Helper: Tracked roles (monitors recruiters and team leads; excludes super admin, admin, dev team, client)
   */
  getTrackedRoles(): string[] {
    const raw = process.env.ATTENDANCE_TRACKED_ROLES || 'recruiter,lead';
    const parsed = raw
      .split(',')
      .map((r) => r.trim().toLowerCase())
      .filter(Boolean);

    // If 'all' or '*' was specified, or empty, default to recruiters and team leads
    const candidates =
      parsed.includes('all') || parsed.includes('*') || parsed.length === 0
        ? this.DEFAULT_TRACKED_ROLES
        : parsed;

    // Enforce exclusion of super admin, admin, dev team, and client
    return candidates.filter((r) => !this.EXCLUDED_ROLES.includes(r));
  }

  /**
   * Helper: Format user roles for clean presentation
   */
  formatRole(role?: string): string {
    switch ((role || '').toLowerCase().trim()) {
      case 'recruiter':
        return 'Recruiter';
      case 'lead':
        return 'Team Lead';
      case 'admin':
        return 'Admin';
      case 'superadmin':
      case 'super_admin':
        return 'Super Admin';
      case 'devteam':
        return 'Dev Team';
      case 'client':
        return 'Client';
      default:
        return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
    }
  }

  /**
   * 1. Record a successful login event
   */
  async recordLogin(params: {
    userId: string;
    userObjectId: Types.ObjectId | string;
    name: string;
    email: string;
    role: string;
    orgId?: Types.ObjectId | string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    sessionId?: string;
  }): Promise<RecruiterLoginHistoryDocument> {
    const now = new Date();
    const loginDate = this.getISTDateString(now);
    const userObjId = new Types.ObjectId(params.userObjectId.toString());
    const orgObjId = params.orgId ? new Types.ObjectId(params.orgId.toString()) : null;

    // Check for any unclosed active sessions for this user.
    // If the browser was closed or session lapsed without logout, close previous as EXPIRED (not LOGGED_OUT)
    const timeoutMins = parseInt(process.env.ATTENDANCE_SESSION_TIMEOUT_MINUTES || '480', 10);
    const existingActiveSessions = await this.loginHistoryModel
      .find({
        userObjectId: userObjId,
        sessionStatus: SessionStatus.ACTIVE,
      })
      .exec();

    for (const prev of existingActiveSessions) {
      prev.sessionStatus = SessionStatus.EXPIRED;
      prev.logoutType = 'NEW_LOGIN_REPLACED';
      const lastActive = prev.lastActiveAt || prev.loginTime || now;
      prev.durationMinutes = Math.max(0, Math.round((lastActive.getTime() - prev.loginTime.getTime()) / 60000));
      // logoutTime remains null because user didn't perform a confirmed logout
      await prev.save();
    }

    const sessionId = params.sessionId || crypto.randomUUID();

    const history = new this.loginHistoryModel({
      orgId: orgObjId,
      userId: params.userId,
      userObjectId: userObjId,
      name: params.name,
      email: (params.email || '').toLowerCase().trim(),
      role: params.role || 'recruiter',
      sessionId,
      loginTime: now,
      lastActiveAt: now,
      logoutTime: null,
      sessionStatus: SessionStatus.ACTIVE,
      durationMinutes: 0,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      loginDate,
    });

    const saved = await history.save();
    this.logger.log(`Recorded successful login for ${params.name} (${params.email}, ${params.role}) - Session: ${sessionId}`);
    return saved;
  }

  /**
   * 2. Record a confirmed user logout event
   */
  async recordLogout(params: {
    userObjectId?: Types.ObjectId | string;
    userId?: string;
    sessionId?: string;
  }): Promise<{ loggedOut: boolean; sessionId?: string; durationMinutes?: number }> {
    const now = new Date();
    const query: Record<string, any> = { sessionStatus: SessionStatus.ACTIVE };

    if (params.sessionId) {
      query.sessionId = params.sessionId;
    } else if (params.userObjectId) {
      query.userObjectId = new Types.ObjectId(params.userObjectId.toString());
    } else if (params.userId) {
      query.userId = params.userId;
    } else {
      return { loggedOut: false };
    }

    const session = await this.loginHistoryModel.findOne(query).sort({ loginTime: -1 }).exec();
    if (!session) {
      return { loggedOut: false };
    }

    session.logoutTime = now;
    session.sessionStatus = SessionStatus.LOGGED_OUT;
    session.logoutType = 'USER_ACTION';
    session.lastActiveAt = now;
    session.durationMinutes = Math.max(1, Math.round((now.getTime() - session.loginTime.getTime()) / 60000));
    await session.save();

    this.logger.log(`Recorded confirmed logout for ${session.name} (${session.email}) - Duration: ${session.durationMinutes}m`);
    return {
      loggedOut: true,
      sessionId: session.sessionId,
      durationMinutes: session.durationMinutes,
    };
  }

  /**
   * 3. Heartbeat activity ping from frontend / active user requests
   */
  async recordHeartbeat(params: {
    userObjectId?: Types.ObjectId | string;
    sessionId?: string;
  }): Promise<{ active: boolean }> {
    const now = new Date();
    const query: Record<string, any> = { sessionStatus: SessionStatus.ACTIVE };

    if (params.sessionId) {
      query.sessionId = params.sessionId;
    } else if (params.userObjectId) {
      query.userObjectId = new Types.ObjectId(params.userObjectId.toString());
    } else {
      return { active: false };
    }

    const session = await this.loginHistoryModel.findOne(query).sort({ loginTime: -1 }).exec();
    if (!session) {
      return { active: false };
    }

    session.lastActiveAt = now;
    session.durationMinutes = Math.max(0, Math.round((now.getTime() - session.loginTime.getTime()) / 60000));
    await session.save();
    return { active: true };
  }

  /**
   * 4. Maintenance: Expire inactive sessions (handles unexpected browser closures and timeouts accurately)
   */
  async expireInactiveSessions(thresholdMinutes?: number): Promise<number> {
    const mins = thresholdMinutes || parseInt(process.env.ATTENDANCE_SESSION_TIMEOUT_MINUTES || '480', 10);
    const cutoffDate = new Date(Date.now() - mins * 60 * 1000);

    const staleSessions = await this.loginHistoryModel
      .find({
        sessionStatus: SessionStatus.ACTIVE,
        $or: [
          { lastActiveAt: { $lt: cutoffDate } },
          { lastActiveAt: null, loginTime: { $lt: cutoffDate } },
        ],
      })
      .exec();

    let count = 0;
    for (const session of staleSessions) {
      session.sessionStatus = SessionStatus.EXPIRED;
      session.logoutType = 'SESSION_TIMEOUT';
      const lastActive = session.lastActiveAt || session.loginTime;
      session.durationMinutes = Math.max(0, Math.round((lastActive.getTime() - session.loginTime.getTime()) / 60000));
      // logoutTime deliberately remains null to prevent falsely recording confirmed logouts
      await session.save();
      count++;
    }

    if (count > 0) {
      this.logger.log(`Maintenance: Transitioned ${count} stale/abandoned session(s) to EXPIRED status.`);
    }
    return count;
  }

  /**
   * 5. Retrieve paginated login history with date and criteria filters
   */
  async getLoginHistory(dto: QueryLoginHistoryDto): Promise<PaginatedLoginHistoryResult> {
    const page = Math.max(1, dto.page || 1);
    const limit = Math.min(200, Math.max(1, dto.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { deletedAt: null };

    if (dto.sessionStatus) {
      filter.sessionStatus = dto.sessionStatus;
    }

    if (dto.role) {
      filter.role = dto.role.trim().toLowerCase();
    }

    if (dto.userId) {
      filter.userId = dto.userId.trim();
    }

    if (dto.startDate || dto.endDate) {
      filter.loginTime = {};
      if (dto.startDate) {
        const start = new Date(dto.startDate);
        if (!isNaN(start.getTime())) {
          // If YYYY-MM-DD was passed, set to beginning of day
          if (dto.startDate.length === 10) start.setHours(0, 0, 0, 0);
          filter.loginTime.$gte = start;
        }
      }
      if (dto.endDate) {
        const end = new Date(dto.endDate);
        if (!isNaN(end.getTime())) {
          // If YYYY-MM-DD was passed, set to end of day
          if (dto.endDate.length === 10) end.setHours(23, 59, 59, 999);
          filter.loginTime.$lte = end;
        }
      }
    }

    if (dto.search) {
      const regex = new RegExp(dto.search.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { userId: regex }];
    }

    const [total, items] = await Promise.all([
      this.loginHistoryModel.countDocuments(filter).exec(),
      this.loginHistoryModel
        .find(filter)
        .sort({ loginTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
    ]);

    const formatted = items.map((item) => ({
      ...item,
      loginTimeFormattedIST: this.formatTimeIST(item.loginTime),
      logoutTimeFormattedIST: this.formatTimeIST(item.logoutTime),
      lastActiveFormattedIST: this.formatTimeIST(item.lastActiveAt),
    }));

    return {
      success: true,
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 6. Evaluate recruiter & team lead attendance for a given working day in Asia/Kolkata
   * Analyzes login times up to the specified cutoff (default: 12:00 PM IST).
   * Excludes superadmin, admin, devteam, and client roles.
   */
  async getTodayAttendance(targetDateStr?: string, cutoffTimeStr?: string): Promise<TodayAttendanceResult> {
    const now = new Date();
    const dateStr = targetDateStr || this.getISTDateString(now);
    const trackedRoles = this.getTrackedRoles();
    const isWorkingDay = this.isWorkingDayIST(targetDateStr ? new Date(`${targetDateStr}T12:00:00+05:30`) : now);
    const excludedDates = this.getExcludedDates();
    const isHoliday = excludedDates.includes(dateStr);

    // 1. Fetch only active recruiters and team leads (excluding superadmin, admin, devteam, client)
    const userQuery: Record<string, any> = {
      active: true,
      deletedAt: null,
      role: { $in: trackedRoles },
    };

    const activeUsers = await this.userModel
      .find(userQuery)
      .sort({ name: 1 })
      .lean()
      .exec();

    // 2. Fetch login records for target date in IST for monitored roles
    const loginQuery: Record<string, any> = {
      loginDate: dateStr,
      role: { $in: trackedRoles },
    };

    const loginsForDate = await this.loginHistoryModel
      .find(loginQuery)
      .sort({ loginTime: 1 })
      .lean()
      .exec();

    // Cutoff time in IST (default: 12:00 PM IST)
    const cutoffTime = cutoffTimeStr || process.env.ATTENDANCE_REPORT_TIME || '12:00';
    const cutoffDateTime = new Date(`${dateStr}T${cutoffTime}:00+05:30`);

    // Map earliest login by userObjectId string, userId, and email
    const loginMap = new Map<string, any>();
    for (const login of loginsForDate as any[]) {
      const uObjKey = login.userObjectId?.toString();
      const uIdKey = login.userId;
      const emailKey = login.email?.toLowerCase();
      if (uObjKey && !loginMap.has(uObjKey)) loginMap.set(uObjKey, login);
      if (uIdKey && !loginMap.has(uIdKey)) loginMap.set(uIdKey, login);
      if (emailKey && !loginMap.has(emailKey)) loginMap.set(emailKey, login);
    }

    const items: RecruiterAttendanceItem[] = [];
    let loggedInCount = 0;

    for (const user of activeUsers) {
      const uObjKey = (user._id as any).toString();
      const uIdKey = user.userId;
      const emailKey = (user.email || '').toLowerCase().trim();

      const matchedLogin = loginMap.get(uObjKey) || loginMap.get(uIdKey) || (emailKey ? loginMap.get(emailKey) : null);

      // Check if user logged in by the 12:00 PM cutoff time
      const hasLoggedInBeforeCutoff =
        matchedLogin && matchedLogin.loginTime && new Date(matchedLogin.loginTime) <= cutoffDateTime;

      if (hasLoggedInBeforeCutoff) {
        loggedInCount++;
        items.push({
          userId: user.userId,
          userObjectId: user._id,
          name: user.name,
          email: user.email || '',
          role: user.role,
          status: 'LOGGED_IN',
          loginTime: matchedLogin.loginTime,
          loginTimeFormattedIST: this.formatTimeIST(matchedLogin.loginTime),
          lastActiveFormattedIST: this.formatTimeIST(matchedLogin.lastActiveAt),
          sessionStatus: matchedLogin.sessionStatus,
        });
      } else {
        items.push({
          userId: user.userId,
          userObjectId: user._id,
          name: user.name,
          email: user.email || '',
          role: user.role,
          status: 'MISSING',
          loginTime: null,
          loginTimeFormattedIST: null,
          sessionStatus: null,
        });
      }
    }

    // Sort: Missing first, then by name
    items.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'MISSING' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const totalRecruiters = items.length;
    const missingCount = totalRecruiters - loggedInCount;
    const allClear = totalRecruiters > 0 && missingCount === 0;

    return {
      date: dateStr,
      displayDateIST: this.formatDisplayDateIST(targetDateStr ? new Date(`${targetDateStr}T12:00:00+05:30`) : now),
      isWorkingDay,
      isHoliday,
      holidayReason: isHoliday ? 'Configured public holiday' : undefined,
      totalRecruiters,
      loggedInCount,
      missingCount,
      allClear,
      recruiters: items,
    };
  }

  /**
   * 7. Generate and send daily missing-login or all-clear HTML email report
   * Strictly enforces duplicate prevention for the same date.
   */
  async generateAndSendDailyReport(options?: TriggerReportDto): Promise<any> {
    if (this.isDispatchingReport && !options?.force) {
      this.logger.warn('A daily attendance report dispatch is already running. Skipping concurrent trigger.');
      return { skipped: true, reason: 'Already in progress' };
    }

    this.isDispatchingReport = true;
    try {
      const now = new Date();
      const targetDate = options?.targetDate || this.getISTDateString(now);

      // Check working day condition
      const isWorkingDay = this.isWorkingDayIST(options?.targetDate ? new Date(`${targetDate}T12:00:00+05:30`) : now);
      if (!isWorkingDay && !options?.force) {
        this.logger.log(`[AttendanceReport] Date ${targetDate} is a weekend (Saturday/Sunday). Notifications are disabled on weekends.`);
        return { skipped: true, reason: 'Weekend (Saturday/Sunday)' };
      }

      // Check holiday exclusion
      const excludedDates = this.getExcludedDates();
      if (excludedDates.includes(targetDate) && !options?.force) {
        this.logger.log(`[AttendanceReport] Date ${targetDate} is configured as an excluded public holiday. Skipping notification.`);
        return { skipped: true, reason: 'Configured public holiday' };
      }

      // Duplicate Prevention Check: Has a report already been sent for this date?
      const existingReport = await this.reportModel
        .findOne({
          reportDate: targetDate,
          status: 'SENT',
        })
        .exec();

      if (existingReport && !options?.force) {
        this.logger.log(
          `[AttendanceReport] Report for date ${targetDate} was ALREADY sent at ${existingReport.sentAt.toISOString()} to ${existingReport.recipient}. Duplicate prevention active: skipping.`,
        );
        return {
          skipped: true,
          reason: `Report already sent for date ${targetDate}`,
          existingReportId: existingReport._id,
          sentAt: existingReport.sentAt,
        };
      }

      // Evaluate attendance up to 12:00 PM cutoff
      const attendance = await this.getTodayAttendance(targetDate, '12:00');
      // Reload .env if updated at runtime
      try {
        dotenv.config({ override: true });
      } catch {}

      const recipient = options?.recipientEmail || process.env.ATTENDANCE_RECIPIENT_EMAIL || 'offshorejobs@example.com';
      const sender =
        process.env.ATTENDANCE_SENDER_EMAIL ||
        process.env.GRAPH_FROM_EMAIL ||
        process.env.MAIL_FROM_EMAIL ||
        'recruitment.application@metaforgeit.com';

      const missingRecruiters = attendance.recruiters.filter((r) => r.status === 'MISSING');

      // Requirement: Mail should be sent at 12:00 noon if ANY of the recruiters/leads has NOT logged in up to that time.
      // If all monitored users have logged in by 12:00 noon, skip dispatching the email (unless force is requested).
      if (missingRecruiters.length === 0 && !options?.force) {
        this.logger.log(
          `[AttendanceReport] All active recruiters and team leads (${attendance.totalRecruiters}) have logged in by 12:00 PM IST on ${attendance.displayDateIST}. No missing users; skipping email dispatch.`,
        );

        const snapshots = attendance.recruiters.map((r) => ({
          userId: r.userId,
          name: r.name,
          email: r.email,
          role: r.role,
          status: r.status,
          loginTime: r.loginTime,
          loginTimeFormattedIST: r.loginTimeFormattedIST,
        }));

        await this.reportModel.findOneAndUpdate(
          { reportDate: targetDate },
          {
            reportDate: targetDate,
            sentAt: new Date(),
            recipient,
            sender,
            subject: `Daily Attendance Check: All Team Members Logged In - ${attendance.displayDateIST}`,
            totalRecruiters: attendance.totalRecruiters,
            loggedInCount: attendance.loggedInCount,
            missingCount: 0,
            allClear: true,
            recruiterSnapshots: snapshots,
            status: 'SKIPPED_ALL_LOGGED_IN',
            errorMessage: null,
            notes: 'Skipped email dispatch: all recruiters and team leads logged in before 12:00 PM IST',
          },
          { upsert: true, new: true },
        );

        return {
          skipped: true,
          reason: 'All recruiters and team leads logged in before 12:00 PM IST',
          allClear: true,
          totalRecruiters: attendance.totalRecruiters,
          loggedInCount: attendance.loggedInCount,
          missingCount: 0,
        };
      }

      // Build clean, simple subject line maintained consistently
      const defaultSubject = attendance.allClear
        ? `Daily Attendance Check: All Team Members Logged In - ${attendance.displayDateIST}`
        : `Daily Attendance Alert: Team Members Not Logged In by 12:00 PM - ${attendance.displayDateIST}`;

      const customSubject = process.env.ATTENDANCE_REPORT_SUBJECT;
      const subject = customSubject
        ? customSubject.replace('{date}', attendance.displayDateIST)
        : defaultSubject;

      // Build HTML template (ONLY includes missing users; NO logged-in table; NO footer information)
      const html = this.buildReportHtml(attendance, sender, recipient);

      if (options?.dryRun) {
        this.logger.log(`[AttendanceReport] Dry run requested for date ${targetDate}. Report compiled but email was NOT sent.`);
        return {
          dryRun: true,
          subject,
          recipient,
          sender,
          attendanceSummary: {
            date: attendance.date,
            totalRecruiters: attendance.totalRecruiters,
            loggedInCount: attendance.loggedInCount,
            missingCount: attendance.missingCount,
            allClear: attendance.allClear,
          },
          html,
        };
      }

      // Check if recipient or sender is an example address
      const isExampleEmail = (email?: string) =>
        !email || /@(example\.(com|org|net)|test\.com)$/i.test(email) || email.toLowerCase().includes('example');

      if (isExampleEmail(recipient) || isExampleEmail(sender)) {
        this.logger.log(
          `[AttendanceReport] Simulated email dispatch (example email detected: recipient=${recipient}, sender=${sender}). External email was NOT sent to protect official inboxes.`,
        );
      } else {
        // Dispatch Email to Distribution List
        this.logger.log(`[AttendanceReport] Dispatching daily attendance report to Distribution List: ${recipient} from ${sender}...`);
        await this.mailService.sendMail({
          to: [recipient],
          from: sender,
          subject,
          html,
        });
      }

      // Dispatch in-app notification to Super Admin for each missing recruiter/lead: "<Name> (<Role>) has not logged in still"
      if (missingRecruiters.length > 0) {
        try {
          const superAdmins = await this.userModel
            .find({
              role: { $in: ['superadmin', 'super_admin'] },
              deletedAt: null,
              active: { $ne: false },
            })
            .exec();

          this.logger.log(
            `[InAppNotification] Dispatching missing login notifications to ${superAdmins.length} Super Admin(s)...`,
          );

          for (const superAdmin of superAdmins) {
            for (const missing of missingRecruiters) {
              const formattedRole = this.formatRole(missing.role);
              const entityId = (missing.userObjectId ? new Types.ObjectId(missing.userObjectId.toString()) : superAdmin._id) as Types.ObjectId;
              await this.notificationsService.createNotification({
                orgId: new Types.ObjectId((superAdmin.orgId || '6ab4f38ff2e0e1823c038948').toString()) as any,
                userId: new Types.ObjectId(superAdmin._id.toString()) as any,
                type: 'recruiter_missing_login' as any,
                title: `${missing.name} (${formattedRole}) has not logged in still`,
                message: `${missing.name} (${formattedRole}) has not logged in still by 12:00 PM IST`,
                entityId,
                entityType: 'user' as any,
              });
              this.logger.log(
                `[InAppNotification] Sent notification to Super Admin ${superAdmin.name} (${superAdmin.email}): "${missing.name} (${formattedRole}) has not logged in still"`,
              );
            }
          }
        } catch (notifErr: any) {
          this.logger.error(`Failed to dispatch in-app notifications to Super Admin: ${notifErr.message}`);
        }
      }

      // Save report log to DB for persistent audit & duplicate prevention
      const snapshots = attendance.recruiters.map((r) => ({
        userId: r.userId,
        name: r.name,
        email: r.email,
        role: r.role,
        status: r.status,
        loginTime: r.loginTime,
        loginTimeFormattedIST: r.loginTimeFormattedIST,
      }));

      const reportRecord = await this.reportModel.findOneAndUpdate(
        { reportDate: targetDate },
        {
          reportDate: targetDate,
          sentAt: new Date(),
          recipient,
          sender,
          subject,
          totalRecruiters: attendance.totalRecruiters,
          loggedInCount: attendance.loggedInCount,
          missingCount: attendance.missingCount,
          allClear: attendance.allClear,
          recruiterSnapshots: snapshots,
          status: 'SENT',
          errorMessage: null,
          notes: options?.force ? 'Manually triggered / forced report' : 'Scheduled 12:00 PM IST report',
        },
        { upsert: true, new: true },
      );

      this.logger.log(
        `[AttendanceReport] SUCCESS: Daily attendance email report sent to ${recipient} for ${targetDate}. Total: ${attendance.totalRecruiters}, Logged In: ${attendance.loggedInCount}, Missing: ${attendance.missingCount}.`,
      );

      return {
        success: true,
        reportDate: targetDate,
        recipient,
        sentAt: reportRecord.sentAt,
        totalRecruiters: attendance.totalRecruiters,
        loggedInCount: attendance.loggedInCount,
        missingCount: attendance.missingCount,
        allClear: attendance.allClear,
      };
    } catch (err: any) {
      this.logger.error(`[AttendanceReport] Failed to dispatch daily attendance report: ${err.message}`, err.stack);
      try {
        const targetDate = options?.targetDate || this.getISTDateString(new Date());
        await this.reportModel.findOneAndUpdate(
          { reportDate: targetDate },
          {
            reportDate: targetDate,
            sentAt: new Date(),
            recipient: options?.recipientEmail || process.env.ATTENDANCE_RECIPIENT_EMAIL || 'offshorejobs@example.com',
            sender:
              process.env.ATTENDANCE_SENDER_EMAIL ||
              process.env.GRAPH_FROM_EMAIL ||
              process.env.MAIL_FROM_EMAIL ||
              'recruitment.application@metaforgeit.com',
            subject: 'Failed Attendance Report',
            totalRecruiters: 0,
            loggedInCount: 0,
            missingCount: 0,
            allClear: false,
            status: 'FAILED',
            errorMessage: err.message,
          },
          { upsert: true },
        );
      } catch (dbErr) {
        // ignore
      }
      throw err;
    } finally {
      this.isDispatchingReport = false;
    }
  }

  /**
   * 8. Build a clean, simple, and professional HTML email template
   * Displays ONLY the list of recruiters and team leads who have not logged in by 12:00 PM IST.
   * Users who have already logged in before 12:00 PM are NOT included in the email.
   * The footer containing attendance check metadata, sender/recipient line, and confidential notice is completely removed.
   */
  buildReportHtml(data: TodayAttendanceResult, sender: string, recipient: string): string {
    const missingUsers = data.recruiters.filter((r) => r.status === 'MISSING');

    const emailTitle = data.allClear
      ? 'Daily Attendance Check: All Team Members Logged In'
      : 'List of Users Not Logged In by 12:00 PM IST';

    // Missing users table rows: #, Name, Role, Status
    const missingRowsHtml = missingUsers
      .map((r, idx) => {
        const rowBg = idx % 2 === 0 ? '#ffffff' : '#fffaf0';
        return `
          <tr style="background-color: ${rowBg}; border-bottom: 1px solid #fee2e2;">
            <td style="padding: 10px 14px; font-size: 13px; color: #dc2626; font-weight: 700; text-align: center;">${idx + 1}</td>
            <td style="padding: 10px 16px; font-size: 13px; font-weight: 700; color: #0f172a;">${r.name}</td>
            <td style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: #475569;">${this.formatRole(r.role)}</td>
            <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #dc2626;">Has not logged in</td>
          </tr>
        `;
      })
      .join('');

    let contentHtml = '';

    if (missingUsers.length > 0) {
      contentHtml += `
        <p style="font-size: 14px; color: #334155; margin: 0 0 16px 0; line-height: 1.6;">
          The following team members have <strong>not logged in</strong> to the application by <strong>12:00 PM IST</strong> on <strong>${data.displayDateIST}</strong>:
        </p>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #fca5a5; border-radius: 6px; overflow: hidden; margin-bottom: 16px;">
          <thead>
            <tr style="background-color: #fef2f2; border-bottom: 2px solid #f87171;">
              <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #991b1b; text-align: center; width: 40px;">#</th>
              <th style="padding: 10px 16px; font-size: 12px; font-weight: 700; color: #991b1b; text-align: left;">User Name</th>
              <th style="padding: 10px 16px; font-size: 12px; font-weight: 700; color: #991b1b; text-align: left; width: 140px;">Role</th>
              <th style="padding: 10px 16px; font-size: 12px; font-weight: 700; color: #991b1b; text-align: left;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${missingRowsHtml}
          </tbody>
        </table>
      `;
    } else {
      contentHtml += `
        <div style="padding: 16px 20px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; color: #166534; font-size: 14px; font-weight: 600; margin-bottom: 16px;">
          All clear! All active team members (${data.totalRecruiters}) have successfully logged in by 12:00 PM IST on ${data.displayDateIST}.
        </div>
      `;
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${emailTitle}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a;">
  <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.06); overflow: hidden;">
    
    <!-- Top Header -->
    <div style="background: #0f172a; padding: 22px 28px; color: #ffffff;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; font-weight: 700; margin-bottom: 6px;">
        MetaForge Recruiter Application • Attendance Check
      </div>
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.2px;">
        ${emailTitle}
      </h1>
      <div style="margin-top: 6px; font-size: 13px; color: #cbd5e1;">
        ${data.displayDateIST} &nbsp;•&nbsp; Cutoff: 12:00 PM IST
      </div>
    </div>

    <!-- Content: ONLY contains missing users table -->
    <div style="padding: 24px 28px;">
      ${contentHtml}
    </div>

  </div>
</body>
</html>
    `.trim();
  }
}
