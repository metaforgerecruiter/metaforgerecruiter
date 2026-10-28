import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { hashPasswordArgon2id } from '../../common/security/password.util';

import { User, UserDocument } from './schemas/user.schema';
import { RolePermission, RolePermissionDocument } from './schemas/role-permission.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ScreenTimeDto } from './dto/screen-time.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { RecruiterAnalytics, RecruiterAnalyticsDocument } from '../analytics/schemas/recruiter-analytics.schema';
import {
  assertCanAccessUser,
  requireOrgId,
} from '../../common/security/resource-access.util';
import { AuditService } from '../audit/audit.service';

const DEFAULT_ROLE_PERMISSIONS: Record<string, { roleName: string; permissions: string[] }> = {
  superadmin: {
    roleName: 'Super Admin',
    permissions: [
      'req_view_all', 'req_create', 'req_edit', 'req_assign', 'req_delete',
      'cand_search', 'cand_add', 'cand_export', 'cand_delete',
      'sub_create', 'sub_view_all', 'sub_reassign', 'sub_move_stage',
      'int_schedule', 'int_join_links', 'int_feedback', 'int_cancel',
      'rep_view_exec', 'rep_view_recruiter', 'rep_export_csv',
      'user_manage', 'role_manage', 'activity_logs',
    ],
  },
  admin: {
    roleName: 'Admin',
    permissions: [
      'req_view_all', 'req_create', 'req_edit', 'req_assign',
      'cand_search', 'cand_add', 'cand_export',
      'sub_create', 'sub_view_all', 'sub_reassign', 'sub_move_stage',
      'int_schedule', 'int_join_links', 'int_feedback', 'int_cancel',
      'rep_view_exec', 'rep_view_recruiter', 'user_manage',
    ],
  },
  lead: {
    roleName: 'Team Lead',
    permissions: [
      'req_view_all', 'req_assign',
      'cand_search', 'cand_add', 'cand_export',
      'sub_create', 'sub_view_all', 'sub_reassign', 'sub_move_stage',
      'int_schedule', 'int_join_links', 'int_feedback',
      'rep_view_recruiter',
    ],
  },
  recruiter: {
    roleName: 'Recruiter',
    permissions: [
      'cand_search', 'cand_add',
      'sub_create', 'sub_move_stage',
      'int_schedule', 'int_join_links', 'int_feedback',
    ],
  },
  devteam: {
    roleName: 'Dev Team',
    permissions: [
      'req_view_all', 'req_create', 'req_edit', 'req_assign', 'req_delete',
      'cand_search', 'cand_add', 'cand_export', 'cand_delete',
      'sub_create', 'sub_view_all', 'sub_reassign', 'sub_move_stage',
      'int_schedule', 'int_join_links', 'int_feedback', 'int_cancel',
      'rep_view_exec', 'rep_view_recruiter', 'rep_export_csv',
      'user_manage', 'role_manage', 'activity_logs',
    ],
  },
  client: {
    roleName: 'Client',
    permissions: ['req_view_my', 'sub_view_client', 'int_feedback'],
  },
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(RolePermission.name) private readonly rolePermissionModel: Model<RolePermissionDocument>,
    @InjectModel(RecruiterAnalytics.name) private readonly analyticsModel: Model<RecruiterAnalyticsDocument>,
    private readonly auditService: AuditService,
  ) {}

  /** Format user document for API response (stripping sensitive passwordHash) */
  private sanitizeUser(user: UserDocument) {
    const obj = user.toObject ? user.toObject() : user;
    const { passwordHash, ...rest } = obj;
    return {
      ...rest,
      id: user._id.toString(),
    };
  }

  /** GET /api/v1/users */
  async findAll(currentUser: any, query?: { role?: string; search?: string; active?: string }) {
    const orgId = requireOrgId(currentUser);
    const filter: Record<string, any> = { orgId, deletedAt: null };

    if (query?.role) {
      filter.role = query.role.toLowerCase();
    }

    if (query?.active !== undefined) {
      filter.active = query.active === 'true';
    }

    if (query?.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { userId: regex }];
    }

    const users = await this.userModel.find(filter).sort({ createdAt: -1 }).exec();
    return users.map(u => this.sanitizeUser(u));
  }

  /** Load user by Mongo id or business id, scoped to caller org + role. */
  private async loadUserForUser(
    id: string,
    currentUser: any,
    includeDeleted = false,
  ): Promise<UserDocument> {
    const orgId = requireOrgId(currentUser);
    const base: any = { orgId };
    if (!includeDeleted) base.deletedAt = null;
    const opts = includeDeleted ? { includeDeleted: true } : undefined;
    let user: UserDocument | null = null;
    if (Types.ObjectId.isValid(id)) {
      user = (await this.userModel.findOne({ _id: id, ...base }, null, opts).exec()) as any;
    }
    if (!user) {
      user = (await this.userModel.findOne({ userId: id, ...base }, null, opts).exec()) as any;
    }
    if (!user) {
      throw new NotFoundException(`User '${id}' not found`);
    }
    assertCanAccessUser(user, currentUser);
    return user;
  }

  /** GET /api/v1/users/:id */
  async findById(id: string, currentUser: any) {
    const user = await this.loadUserForUser(id, currentUser);
    return this.sanitizeUser(user);
  }

  /** POST /api/v1/users */
  async create(dto: CreateUserDto, currentUser: any) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const orgId = requireOrgId(currentUser);

    const existing = await this.userModel.findOne({ orgId, email: normalizedEmail, deletedAt: null }).exec();
    if (existing) {
      throw new ConflictException(`User with email '${normalizedEmail}' already exists`);
    }

    const passwordHash = await hashPasswordArgon2id(dto.password);
    const userId = `user-${Date.now()}`;

    const newUser = new this.userModel({
      orgId,
      userId,
      name: dto.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: dto.role.toLowerCase(),
      phone: dto.phone || null,
      avatarUrl: dto.avatarUrl || null,
      active: dto.active !== undefined ? dto.active : true,
      capabilities: dto.capabilities || {},
      teamId: dto.teamId && Types.ObjectId.isValid(dto.teamId) ? new Types.ObjectId(dto.teamId) : null,
      clientId: dto.clientId && Types.ObjectId.isValid(dto.clientId) ? new Types.ObjectId(dto.clientId) : null,
    });

    const saved = await newUser.save();
    return this.sanitizeUser(saved);
  }

  /** PUT /api/v1/users/:id */
  async update(id: string, dto: UpdateUserDto & { restore?: boolean }, currentUser: any) {
    const user = await this.loadUserForUser(id, currentUser, true);

    const before = {
      role: user.role,
      active: user.active,
      capabilities: { ...(user.capabilities || {}) },
      teamId: user.teamId ? String(user.teamId) : null,
      clientId: user.clientId ? String(user.clientId) : null,
    };

    if (dto.name !== undefined) user.name = dto.name.trim();
    if (dto.email !== undefined) user.email = dto.email.trim().toLowerCase();
    if (dto.role !== undefined) user.role = dto.role.toLowerCase();
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
    if (dto.active !== undefined) user.active = dto.active;
    if (dto.capabilities !== undefined) user.capabilities = dto.capabilities;
    if (dto.teamId !== undefined) {
      user.teamId = dto.teamId && Types.ObjectId.isValid(dto.teamId) ? (new Types.ObjectId(dto.teamId) as any) : null;
    }
    if (dto.clientId !== undefined) {
      user.clientId = dto.clientId && Types.ObjectId.isValid(dto.clientId) ? (new Types.ObjectId(dto.clientId) as any) : null;
    }
    const passwordChanged = Boolean(dto.password);
    if (dto.password) {
      user.passwordHash = await hashPasswordArgon2id(dto.password);
      // Never log or audit the plaintext password value.
    }
    if (dto.active === true || dto.restore === true) {
      user.deletedAt = null as any;
      user.active = true;
    }

    const updated = await user.save();

    const after = {
      role: updated.role,
      active: updated.active,
      capabilities: { ...(updated.capabilities || {}) },
      teamId: updated.teamId ? String(updated.teamId) : null,
      clientId: updated.clientId ? String(updated.clientId) : null,
    };
    const privilegeChanged =
      before.role !== after.role ||
      before.active !== after.active ||
      before.teamId !== after.teamId ||
      before.clientId !== after.clientId ||
      JSON.stringify(before.capabilities) !== JSON.stringify(after.capabilities) ||
      passwordChanged;

    if (privilegeChanged) {
      await this.auditService
        .recordSecurityAlert({
          type: 'privilege_change',
          action: 'User privilege or access attributes changed',
          currentUser,
          orgId: currentUser?.orgId || updated.orgId,
          targetEntity: 'User',
          targetId: updated._id.toString(),
          details: {
            targetEmail: updated.email,
            before: { role: before.role, active: before.active, teamId: before.teamId, clientId: before.clientId },
            after: { role: after.role, active: after.active, teamId: after.teamId, clientId: after.clientId },
            capabilitiesChanged:
              JSON.stringify(before.capabilities) !== JSON.stringify(after.capabilities),
            passwordReset: passwordChanged,
          },
        })
        .catch(() => {});
    }

    return this.sanitizeUser(updated);
  }

  /** DELETE /api/v1/users/:id */
  async softDelete(id: string, currentUser: any) {
    const user = await this.loadUserForUser(id, currentUser);

    user.deletedAt = new Date();
    user.active = false;
    await user.save();

    await this.auditService
      .recordSecurityAlert({
        type: 'privilege_change',
        action: 'User account deactivated (soft delete)',
        currentUser,
        orgId: currentUser?.orgId || user.orgId,
        targetEntity: 'User',
        targetId: user._id.toString(),
        details: { targetEmail: user.email, role: user.role },
      })
      .catch(() => {});

    return { message: `User '${user.name}' has been soft-deleted successfully` };
  }

  /** POST /api/v1/users/restore/:id */
  async restore(id: string, currentUser: any) {
    return this.update(id, { active: true, restore: true }, currentUser);
  }

  /** DELETE /api/v1/users/:id?permanent=true */
  async hardDelete(id: string, currentUser: any) {
    // Authorize first (org + admin/self), then permanently delete within org.
    const user = await this.loadUserForUser(id, currentUser, true);
    const orgId = requireOrgId(currentUser);
    const res = await this.userModel
      .deleteOne({ _id: user._id, orgId })
      .exec();
    if (!res || res.deletedCount === 0) {
      throw new NotFoundException(`User '${id}' not found for permanent deletion`);
    }
    return { message: `User '${id}' has been permanently deleted from database` };
  }

  /** GET /api/v1/users/me */
  async getMe(currentUser: any) {
    const user = await this.userModel.findById(currentUser.id || currentUser.userId).exec();
    if (!user) {
      throw new NotFoundException('Current authenticated user not found');
    }
    return this.sanitizeUser(user);
  }

  /** PUT /api/v1/users/me */
  async updateMe(dto: UpdateProfileDto, currentUser: any) {
    const user = await this.userModel.findById(currentUser.id || currentUser.userId).exec();
    if (!user) {
      throw new NotFoundException('Current authenticated user not found');
    }

    if (dto.name !== undefined) user.name = dto.name.trim();
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;

    if (dto.password) {
      user.passwordHash = await hashPasswordArgon2id(dto.password);
    }

    const updated = await user.save();
    return this.sanitizeUser(updated);
  }

  /** POST /api/v1/users/screen-time */
  async recordScreenTime(dto: ScreenTimeDto, currentUser: any) {
    const dateKey = dto.date || new Date().toISOString().split('T')[0];
    const day = new Date(`${dateKey}T00:00:00.000Z`);
    const orgId = currentUser.orgId
      ? new Types.ObjectId(currentUser.orgId)
      : new Types.ObjectId('6ab4f38ff2e0e1823c038948');
    const recruiterId = currentUser.id && Types.ObjectId.isValid(currentUser.id)
      ? new Types.ObjectId(currentUser.id)
      : undefined;

    let record = null;
    if (recruiterId) {
      record = await this.analyticsModel.findOneAndUpdate(
        { orgId, recruiterId, date: day },
        {
          $inc: { activeScreenTimeMinutes: Math.round((dto.activeSeconds || 0) / 60) },
          $setOnInsert: { orgId, recruiterId, date: day, schemaVersion: 1 },
        },
        { upsert: true, new: true },
      ).exec();
    }

    return {
      message: 'Screen time recorded successfully',
      record: {
        date: dateKey,
        userName: currentUser.name || currentUser.email,
        userRole: currentUser.role,
        activeSeconds: dto.activeSeconds,
        idleSeconds: dto.idleSeconds,
        status: dto.status || 'Active',
        lastActivityTimestamp: Date.now(),
        persistedMinutes: record?.activeScreenTimeMinutes ?? Math.round((dto.activeSeconds || 0) / 60),
      },
    };
  }

  /** GET /api/v1/roles/permissions */
  async getRolePermissions(currentUser: any) {
    const orgId = currentUser.orgId
      ? new Types.ObjectId(currentUser.orgId)
      : new Types.ObjectId('6ab4f38ff2e0e1823c038948');

    let docs = await this.rolePermissionModel.find({ orgId }).exec();

    // If empty in MongoDB, seed default matrix into MongoDB
    if (!docs || docs.length === 0) {
      const seedItems = Object.entries(DEFAULT_ROLE_PERMISSIONS).map(([roleCode, val]) => ({
        orgId,
        roleCode,
        roleName: val.roleName,
        permissions: val.permissions,
      }));
      docs = (await this.rolePermissionModel.insertMany(seedItems)) as any;
    }

    const result: Record<string, string[]> = {};
    const storedName: Record<string, string> = {};
    docs.forEach(doc => {
      result[doc.roleCode] = doc.permissions;
      storedName[doc.roleCode] = doc.roleName;
    });

    const roleCodes = [
      ...Object.keys(DEFAULT_ROLE_PERMISSIONS),
      ...docs.map(doc => doc.roleCode).filter(code => !DEFAULT_ROLE_PERMISSIONS[code]),
    ];

    return {
      orgId: orgId.toString(),
      permissionsMatrix: result,
      roles: roleCodes.map(roleCode => ({
        roleCode,
        roleName: DEFAULT_ROLE_PERMISSIONS[roleCode]?.roleName || storedName[roleCode] || roleCode,
        permissions: result[roleCode] || DEFAULT_ROLE_PERMISSIONS[roleCode]?.permissions || [],
      })),
    };
  }

  /** PUT /api/v1/roles/permissions */
  async updateRolePermissions(dto: UpdateRolePermissionsDto, currentUser: any) {
    const orgId = requireOrgId(currentUser);
    const roleCode = dto.roleCode.toLowerCase();

    const roleName = DEFAULT_ROLE_PERMISSIONS[roleCode]?.roleName || roleCode.toUpperCase();
    const previous = await this.rolePermissionModel.findOne({ orgId, roleCode }).exec();

    const updated = await this.rolePermissionModel.findOneAndUpdate(
      { orgId, roleCode },
      { roleName, permissions: dto.permissions },
      { new: true, upsert: true },
    ).exec();

    await this.auditService
      .recordSecurityAlert({
        type: 'privilege_change',
        action: `Role permissions updated for '${roleCode}'`,
        currentUser,
        orgId,
        targetEntity: 'RolePermission',
        targetId: roleCode,
        details: {
          roleCode,
          previousPermissionCount: previous?.permissions?.length ?? 0,
          newPermissionCount: updated.permissions?.length ?? 0,
          // List permission codes only (not secrets).
          permissions: updated.permissions || [],
        },
      })
      .catch(() => {});

    return {
      message: `Permissions for role '${roleCode}' updated successfully`,
      rolePermission: {
        roleCode: updated.roleCode,
        roleName: updated.roleName,
        permissions: updated.permissions,
      },
    };
  }
}
