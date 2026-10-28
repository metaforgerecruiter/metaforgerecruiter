import { Schema, Query, Types } from 'mongoose';
import { CurrentUserPayload } from '../../common/interfaces/current-user.interface';

export function DataScopePlugin(schema: Schema) {
  const hasDeletedAt = schema.path('deletedAt') !== undefined;
  const hasOrgId = schema.path('orgId') !== undefined;
  const hasRecruiterId = schema.path('recruiterId') !== undefined || schema.path('assignedRecruiterIds') !== undefined;
  const hasLeadId = schema.path('assignedLeadId') !== undefined || schema.path('leadId') !== undefined;
  const hasClientId = schema.path('clientId') !== undefined;

  const preQueryHook = function (this: Query<any, any>) {
    const options = this.getOptions();
    const user: CurrentUserPayload | undefined = options.currentUser;

    const conditions: Record<string, any> = {};

    // 1. Always inject orgId filter if schema has orgId and user context is provided
    if (hasOrgId && user?.orgId) {
      conditions.orgId = Types.ObjectId.isValid(user.orgId) ? new Types.ObjectId(user.orgId.toString()) : user.orgId;
    }

    // 2. Always inject deletedAt: null if schema supports soft delete and not explicitly querying deleted
    if (hasDeletedAt && !options.includeDeleted) {
      conditions.deletedAt = null;
    }

    // 3. Inject role data scoping ONLY if target schema supports the corresponding fields
    if (user && (user.role === 'superadmin' || user.role === 'admin' || user.role === 'devteam')) {
      // Admins and Dev Team see all organization data
    } else if (user) {
      if (user.role === 'recruiter' && hasRecruiterId) {
        const orClause: any[] = [];
        if (schema.path('recruiterId')) orClause.push({ recruiterId: user._id });
        if (schema.path('assignedRecruiterIds')) orClause.push({ assignedRecruiterIds: user._id });
        if (schema.path('createdBy')) orClause.push({ createdBy: user._id });
        if (orClause.length > 0) conditions.$or = orClause;
      } else if (user.role === 'lead' && hasLeadId) {
        const orClause: any[] = [];
        if (schema.path('assignedLeadId')) orClause.push({ assignedLeadId: user._id });
        if (schema.path('leadId')) orClause.push({ leadId: user._id });
        if (user.teamRecruiterIds?.length && schema.path('recruiterId')) {
          orClause.push({ recruiterId: { $in: user.teamRecruiterIds } });
        }
        if (orClause.length > 0) conditions.$or = orClause;
      } else if (user.role === 'client' && user.clientId && hasClientId) {
        conditions.clientId = user.clientId;
      }
    }

    if (Object.keys(conditions).length > 0) {
      this.where(conditions);
    }
  };

  schema.pre('find', preQueryHook);
  schema.pre('findOne', preQueryHook);
  schema.pre('findOneAndUpdate', preQueryHook);
  schema.pre('countDocuments', preQueryHook);
}
