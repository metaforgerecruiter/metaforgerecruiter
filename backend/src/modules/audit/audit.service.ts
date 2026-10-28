import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditRepository } from './repositories/audit.repository';
import { ActivityLog } from './schemas/activity-log.schema';
import {
  AuditSessionStatus,
  UserAuditLog,
  UserAuditLogDocument,
} from './schemas/user-audit-log.schema';
import { redactSecrets, safeLogMessage } from '../../common/security/log-redact.util';

export type SecurityAlertType =
  | 'failed_login'
  | 'privilege_change'
  | 'bulk_export'
  | 'bulk_import'
  | 'security_event';

export interface SecurityAlertInput {
  type: SecurityAlertType;
  action: string;
  /** Actor when known (omit for anonymous failed login). */
  currentUser?: any;
  orgId?: string | Types.ObjectId | null;
  email?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  targetEntity?: string;
  targetId?: string | null;
  details?: Record<string, any>;
}

export interface AuditLogQueryDto {
  userId?: string;
  action?: string;
  category?: string;
  targetEntity?: string;
  module?: string;
  entity?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number | string;
  limit?: number | string;
}

export interface UserAuditLogQueryDto {
  startDate?: string;
  endDate?: string;
  date?: string;
  role?: string;
  status?: string;
  search?: string;
  page?: number | string;
  limit?: number | string;
}

export interface PaginatedUserAuditLogResult {
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
export class AuditService implements OnModuleInit {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly auditRepository: AuditRepository,
    @InjectModel(UserAuditLog.name)
    private readonly userAuditLogModel: Model<UserAuditLogDocument>,
  ) {}

  async onModuleInit() {
    try {
      await this.userAuditLogModel.createIndexes();
      this.logger.log('User audit logs MongoDB indexes ensured.');
      await this.syncExistingUsersAudit().catch((e) => {
        this.logger.warn(`Could not sync existing user audit records: ${e.message}`);
      });
    } catch (err: any) {
      this.logger.warn(`Could not ensure user audit log indexes: ${err.message}`);
    }
  }

  private async syncExistingUsersAudit() {
    const db = this.userAuditLogModel.db;
    const now = new Date();
    const todayIST = this.getISTDateString(now);

    const loginHistories = await db
      .collection('recruiter_login_histories')
      .find({ loginDate: todayIST })
      .sort({ loginTime: 1 })
      .toArray();

    for (const h of loginHistories) {
      const status = h.sessionStatus === 'ACTIVE'
        ? AuditSessionStatus.ACTIVE
        : h.sessionStatus === 'EXPIRED'
        ? AuditSessionStatus.SESSION_EXPIRED
        : AuditSessionStatus.LOGGED_OUT;

      await this.userAuditLogModel.findOneAndUpdate(
        { date: todayIST, userId: h.userId },
        {
          $setOnInsert: {
            firstLoginTime: h.loginTime || now,
            latestLogoutTime: h.logoutTime || null,
          },
          $set: {
            orgId: h.orgId || null,
            userId: h.userId,
            userObjectId: h.userObjectId || null,
            userName: h.name,
            userEmail: (h.email || '').toLowerCase().trim(),
            role: (h.role || 'recruiter').toLowerCase().trim(),
            date: todayIST,
            status,
            lastActiveAt: h.lastActiveAt || h.loginTime || now,
            ipAddress: h.ipAddress || null,
            userAgent: h.userAgent || null,
          },
        },
        { upsert: true },
      );
    }
  }

  async findAll(currentUser: any, query: AuditLogQueryDto) {
    const orgId = currentUser?.orgId
      ? new Types.ObjectId(currentUser.orgId.toString())
      : new Types.ObjectId('6ab4f38ff2e0e1823c038948');

    const filter: Record<string, any> = { orgId };

    // 1. User filter
    if (query.userId && Types.ObjectId.isValid(query.userId)) {
      filter.userId = new Types.ObjectId(query.userId);
    }

    // 2. Action filter
    if (query.action) {
      filter.action = { $regex: new RegExp(query.action.trim(), 'i') };
    }

    // 3. Category / Entity / Module filter
    const cat = query.category || query.targetEntity || query.module || query.entity;
    if (cat) {
      filter.$or = [
        { category: { $regex: new RegExp(cat.trim(), 'i') } },
        { targetEntity: { $regex: new RegExp(cat.trim(), 'i') } },
      ];
    }

    // 4. Status filter
    if (query.status) {
      filter.status = query.status;
    }

    // 5. Date range filter
    const dateFilter: Record<string, any> = {};
    if (query.startDate) {
      const s = new Date(query.startDate);
      if (!isNaN(s.getTime())) dateFilter.$gte = s;
    }
    if (query.endDate) {
      const e = new Date(query.endDate);
      if (!isNaN(e.getTime())) dateFilter.$lte = e;
    }
    if (Object.keys(dateFilter).length > 0) {
      filter.createdAt = dateFilter;
    }

    // 6. General Search
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      const regex = new RegExp(term, 'i');
      const searchConditions = [
        { userName: regex },
        { userEmail: regex },
        { action: regex },
        { category: regex },
        { targetEntity: regex },
        { targetId: regex },
        { clientName: regex },
      ];

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    const page = Math.max(1, parseInt(String(query.page || 1), 10));
    const rawLimit = parseInt(String(query.limit || 20), 10);
    const limit = Math.min(100, Math.max(1, rawLimit));

    return this.auditRepository.findAll(filter, page, limit);
  }

  async findById(currentUser: any, id: string) {
    const orgId = currentUser?.orgId
      ? new Types.ObjectId(currentUser.orgId.toString())
      : new Types.ObjectId('6ab4f38ff2e0e1823c038948');

    const log = await this.auditRepository.findById(orgId, id);
    if (!log) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }
    return log;
  }

  async createLog(logData: Partial<ActivityLog>) {
    const safe = {
      ...logData,
      details: redactSecrets(
        typeof logData.details === 'object' && logData.details ? logData.details : {},
      ),
    };
    return this.auditRepository.createLog(safe);
  }

  /**
   * Persist + emit a security alert (failed logins, privilege changes, bulk exports).
   * Never stores passwords/tokens — details are redacted.
   */
  async recordSecurityAlert(input: SecurityAlertInput): Promise<void> {
    const safeDetails = redactSecrets({
      alertType: input.type,
      ...(input.details || {}),
      email: input.email || input.currentUser?.email || undefined,
      ipAddress: input.ipAddress || undefined,
      userAgent: input.userAgent ? String(input.userAgent).slice(0, 200) : undefined,
    });

    const orgRaw = input.orgId || input.currentUser?.orgId;
    const orgId =
      orgRaw && Types.ObjectId.isValid(String(orgRaw))
        ? new Types.ObjectId(String(orgRaw))
        : null;

    const userRaw = input.currentUser?.id || input.currentUser?._id || input.currentUser?.userId;
    const userId =
      userRaw && Types.ObjectId.isValid(String(userRaw))
        ? new Types.ObjectId(String(userRaw))
        : new Types.ObjectId();

    const userEmail = String(
      input.email || input.currentUser?.email || 'unknown',
    )
      .toLowerCase()
      .trim();

    this.logger.warn(
      safeLogMessage(`[SECURITY_ALERT] ${input.type}: ${input.action}`, {
        orgId: orgId?.toString(),
        userEmail,
        targetEntity: input.targetEntity,
        targetId: input.targetId,
        details: safeDetails,
      }),
    );

    try {
      // Prefer known org; for anonymous failed logins, resolve org from email when possible.
      let resolvedOrgId = orgId;
      if (!resolvedOrgId && userEmail && userEmail.includes('@')) {
        try {
          const match = await this.userAuditLogModel.db
            .collection('users')
            .findOne(
              { email: userEmail, deletedAt: null },
              { projection: { orgId: 1 } },
            );
          if (match?.orgId) {
            resolvedOrgId = new Types.ObjectId(String(match.orgId));
          }
        } catch {
          /* ignore lookup failures */
        }
      }
      if (resolvedOrgId) {
        await this.auditRepository.createLog({
          orgId: resolvedOrgId as any,
          userId: userId as any,
          userName: input.currentUser?.name || userEmail || 'Unknown',
          userEmail,
          userRole: input.currentUser?.role || 'anonymous',
          action: input.action,
          category: 'System & Access',
          targetEntity: input.targetEntity || input.type,
          targetId: input.targetId || null,
          clientName: null,
          ipAddress: input.ipAddress || '0.0.0.0',
          status: 'Security Alert',
          details: safeDetails,
          schemaVersion: 1,
        });
      }
    } catch (err: any) {
      this.logger.error(
        safeLogMessage(`Failed to persist security alert: ${err?.message || err}`),
      );
    }

    // Optional outbound alert (Slack/webhook) — payload is already redacted.
    const webhook = (process.env.SECURITY_ALERT_WEBHOOK_URL || '').trim();
    if (webhook) {
      try {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `[SECURITY_ALERT] ${input.type}: ${input.action}`,
            type: input.type,
            action: input.action,
            userEmail,
            orgId: orgId?.toString() || null,
            details: safeDetails,
            at: new Date().toISOString(),
          }),
        });
      } catch (err: any) {
        this.logger.warn(
          safeLogMessage(`Security alert webhook failed: ${err?.message || err}`),
        );
      }
    }
  }

  async createFromClient(currentUser: any, body: Record<string, any>) {
    const orgId = currentUser?.orgId
      ? new Types.ObjectId(currentUser.orgId.toString())
      : new Types.ObjectId('6ab4f38ff2e0e1823c038948');

    const userId = currentUser?.id && Types.ObjectId.isValid(currentUser.id)
      ? new Types.ObjectId(currentUser.id)
      : new Types.ObjectId();

    const allowed = [
      'Submissions',
      'Requirements',
      'User Management',
      'Client Management',
      'Interviews',
      'System & Access',
      'Candidate Sourcing',
    ];
    const category = allowed.includes(body.category) ? body.category : 'System & Access';
    const rawDetails =
      typeof body.details === 'object' && body.details ? body.details : { note: body.details || '' };

    return this.auditRepository.createLog({
      orgId: orgId as any,
      userId: userId as any,
      userName: body.userName || currentUser.name || 'Unknown',
      userEmail: body.userEmail || currentUser.email || '',
      userRole: body.userRole || currentUser.role || 'recruiter',
      action: body.action || 'Activity recorded',
      category,
      targetEntity: body.targetEntity || body.action || 'Workspace',
      targetId: body.targetId || body.id || null,
      clientName: body.clientName || null,
      ipAddress: body.ipAddress || '127.0.0.1',
      status: ['Success', 'Warning', 'Security Alert'].includes(body.status) ? body.status : 'Success',
      details: redactSecrets(rawDetails),
      schemaVersion: 1,
    });
  }

  /**
   * Formats Date to YYYY-MM-DD in Asia/Kolkata
   */
  getISTDateString(date: Date = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  /**
   * Formats Date to hh:mm:ss A in Asia/Kolkata
   */
  formatTimeIST(date?: Date | null): string | null {
    if (!date) return null;
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date(date));
  }

  /**
   * Records user login in daily audit logs:
   * - Preserves the first login time of each day.
   * - Changes status to 'Active' when user logs in again.
   */
  async recordUserLogin(params: {
    userId: string;
    userObjectId?: Types.ObjectId | string;
    userName: string;
    userEmail: string;
    role: string;
    orgId?: Types.ObjectId | string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const now = new Date();
    const todayIST = this.getISTDateString(now);
    const orgObjId = params.orgId && Types.ObjectId.isValid(params.orgId.toString())
      ? new Types.ObjectId(params.orgId.toString())
      : null;
    const userObjId = params.userObjectId && Types.ObjectId.isValid(params.userObjectId.toString())
      ? new Types.ObjectId(params.userObjectId.toString())
      : null;

    const roleClean = (params.role || 'recruiter').toLowerCase().trim();
    const emailClean = (params.userEmail || '').toLowerCase().trim();

    const record = await this.userAuditLogModel.findOneAndUpdate(
      { date: todayIST, userId: params.userId },
      {
        $setOnInsert: {
          firstLoginTime: now,
          latestLogoutTime: null,
        },
        $set: {
          orgId: orgObjId,
          userId: params.userId,
          userObjectId: userObjId,
          userName: params.userName || emailClean || 'User',
          userEmail: emailClean,
          role: roleClean,
          date: todayIST,
          status: AuditSessionStatus.ACTIVE,
          lastActiveAt: now,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
        $inc: { loginCount: 1 },
      },
      { upsert: true, new: true },
    );

    this.logger.log(
      `Recorded audit login for ${params.userName} (${emailClean}, ${roleClean}) on ${todayIST} - Status: Active`,
    );
    return record;
  }

  /**
   * Records user logout in daily audit logs:
   * - Updates latest logout time on every logout.
   * - Changes status to 'Logged Out'.
   * - Preserves first login time.
   */
  async recordUserLogout(params: {
    userId?: string;
    userObjectId?: Types.ObjectId | string;
  }) {
    const now = new Date();
    const todayIST = this.getISTDateString(now);

    const query: Record<string, any> = { date: todayIST };
    if (params.userId) {
      query.userId = params.userId;
    } else if (params.userObjectId) {
      query.userObjectId = new Types.ObjectId(params.userObjectId.toString());
    } else {
      return null;
    }

    const record = await this.userAuditLogModel.findOneAndUpdate(
      query,
      {
        $set: {
          status: AuditSessionStatus.LOGGED_OUT,
          latestLogoutTime: now,
          lastActiveAt: now,
        },
      },
      { new: true, sort: { createdAt: -1 } },
    );

    if (record) {
      this.logger.log(
        `Recorded audit logout for ${record.userName} (${record.userEmail}) on ${todayIST} - Logout: ${this.formatTimeIST(now)}`,
      );
    }
    return record;
  }

  /**
   * Heartbeat to keep session active
   */
  async recordUserHeartbeat(params: {
    userId?: string;
    userObjectId?: Types.ObjectId | string;
  }) {
    const now = new Date();
    const todayIST = this.getISTDateString(now);

    const query: Record<string, any> = {
      date: todayIST,
      status: AuditSessionStatus.ACTIVE,
    };
    if (params.userId) {
      query.userId = params.userId;
    } else if (params.userObjectId) {
      query.userObjectId = new Types.ObjectId(params.userObjectId.toString());
    } else {
      return null;
    }

    return this.userAuditLogModel.findOneAndUpdate(
      query,
      { $set: { lastActiveAt: now } },
      { new: true },
    );
  }

  /**
   * Automatically expires sessions that have exceeded timeout without confirmed logout
   */
  async expireInactiveSessions(thresholdMinutes: number = 480) {
    const cutoffDate = new Date(Date.now() - thresholdMinutes * 60 * 1000);
    const result = await this.userAuditLogModel.updateMany(
      {
        status: AuditSessionStatus.ACTIVE,
        lastActiveAt: { $lt: cutoffDate },
      },
      {
        $set: {
          status: AuditSessionStatus.SESSION_EXPIRED,
        },
      },
    );

    if (result.modifiedCount > 0) {
      this.logger.log(`Audit maintenance: Transitioned ${result.modifiedCount} session(s) to Session Expired.`);
    }
    return result.modifiedCount;
  }

  /**
   * Retrieves paginated daily audit logs with filters
   */
  async getUserLogs(
    currentUser: any,
    query: UserAuditLogQueryDto,
  ): Promise<PaginatedUserAuditLogResult> {
    await this.expireInactiveSessions().catch(() => {});

    const filter: Record<string, any> = {};

    // 1. Date filters
    if (query.date) {
      filter.date = query.date.trim();
    } else if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) filter.date.$gte = query.startDate.trim();
      if (query.endDate) filter.date.$lte = query.endDate.trim();
    }

    // 2. Role filter
    if (query.role && query.role !== 'All Roles') {
      filter.role = query.role.trim().toLowerCase();
    }

    // 3. Status filter
    if (query.status && query.status !== 'All Statuses') {
      filter.status = query.status.trim();
    }

    // 4. Search query
    if (query.search && query.search.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ userName: regex }, { userEmail: regex }, { userId: regex }];
    }

    const page = Math.max(1, parseInt(String(query.page || 1), 10));
    const rawLimit = parseInt(String(query.limit || 20), 10);
    const limit = Math.min(200, Math.max(1, rawLimit));
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.userAuditLogModel.countDocuments(filter).exec(),
      this.userAuditLogModel
        .find(filter)
        .sort({ date: -1, firstLoginTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
    ]);

    const formatted = items.map((item) => ({
      ...item,
      id: item._id?.toString() || item.userId,
      firstLoginFormattedIST: this.formatTimeIST(item.firstLoginTime),
      latestLogoutFormattedIST: this.formatTimeIST(item.latestLogoutTime),
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
   * Generates CSV for filtered user audit logs (Super Admin only)
   */
  async exportLogsCsv(currentUser: any, query: UserAuditLogQueryDto): Promise<string> {
    await this.expireInactiveSessions().catch(() => {});

    await this.recordSecurityAlert({
      type: 'bulk_export',
      action: 'Bulk export of user audit logs (CSV)',
      currentUser,
      orgId: currentUser?.orgId,
      details: {
        filters: redactSecrets({
          date: query.date,
          startDate: query.startDate,
          endDate: query.endDate,
          role: query.role,
          status: query.status,
          search: query.search ? '[present]' : undefined,
        }),
      },
      targetEntity: 'UserAuditLog',
    }).catch(() => {});

    const filter: Record<string, any> = {};

    if (query.date) {
      filter.date = query.date.trim();
    } else if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) filter.date.$gte = query.startDate.trim();
      if (query.endDate) filter.date.$lte = query.endDate.trim();
    }

    if (query.role && query.role !== 'All Roles') {
      filter.role = query.role.trim().toLowerCase();
    }

    if (query.status && query.status !== 'All Statuses') {
      filter.status = query.status.trim();
    }

    if (query.search && query.search.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ userName: regex }, { userEmail: regex }, { userId: regex }];
    }

    const items = await this.userAuditLogModel
      .find(filter)
      .sort({ date: -1, firstLoginTime: -1 })
      .limit(5000)
      .lean()
      .exec();

    const headers = [
      'User Name',
      'Email',
      'Role',
      'Date',
      'First Login Time (IST)',
      'Latest Logout Time (IST)',
      'Status',
      'IP Address',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = items.map((item) => {
      const firstLoginIST = this.formatTimeIST(item.firstLoginTime) || '—';
      const latestLogoutIST = this.formatTimeIST(item.latestLogoutTime) || '—';
      return [
        escapeCsv(item.userName),
        escapeCsv(item.userEmail),
        escapeCsv(item.role),
        escapeCsv(item.date),
        escapeCsv(firstLoginIST),
        escapeCsv(latestLogoutIST),
        escapeCsv(item.status),
        escapeCsv(item.ipAddress || '—'),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }
}
