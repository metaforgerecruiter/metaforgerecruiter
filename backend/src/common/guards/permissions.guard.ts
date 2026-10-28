import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';

const FALLBACK_PERMISSIONS: Record<string, string[]> = {
  superadmin: ['*'],
  devteam: ['*'],
  admin: [
    'req_view_all', 'req_create', 'req_edit', 'req_assign',
    'cand_search', 'cand_add', 'cand_export',
    'sub_create', 'sub_view_all', 'sub_reassign', 'sub_move_stage',
    'int_schedule', 'int_join_links', 'int_feedback', 'int_cancel',
    'rep_view_exec', 'rep_view_recruiter', 'user_manage',
  ],
  lead: [
    'req_view_all', 'req_assign', 'req_edit',
    'cand_search', 'cand_add', 'cand_export',
    'sub_create', 'sub_view_all', 'sub_reassign', 'sub_move_stage',
    'int_schedule', 'int_join_links', 'int_feedback',
    'rep_view_recruiter',
  ],
  recruiter: [
    'req_assign',
    'req_edit',
    'cand_search', 'cand_add',
    'sub_create', 'sub_move_stage',
    'int_schedule', 'int_join_links', 'int_feedback',
  ],
  client: ['req_view_my', 'sub_view_client', 'int_feedback'],
};

const PERMISSION_TO_CAPABILITY: Record<string, string> = {
  cand_add: 'addCandidates',
  sub_create: 'submitToClients',
  sub_forward_client: 'submitToClients',
  int_schedule: 'scheduleInterviews',
  cand_export: 'exportReportsCsv',
  rep_export: 'exportReportsCsv',
  rep_view_exec: 'viewTeamAnalytics',
  sub_reassign: 'reassignRequirements',
  req_assign: 'reassignRequirements',
  cand_delete: 'deleteRecords',
  req_delete: 'deleteRecords',
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user?.role) {
      throw new ForbiddenException('Authenticated role is required for this action');
    }

    const role = String(user.role).toLowerCase();
    if (role === 'superadmin' || role === 'devteam') return true;

    // Recruiters are permitted to access req_assign (scoped to self-assignment in RequirementsService)
    if (role === 'recruiter' && required === 'req_assign') return true;

    const capKey = PERMISSION_TO_CAPABILITY[required];
    if (capKey && user.capabilities && typeof user.capabilities === 'object' && user.capabilities[capKey] !== undefined) {
      if (user.capabilities[capKey] === false) {
        throw new ForbiddenException(`Permission Restricted: Super Admin has disabled ${capKey} for your account.`);
      }
      if (user.capabilities[capKey] === true) {
        return true;
      }
    }

    const fallback = FALLBACK_PERMISSIONS[role] || [];
    const userPerms = Array.isArray(user.permissions) ? user.permissions : [];
    const granted: string[] = Array.from(new Set([...userPerms, ...fallback]));

    if (granted.includes('*') || granted.includes(required)) return true;

    throw new ForbiddenException(`Missing permission: ${required}`);
  }
}
