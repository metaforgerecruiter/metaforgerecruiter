import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Requirement, RequirementDocument } from './schemas/requirement.schema';
import { RequirementHistory, RequirementHistoryDocument } from './schemas/requirement-history.schema';
import { Client, ClientDocument } from '../clients/schemas/client.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RequirementRepository } from './repositories/requirement.repository';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { AssignRequirementDto } from './dto/assign-requirement.dto';
import { RevokeRequirementDto } from './dto/revoke-requirement.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { getClientEmailDefaults, sanitizeEmailList } from '../../common/constants/client-email-defaults';
import { sanitizeEmailHtml } from '../../common/security/html-sanitize.util';
import { assertCanAccessRequirement, orgScope, requireOrgId } from '../../common/security/resource-access.util';
import { displayRequirementId, reqCodeCandidates } from '../../common/requirement-id';

@Injectable()
export class RequirementsService {
  private readonly logger = new Logger(RequirementsService.name);
  private syncState = {
    status: 'idle' as 'idle' | 'running' | 'completed' | 'waiting' | 'failed',
    lastSyncedAt: null as Date | null,
    totalProcessed: 0,
    totalSynced: 0,
    totalDeduped: 0,
    message: '',
    error: null as string | null,
  };
  private readonly ingestMutex = new Map<string, Promise<any>>();

  constructor(
    @InjectModel(Requirement.name)
    private readonly requirementModel: Model<RequirementDocument>,
    @InjectModel(RequirementHistory.name)
    private readonly historyModel: Model<RequirementHistoryDocument>,
    @InjectModel(Client.name)
    private readonly clientModel: Model<ClientDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly requirementRepository: RequirementRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Resolve user names/emails/IDs into valid User Mongo ObjectIds */
  private async resolveUserObjectIds(identifiers: string[], currentUser?: any): Promise<Types.ObjectId[]> {
    if (!identifiers || identifiers.length === 0) return [];
    const results: Types.ObjectId[] = [];
    for (const raw of identifiers) {
      if (!raw) continue;
      const str = String(raw).trim();
      if (!str) continue;

      if (str.toLowerCase() === 'myself' || (currentUser?.name && str.toLowerCase() === currentUser.name.toLowerCase())) {
        const cId = currentUser?.id || currentUser?.userId;
        if (cId && Types.ObjectId.isValid(cId)) {
          results.push(new Types.ObjectId(cId));
          continue;
        }
      }

      if (Types.ObjectId.isValid(str)) {
        const u = await this.userModel.findById(str).exec();
        if (u) {
          results.push(u._id as Types.ObjectId);
          continue;
        }
      }

      const u = await this.userModel.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
          { email: { $regex: new RegExp(`^${str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
          { name: str },
          { email: str },
          { userId: str },
        ],
      }).exec();

      if (u) {
        results.push(u._id as Types.ObjectId);
      }
    }

    const uniqueMap = new Map<string, Types.ObjectId>();
    results.forEach(id => uniqueMap.set(String(id), id));
    return Array.from(uniqueMap.values());
  }


  /** Format document for API output */
  private sanitizeRequirement(doc: RequirementDocument) {
    const obj = doc.toObject ? doc.toObject() : doc;
    // reqCode is the stored application ID; id/displayId add the client's reference in brackets.
    const code = doc.reqCode || doc._id.toString();
    const displayId = displayRequirementId(code, doc.sourceClientJdId);

    return {
      ...obj,
      id: displayId,
      displayId,
      reqCode: code,
      _id: doc._id.toString(),
      sourceClientJdId: doc.sourceClientJdId || null,
      client: (obj as any).clientName || '',
      skills: (obj as any).skillsRequired || [],
      clientEmail: doc.clientEmail,
      toEmails: doc.toEmails || [],
      ccEmails: doc.ccEmails || [],
      description: (obj as any).description || '',
      employmentType: (obj as any).employmentType || '',
      workMode: (obj as any).workMode || '',
      noticePeriod: (obj as any).noticePeriod || '',
      experienceLevel: (obj as any).experienceLevel || '',
      mandatorySkills: (obj as any).mandatorySkills || [],
      conversationId: (obj as any).conversationId || undefined,
      inReplyTo: (obj as any).inReplyTo || undefined,
      budgetText: (obj as any).budgetText || '',
      emailArrivedTime: doc.emailArrivedTime || (obj as any).createdAt || null,
      first_detected_at: (doc as any).firstDetectedAt || (obj as any).createdAt || doc.emailArrivedTime || null,
      firstDetectedAt: (doc as any).firstDetectedAt || (obj as any).createdAt || doc.emailArrivedTime || null,
      last_updated_at: (doc as any).lastUpdatedAt || (obj as any).updatedAt || null,
      lastUpdatedAt: (doc as any).lastUpdatedAt || (obj as any).updatedAt || null,
      source_email_received_at: (doc as any).sourceEmailReceivedAt || doc.emailArrivedTime || (obj as any).createdAt || null,
      sourceEmailReceivedAt: (doc as any).sourceEmailReceivedAt || doc.emailArrivedTime || (obj as any).createdAt || null,
      last_seen_at: (doc as any).lastSeenAt || doc.emailArrivedTime || (obj as any).createdAt || null,
      lastSeenAt: (doc as any).lastSeenAt || doc.emailArrivedTime || (obj as any).createdAt || null,
      idempotencyKey: (doc as any).idempotencyKey || null,
    };
  }

  /**
   * Next application Requirement ID for the creation date: YYYY-MM-DD-NNN, where the day is
   * the creation date in Asia/Kolkata and NNN restarts at 001 each day. The client's own
   * reference is never part of this ID (it is stored in sourceClientJdId).
   * Deleted rows count toward the sequence so a number is never reused. Legacy-format codes
   * ("YYYY/MM/DD-NNN") are a different string space and cannot collide, so they are ignored.
   */
  async generateReqCode(orgId: Types.ObjectId, targetDate?: Date): Promise<string> {
    const day = reqCodeDay(targetDate || new Date());
    const [yyyy, mm, dd] = day.split('-');
    const sameDay = new RegExp(`^${yyyy}-${mm}-${dd}-(\\d{3,})$`);
    const existingForDay = await this.requirementModel
      .find({ orgId, reqCode: { $regex: sameDay } }, { reqCode: 1 })
      .setOptions({ includeDeleted: true })
      .lean()
      .exec();

    let maxSeq = 0;
    for (const m of existingForDay) {
      const match = String(m.reqCode || '').match(sameDay);
      const num = match ? parseInt(match[1], 10) : NaN;
      if (!isNaN(num) && num > maxSeq) maxSeq = num;
    }
    return `${day}-${String(maxSeq + 1).padStart(3, '0')}`;
  }

  /**
   * Save a NEW requirement with the next Requirement ID. The number is taken only when the
   * insert succeeds; if a concurrent insert claimed the same code, the unique index
   * (orgId, reqCode, deletedAt) rejects ours and we retry with the following number.
   */
  private async saveNewRequirement(doc: RequirementDocument, createdAt: Date): Promise<RequirementDocument> {
    for (let attempt = 0; attempt < 20; attempt++) {
      doc.reqCode = await this.generateReqCode(doc.orgId as Types.ObjectId, createdAt);
      // After a failed insert Mongoose may treat the next save() as an update of a record that
      // was never written; force an insert on every attempt.
      doc.isNew = true;
      try {
        const saved = await doc.save();
        const persisted = await this.requirementModel.exists({ _id: saved._id, reqCode: saved.reqCode });
        if (!persisted) throw Object.assign(new Error('insert not persisted'), { code: 11000, keyPattern: { reqCode: 1 } });
        return saved;
      } catch (err: any) {
        const reqCodeClash = err?.code === 11000 && (err?.keyPattern?.reqCode || /reqCode/.test(String(err?.message)));
        if (!reqCodeClash) throw err;
        this.logger.warn(`Requirement ID ${doc.reqCode} was taken concurrently; retrying`);
      }
    }
    throw new Error('Could not allocate a unique Requirement ID after 20 attempts');
  }

  /** Write history log record */
  private async logHistory(
    orgId: Types.ObjectId,
    requirementId: Types.ObjectId,
    action: string,
    performedBy: Types.ObjectId,
    previousValue: Record<string, any> = {},
    newValue: Record<string, any> = {},
    reason: string = '',
  ) {
    try {
      const history = new this.historyModel({
        orgId,
        requirementId,
        action,
        performedBy,
        previousValue,
        newValue,
        reason,
      });
      await history.save();
    } catch (e) {
      // Ignore non-fatal audit log failures
    }
  }

  /** GET /api/v1/requirements */
  async findAll(currentUser: any, query?: { status?: string; priority?: string; clientId?: string; search?: string }) {
    const orgId = requireOrgId(currentUser);
    const role = (currentUser.role || 'recruiter').toLowerCase();

    const filter: Record<string, any> = { orgId, deletedAt: null };

    // Recruiters see the shared requirement list, including mail-extracted demands.
    // Assignment still controls My Workspace. Clients stay limited to their account.
    if (role === 'client' && currentUser.clientId) {
      filter.clientId = new Types.ObjectId(currentUser.clientId);
    }

    if (query?.status) {
      filter.status = query.status;
    }

    if (query?.priority) {
      filter.priority = query.priority;
    }

    if (query?.clientId && Types.ObjectId.isValid(query.clientId)) {
      filter.clientId = new Types.ObjectId(query.clientId);
    }

    if (query?.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { reqCode: regex },
        { clientName: regex },
        { skillsRequired: regex },
      ];
    }

    const items = await this.requirementModel
      .find(filter)
      // Newest requirement first by ORIGINAL creation time; updates never move a record.
      // _id breaks ties deterministically so pages never overlap or reorder.
      .sort({ firstDetectedAt: -1, _id: -1 })
      .exec();
    return items.map(item => this.sanitizeRequirement(item));
  }

  /** Load requirement by Mongo id or reqCode, scoped to caller org. */
  private async loadRequirementForUser(
    id: string,
    currentUser: any,
    projection?: string,
  ): Promise<RequirementDocument> {
    const scope = orgScope(currentUser);
    let doc: RequirementDocument | null = null;
    if (Types.ObjectId.isValid(id)) {
      const byId = this.requirementModel.findOne({ _id: id, ...scope });
      doc = projection ? await byId.select(projection).exec() : await byId.exec();
    }
    if (!doc) {
      const byCode = this.requirementModel.findOne({
        reqCode: { $in: reqCodeCandidates(id) },
        ...scope,
      });
      doc = projection ? await byCode.select(projection).exec() : await byCode.exec();
    }
    if (!doc) {
      throw new NotFoundException(`Requirement '${id}' not found`);
    }
    assertCanAccessRequirement(doc, currentUser);
    return doc;
  }

  /** GET /api/v1/requirements/:id */
  async findById(id: string, currentUser: any) {
    const doc = await this.loadRequirementForUser(id, currentUser);
    return this.sanitizeRequirement(doc);
  }

  /** GET /api/v1/requirements/:id/original-email */
  async getOriginalEmail(id: string, currentUser: any) {
    const projection = '+sourceEmailBody +sourceEmailHtml';
    const doc = await this.loadRequirementForUser(id, currentUser, projection);

    const r: any = doc;
    const bodyText = r.sourceEmailBody || null;
    const rawHtml = r.sourceEmailHtml || null;
    // Sanitize before leaving the API — untrusted client mail HTML.
    const bodyHtml = rawHtml ? sanitizeEmailHtml(rawHtml) : null;
    return {
      requirementId: doc.reqCode || doc._id.toString(),
      subject: r.sourceSubject || doc.title || null,
      from: doc.clientEmail || null,
      fromName: r.sourceFromName || null,
      to: doc.toEmails || [],
      cc: doc.ccEmails || [],
      receivedAt: r.sourceEmailReceivedAt || doc.emailArrivedTime || null,
      bodyText,
      bodyHtml,
      // Records ingested before the original mail was stored only have the extracted job description.
      hasOriginal: Boolean(bodyText || rawHtml),
      fallbackDescription: bodyText || rawHtml ? null : r.description || null,
    };
  }

  /** POST /api/v1/requirements */
  async create(dto: CreateRequirementDto, currentUser: any) {
    const orgId = requireOrgId(currentUser);
    const performedBy = currentUser.id || currentUser.userId ? new Types.ObjectId(currentUser.id || currentUser.userId) : new Types.ObjectId();

    const clientJdId = (dto as any).sourceClientJdId || null;
    const createdAt = new Date();
    const clientName = (dto.clientName || dto.client || '').trim();
    let clientId: Types.ObjectId | null = dto.clientId && Types.ObjectId.isValid(dto.clientId)
      ? new Types.ObjectId(dto.clientId)
      : null;
    if (!clientId && clientName) {
      const found = await this.clientModel.findOne({ orgId, clientName: { $regex: new RegExp(`^${clientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, deletedAt: null }).exec();
      if (found) {
        clientId = found._id as Types.ObjectId;
      } else {
        const anyClient = await this.clientModel.findOne({ orgId, deletedAt: null }).exec();
        clientId = anyClient ? (anyClient._id as Types.ObjectId) : new Types.ObjectId();
      }
    }
    if (!clientId) {
      throw new BadRequestException('A valid clientId or client name is required');
    }
    const resolvedClient = await this.clientModel.findById(clientId).exec();
    const resolvedName = resolvedClient?.clientName || clientName || 'Client';

    const assignedLeadId = dto.assignedLeadId && Types.ObjectId.isValid(dto.assignedLeadId)
      ? new Types.ObjectId(dto.assignedLeadId)
      : null;

    const assignedRecruiterIds = (dto.assignedRecruiterIds || [])
      .filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id));

    const emailDefaults = getClientEmailDefaults(resolvedName);
    const clientEmail = dto.clientEmail || (emailDefaults ? emailDefaults.requirement.from : null);
    const toEmails = sanitizeEmailList(dto.toEmails?.length ? dto.toEmails : (emailDefaults ? emailDefaults.requirement.to : []));
    const ccEmails = sanitizeEmailList(dto.ccEmails?.length ? dto.ccEmails : (emailDefaults ? emailDefaults.requirement.cc : []));

    const newReq = new this.requirementModel({
      orgId,
      title: dto.title.trim(),
      clientId,
      clientName: resolvedName,
      priority: dto.priority || 'Medium',
      status: dto.status || 'Open',
      assignmentStatus: assignedRecruiterIds.length > 0 ? 'Assigned' : 'Unassigned',
      openings: dto.openings || 1,
      budgetRange: dto.budgetRange || { min: 0, max: 0, currency: 'INR' },
      assignedLeadId,
      assignedRecruiterIds,
      skillsRequired: dto.skillsRequired || dto.skills || [],
      experienceRange: dto.experienceRange || { min: 0, max: 0 },
      location: dto.location || 'Hybrid',
      clientEmail,
      toEmails,
      ccEmails,
      sourceClientJdId: clientJdId,
      emailArrivedTime: createdAt,
      firstDetectedAt: createdAt,
      lastUpdatedAt: createdAt,
      sourceEmailReceivedAt: createdAt,
      lastSeenAt: createdAt,
    });

    const saved = await this.saveNewRequirement(newReq, createdAt);

    await this.logHistory(
      orgId,
      saved._id as Types.ObjectId,
      'CREATE',
      performedBy,
      {},
      saved.toObject(),
      'Requirement created',
    );

    return this.sanitizeRequirement(saved);
  }

  /** PUT /api/v1/requirements/:id */
  async update(id: string, dto: UpdateRequirementDto, currentUser: any) {
    const doc = await this.loadRequirementForUser(id, currentUser);

    const previousValue = doc.toObject();
    const performedBy = currentUser.id || currentUser.userId ? new Types.ObjectId(currentUser.id || currentUser.userId) : new Types.ObjectId();

    const wasHold = doc.status === 'On Hold' || doc.status === 'Hold';
    const isChangingStatusFromHold = dto.status && dto.status !== 'Hold' && dto.status !== 'On Hold';
    if (wasHold && !isChangingStatusFromHold) {
      const isAttemptingEdit = dto.title !== undefined || dto.clientName !== undefined || dto.clientId !== undefined || dto.openings !== undefined || dto.skillsRequired !== undefined || dto.location !== undefined || dto.assignedLeadId !== undefined || dto.assignedRecruiterIds !== undefined;
      if (isAttemptingEdit) {
        throw new BadRequestException(`Cannot edit requirement '${doc.reqCode || id}' while it is On Hold. Reopen it first.`);
      }
    }

    const isAttemptingAssignment = dto.assignedLeadId !== undefined || dto.assignedRecruiterIds !== undefined;
    if (wasHold && !isChangingStatusFromHold && isAttemptingAssignment) {
      throw new BadRequestException(`Cannot assign recruiters or lead to requirement '${doc.reqCode || id}' while it is On Hold`);
    }

    if (dto.title !== undefined) doc.title = dto.title.trim();
    const resolvedClientName = dto.clientName || dto.client;
    if (resolvedClientName !== undefined) doc.clientName = resolvedClientName.trim();
    if (dto.clientId !== undefined && Types.ObjectId.isValid(dto.clientId)) {
      doc.clientId = new Types.ObjectId(dto.clientId);
    }
    if (dto.priority !== undefined) doc.priority = dto.priority;
    if (dto.status !== undefined) {
      let normStatus = dto.status;
      if (normStatus === 'Hold') normStatus = 'On Hold';
      if (normStatus === 'Reopen') normStatus = 'Open';
      doc.status = normStatus;
    }
    if (dto.assignmentStatus !== undefined) doc.assignmentStatus = dto.assignmentStatus;
    if (dto.openings !== undefined) doc.openings = dto.openings;
    if (dto.placedCount !== undefined) doc.placedCount = dto.placedCount;
    if (dto.budgetRange !== undefined) {
      doc.budgetRange = dto.budgetRange;
    } else if (dto.budget !== undefined) {
      const match = String(dto.budget).replace(/,/g, '').match(/\d+(?:\.\d+)?/);
      if (match) {
        const val = Number(match[0]);
        doc.budgetRange = { min: val, max: val, currency: 'INR' };
      }
    }
    const resolvedSkills = dto.skillsRequired || dto.skills;
    if (resolvedSkills !== undefined) doc.skillsRequired = resolvedSkills;
    if (dto.experienceRange !== undefined) doc.experienceRange = dto.experienceRange;
    if (dto.location !== undefined) doc.location = dto.location;
    if (dto.clientEmail !== undefined) doc.clientEmail = dto.clientEmail;
    if (dto.toEmails !== undefined) doc.toEmails = sanitizeEmailList(dto.toEmails);
    if (dto.ccEmails !== undefined) doc.ccEmails = sanitizeEmailList(dto.ccEmails);

    const emailDefaults = getClientEmailDefaults(doc.clientName);
    if (emailDefaults && (!doc.toEmails || doc.toEmails.length === 0)) {
      doc.toEmails = sanitizeEmailList(emailDefaults.requirement.to);
    }
    if (emailDefaults && (!doc.ccEmails || doc.ccEmails.length === 0)) {
      doc.ccEmails = sanitizeEmailList(emailDefaults.requirement.cc);
    }
    if (emailDefaults && !doc.clientEmail) {
      doc.clientEmail = emailDefaults.requirement.from;
    }

    if (dto.assignedLeadId !== undefined) {
      doc.assignedLeadId = dto.assignedLeadId && Types.ObjectId.isValid(dto.assignedLeadId)
        ? new Types.ObjectId(dto.assignedLeadId)
        : null;
    }

    if (dto.assignedRecruiterIds !== undefined) {
      doc.assignedRecruiterIds = (dto.assignedRecruiterIds || [])
        .filter(recId => Types.ObjectId.isValid(recId))
        .map(recId => new Types.ObjectId(recId));
      doc.assignmentStatus = doc.assignedRecruiterIds.length > 0 ? 'Assigned' : 'Unassigned';
    }

    (doc as any).lastUpdatedAt = new Date();

    const updated = await doc.save();

    await this.logHistory(
      doc.orgId,
      doc._id as Types.ObjectId,
      'UPDATE',
      performedBy,
      previousValue,
      updated.toObject(),
      'Requirement updated',
    );

    return this.sanitizeRequirement(updated);
  }

  /** PUT /api/v1/requirements/bulk */
  async bulkUpdate(items: any[], currentUser: any) {
    if (!Array.isArray(items)) {
      throw new BadRequestException('Payload must be an array of requirements');
    }

    const updatedItems = [];
    for (const item of items) {
      const id = item.id || item._id || item.reqCode;
      if (id) {
        try {
          const mapped: any = {
            ...item,
            clientName: item.clientName || item.client,
            skillsRequired: item.skillsRequired || item.skills,
            status: item.status === 'Active' ? 'In Progress' : item.status,
            placedCount: item.placedCount ?? item.placed,
          };
          const updated = await this.update(id, mapped, currentUser);
          updatedItems.push(updated);
        } catch {
          // ignore single item bulk failure
        }
      }
    }
    return updatedItems;
  }

  /** POST /api/v1/requirements/:id/assign */
  async assign(id: string, dto: AssignRequirementDto, currentUser: any) {
    const doc = await this.loadRequirementForUser(id, currentUser);

    if (doc.status === 'On Hold' || doc.status === 'Hold') {
      throw new BadRequestException(`Cannot assign recruiters or lead to requirement '${doc.reqCode || id}' while it is On Hold`);
    }

    const previousValue = doc.toObject();

    const userRole = String(currentUser?.role || '').toLowerCase();
    if (userRole === 'recruiter') {
      if (dto.leadId) {
        throw new ForbiddenException('Recruiters cannot assign team leads to requirements');
      }

      // Resolve the current recruiter's Mongo ObjectId
      let currentMongoId: Types.ObjectId | null = null;
      const cId = currentUser?.id || currentUser?.userId;
      if (cId && Types.ObjectId.isValid(cId)) {
        currentMongoId = new Types.ObjectId(cId);
      } else {
        const dbMe = await this.userModel.findOne({
          $or: [
            ...(cId ? [{ userId: cId }] : []),
            ...(currentUser?.email ? [{ email: currentUser.email }] : []),
          ],
        }).exec();
        if (dbMe) {
          currentMongoId = dbMe._id as Types.ObjectId;
        }
      }

      if (!currentMongoId) {
        throw new BadRequestException('Current recruiter identity could not be verified');
      }

      const alreadyAssigned = (doc.assignedRecruiterIds || []).some(
        (rid) => rid && rid.toString() === currentMongoId!.toString(),
      );

      const requested = (dto.recruiterIds || []).map((v) => String(v || '').trim()).filter(Boolean);
      let resolvedTargets: Types.ObjectId[] = [];

      if (requested.length > 0) {
        resolvedTargets = await this.resolveUserObjectIds(requested, currentUser);
        if (resolvedTargets.length !== requested.length) {
          throw new BadRequestException('The selected recruiter could not be found. Choose a recruiter from the list.');
        }
      }

      // Unassigned: recruiters may only self-assign
      if (!alreadyAssigned) {
        const isOnlySelf =
          resolvedTargets.length === 0 ||
          (resolvedTargets.length > 0 && resolvedTargets.every((rid) => rid.toString() === currentMongoId!.toString()));
        if (!isOnlySelf) {
          throw new ForbiddenException('Recruiters can only assign requirements to themselves');
        }
        resolvedTargets = [currentMongoId];
      } else {
        // Already assigned: allow reassign to self and/or other recruiters
        if (resolvedTargets.length === 0) {
          throw new BadRequestException('Select at least one recruiter to reassign this requirement');
        }
      }

      doc.assignedRecruiterIds = resolvedTargets;
      doc.assignmentStatus = resolvedTargets.length > 0 ? 'Assigned' : 'Unassigned';
      doc.status = resolvedTargets.length > 0 ? 'Assigned' : 'Open';

      const updated = await doc.save();

      const isSelfOnly =
        resolvedTargets.length === 1 && resolvedTargets[0].toString() === currentMongoId.toString();
      const historyMsg = alreadyAssigned
        ? (isSelfOnly ? 'Recruiter reassigned requirement (kept self)' : 'Recruiter reassigned requirement to peers')
        : 'Recruiter self-assigned requirement';

      await this.logHistory(
        doc.orgId,
        doc._id as Types.ObjectId,
        'ASSIGN',
        currentMongoId,
        previousValue,
        updated.toObject(),
        historyMsg,
      );

      const notifyIds = new Set(resolvedTargets.map((id) => id.toString()));
      for (const targetId of Array.from(notifyIds)) {
        try {
          await this.notificationsService.createNotification({
            orgId: doc.orgId,
            userId: new Types.ObjectId(targetId),
            type: 'requirement_assigned',
            title: alreadyAssigned ? 'Requirement Reassigned' : 'Requirement Self-Assigned',
            message: alreadyAssigned
              ? `Requirement (${doc.reqCode || doc.title || 'Requirement'}) was reassigned to you.`
              : `You self-assigned requirement (${doc.reqCode || doc.title || 'Requirement'}).`,
            entityId: doc._id as Types.ObjectId,
            entityType: 'requirement',
          });
        } catch (err) {
          // Notification failure should not abort assignment
        }
      }

      return this.sanitizeRequirement(updated);
    }

    const performedBy = currentUser.id || currentUser.userId ? new Types.ObjectId(currentUser.id || currentUser.userId) : new Types.ObjectId();

    if (dto.leadId !== undefined) {
      const leads = await this.resolveUserObjectIds(dto.leadId ? [dto.leadId] : [], currentUser);
      doc.assignedLeadId = leads.length > 0 ? leads[0] : null;
    }

    if (dto.recruiterIds !== undefined) {
      const requested = (dto.recruiterIds || []).map((value) => String(value || '').trim()).filter(Boolean);
      const resolvedRecruiters = await this.resolveUserObjectIds(requested, currentUser);
      if (requested.length > 0 && resolvedRecruiters.length !== requested.length) {
        throw new BadRequestException('The selected recruiter could not be found. Choose a recruiter from the list.');
      }
      doc.assignedRecruiterIds = resolvedRecruiters;
    }

    doc.assignmentStatus = (doc.assignedRecruiterIds || []).length > 0 || doc.assignedLeadId ? 'Assigned' : 'Unassigned';
    if (doc.assignmentStatus === 'Assigned') {
      doc.status = 'Assigned';
    } else if (doc.assignmentStatus === 'Unassigned' && (doc.status === 'Assigned' || doc.status === 'In Progress')) {
      doc.status = 'Open';
    }

    const updated = await doc.save();

    await this.logHistory(
      doc.orgId,
      doc._id as Types.ObjectId,
      'ASSIGN',
      performedBy,
      previousValue,
      updated.toObject(),
      'Recruiters/Lead assigned to requirement',
    );

    // Create persistent notifications for assigned users in MongoDB
    const notifyUsers = new Set<string>();
    (doc.assignedRecruiterIds || []).forEach(rId => notifyUsers.add(String(rId)));
    if (doc.assignedLeadId) notifyUsers.add(String(doc.assignedLeadId));

    for (const targetUserIdStr of Array.from(notifyUsers)) {
      try {
        await this.notificationsService.createNotification({
          orgId: doc.orgId,
          userId: new Types.ObjectId(targetUserIdStr),
          type: 'requirement_assigned',
          title: 'Requirement Assigned',
          message: `A requirement (${doc.reqCode || doc.title || 'Requirement'}) has been assigned to you.`,
          entityId: doc._id as Types.ObjectId,
          entityType: 'requirement',
        });
      } catch (err) {
        // Log & swallow error so assignment always succeeds
      }
    }

    return this.sanitizeRequirement(updated);
  }

  /** POST /api/v1/requirements/:id/revoke */
  async revoke(id: string, dto: RevokeRequirementDto, currentUser: any) {
    const doc = await this.loadRequirementForUser(id, currentUser);

    const previousValue = doc.toObject();
    const performedBy = currentUser.id || currentUser.userId ? new Types.ObjectId(currentUser.id || currentUser.userId) : new Types.ObjectId();

    const role = String(currentUser.role || '').toLowerCase();
    const isDirectRevoke = ['superadmin', 'admin', 'devteam', 'lead'].includes(role);

    if (isDirectRevoke) {
      // Detach recruiters and revert to Unassigned; the lead keeps visibility via assignedLeadId.
      doc.assignedRecruiterIds = [];
      doc.assignmentStatus = 'Unassigned';
      doc.status = 'Open';
      doc.revokeRequested = false;
      doc.revokeReason = dto.reason;
    } else {
      doc.revokeRequested = true;
      doc.revokeReason = dto.reason;
      doc.status = 'On Hold';
    }

    const updated = await doc.save();

    await this.logHistory(
      doc.orgId,
      doc._id as Types.ObjectId,
      'REVOKE',
      performedBy,
      previousValue,
      updated.toObject(),
      isDirectRevoke ? `Requirement revoked and unassigned: ${dto.reason}` : `Revoke requested: ${dto.reason}`,
    );

    return this.sanitizeRequirement(updated);
  }

  /** DELETE /api/v1/requirements/:id */
  async softDelete(id: string, currentUser: any) {
    const doc = await this.loadRequirementForUser(id, currentUser);
    const targetId = doc._id.toString();

    const deleted = await this.requirementRepository.softDelete(targetId, currentUser);
    const performedBy = currentUser.id || currentUser.userId ? new Types.ObjectId(currentUser.id || currentUser.userId) : new Types.ObjectId();

    await this.logHistory(
      deleted.orgId,
      deleted._id as Types.ObjectId,
      'DELETE',
      performedBy,
      deleted.toObject(),
      {},
      'Requirement soft deleted',
    );

    return { message: `Requirement '${deleted.reqCode}' soft-deleted successfully` };
  }

  /** GET /api/v1/workspace */
  async getWorkspacePayload(currentUser: any) {
    const requirements = await this.findAll(currentUser);

    const mappedRequirements = requirements.map((r: any) => ({
      id: r.displayId || r.id,
      reqCode: r.reqCode,
      sourceClientJdId: r.sourceClientJdId || null,
      title: r.title,
      client: r.clientName || r.client || '',
      priority: r.priority || 'Medium',
      status: r.status === 'In Progress' || r.status === 'Assigned' ? 'Active' : r.status,
      submissions: r.submissionsCount || 0,
      interviews: r.interviewsCount || 0,
      placed: r.placedCount || 0,
      dueDate: r.dueDate || '',
      openings: r.openings || 1,
      budget: r.budgetRange ? `${r.budgetRange.currency || 'INR'} ${r.budgetRange.min}-${r.budgetRange.max}` : undefined,
      skills: r.skillsRequired || r.skills || [],
      location: r.location,
      assignmentStatus: r.assignmentStatus,
      revokeRequested: r.revokeRequested,
      revokeReason: r.revokeReason,
      emailArrivedTime: r.emailArrivedTime,
      clientEmail: r.clientEmail || (r.toEmails && r.toEmails.length > 0 ? r.toEmails[0] : (r.clientName && r.clientName.includes('@') ? r.clientName : undefined)),
      toEmails: r.toEmails || [],
      ccEmails: r.ccEmails || [],
    }));

    const totalOpenings = mappedRequirements.reduce((acc, curr) => acc + (curr.openings || 1), 0);
    const totalPlaced = mappedRequirements.reduce((acc, curr) => acc + (curr.placed || 0), 0);
    const activeReqs = mappedRequirements.filter((r) => r.status === 'Open' || r.status === 'Active').length;

    return {
      user: {
        id: currentUser.id || currentUser.userId,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
        orgId: currentUser.orgId,
      },
      requirements: mappedRequirements,
      submissions: [],
      interviews: [],
      recruiters: [],
      activityLogs: [],
      stats: {
        totalRequirements: mappedRequirements.length,
        activeRequirements: activeReqs,
        totalOpenings,
        totalPlaced,
      },
    };
  }

  getSyncStatus() {
    return this.syncState;
  }

  /**
   * Locate the Python auto mail extraction pipeline.
   * MAIL_EXTRACTION_DIR / MAIL_EXTRACTION_PYTHON override; otherwise the known
   * folders under "<repo>/Mail extraction" are probed.
   */
  private resolveMailExtractionRuntime(): { dir: string; pythonExe: string; scriptPath: string } | null {
    const repoRoot = path.resolve(process.cwd(), '..');
    const candidates = [
      process.env.MAIL_EXTRACTION_DIR,
      path.join(repoRoot, 'Mail extraction', 'devloper', 'devloper'),
      path.join(repoRoot, 'Mail extraction', 'Auto_email_extraction'),
      path.join(process.cwd(), 'Mail extraction', 'devloper', 'devloper'),
    ].filter((p): p is string => !!p && p.trim().length > 0);

    for (const dir of candidates) {
      const scriptPath = path.join(dir, 'scripts', 'sync_to_backend.py');
      if (!fs.existsSync(scriptPath)) continue;
      const pythonCandidates = [
        process.env.MAIL_EXTRACTION_PYTHON,
        path.join(dir, '.venv', 'Scripts', 'python.exe'),
        path.join(dir, '.venv', 'bin', 'python'),
      ].filter((p): p is string => !!p && p.trim().length > 0);
      const pythonExe = pythonCandidates.find((p) => fs.existsSync(p));
      if (pythonExe) return { dir, pythonExe, scriptPath };
    }
    return null;
  }

  /**
   * Lease on the mailbox poll stored in MongoDB, shared by every backend instance. Expires on
   * its own (ttlMinutes) so a crashed instance can never block extraction permanently.
   */
  private async acquireMailboxLease(ttlMinutes: number): Promise<{ release: () => Promise<void> } | null> {
    const locks = this.requirementModel.db.collection<{ _id: string; owner: string; expiresAt: Date }>('job_locks');
    const owner = `${require('os').hostname()}:${process.pid}:${Date.now()}`;
    const now = new Date();
    try {
      const res = await locks.findOneAndUpdate(
        { _id: 'mail-extraction', expiresAt: { $lt: now } },
        { $set: { owner, expiresAt: new Date(now.getTime() + ttlMinutes * 60 * 1000) } },
        { upsert: true, returnDocument: 'after' },
      );
      const doc: any = (res as any)?.value !== undefined ? (res as any).value : res;
      if (!doc || doc.owner !== owner) return null;
    } catch (err: any) {
      if (err?.code === 11000) return null; // lease held by another live instance
      throw err;
    }
    return {
      release: async () => {
        await locks.deleteOne({ _id: 'mail-extraction', owner }).catch(() => undefined);
      },
    };
  }

  /** Spawn sync_to_backend.py in the background and track its progress in syncState. */
  private async runMailExtraction(
    args: string[],
    label: string,
    startMessage: string,
    onDone: (parsed: any) => string,
  ): Promise<{ status: string; message: string }> {
    if (this.syncState.status === 'running') {
      return { status: 'running', message: 'Mail extraction already in progress' };
    }
    const previousStatus = this.syncState.status;
    this.syncState.status = 'running'; // claimed before the first await: no overlapping runs in this process

    const timeoutMinutes = Math.max(1, parseInt(process.env.MAIL_EXTRACTION_TIMEOUT_MINUTES || '20', 10) || 20);
    // Cross-instance lease: only one backend process may poll the mailbox at a time.
    let lease: { release: () => Promise<void> } | null = null;
    try {
      lease = await this.acquireMailboxLease(timeoutMinutes + 1);
    } catch (err: any) {
      this.logger.error(`Could not acquire mailbox lease: ${err?.message}`);
    }
    if (!lease) {
      this.syncState.status = previousStatus;
      return { status: 'running', message: 'Mail extraction is already running in another backend instance' };
    }

    const runtime = this.resolveMailExtractionRuntime();
    if (!runtime) {
      await lease.release();
      this.syncState.status = 'failed';
      this.syncState.error =
        'Mail extraction pipeline not found. Set MAIL_EXTRACTION_DIR to the folder containing scripts/sync_to_backend.py and its .venv';
      this.logger.error(this.syncState.error);
      return { status: 'failed', message: this.syncState.error };
    }

    this.syncState.status = 'running';
    this.syncState.error = null;
    this.syncState.totalProcessed = 0;
    this.syncState.totalSynced = 0;
    this.syncState.totalDeduped = 0;
    this.syncState.message = startMessage;

    // The pipeline posts each extracted requirement back to this backend's ingest endpoint.
    const port = process.env.PORT || '3001';
    const automationKey = String(process.env.INTERNAL_AUTOMATION_API_KEY || '').trim();
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      METAFORGE_MODE: 'api',
      METAFORGE_API_URL: process.env.MAIL_EXTRACTION_BACKEND_URL || `http://127.0.0.1:${port}`,
      METAFORGE_REQUIREMENTS_ENDPOINT: 'api/v1/requirements/ingest-email',
      PYTHONIOENCODING: 'utf-8',
      PYTHONUNBUFFERED: '1',
    };
    if (automationKey) env.METAFORGE_API_KEY = automationKey;

    this.logger.log(`[${label}] Spawning ${runtime.scriptPath} ${args.join(' ')}`);
    const proc = spawn(runtime.pythonExe, [runtime.scriptPath, ...args], { cwd: runtime.dir, env });

    // Keep only the tail of the output; the pipeline logs verbosely.
    const MAX_BUFFER = 64 * 1024;
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (chunk) => {
      stdout = (stdout + chunk.toString()).slice(-MAX_BUFFER);
    });
    proc.stderr.on('data', (chunk) => {
      stderr = (stderr + chunk.toString()).slice(-MAX_BUFFER);
    });

    const activeLease = lease;
    let timedOut = false;
    const killTimer = setTimeout(() => {
      timedOut = true;
      proc.kill();
    }, timeoutMinutes * 60 * 1000);

    proc.on('close', (code) => {
      clearTimeout(killTimer);
      void activeLease.release();
      this.syncState.lastSyncedAt = new Date();
      if (code === 0) {
        let parsed: any = null;
        const match = stdout.match(/SYNC_RESULT_JSON:(.+)/);
        if (match) {
          try {
            parsed = JSON.parse(match[1]);
          } catch {
            parsed = null;
          }
        }
        this.syncState.status = 'completed';
        this.syncState.totalProcessed = parsed?.totalFetched || 0;
        // Requirements created through ingest-email during this run are counted by the backend itself.
        this.syncState.totalSynced = Math.max(this.syncState.totalSynced, parsed?.totalSynced || 0);
        this.syncState.message = onDone(parsed);
        const rec = parsed?.reconcile;
        if (parsed?.aiUnavailable) {
          // Mail is held, not lost: the pipeline retries it every run until the AI model is reachable again.
          this.syncState.status = 'waiting';
          this.syncState.error = `AI extraction unavailable: ${parsed.aiUnavailable}`;
          this.syncState.message += ' New requirement mail is on hold until AI extraction is available again (nothing saved from guesses).';
          this.logger.error(`[${label}] AI extraction unavailable, mail held for retry: ${parsed.aiUnavailable}`);
        } else if (rec && !rec.skipped && !rec.error) {
          const recovered = (rec.recovered || []).length;
          const still: string[] = rec.stillMissing || [];
          this.syncState.message += ` Reconciled ${rec.checked} listed requirement ID(s)` +
            (recovered ? `, recovered ${recovered}` : '') +
            (still.length ? `, STILL MISSING: ${still.join(', ')} (queued for review)` : ', none missing') + '.';
          if (still.length) this.logger.error(`[${label}] Listed requirements not in the app: ${still.join(', ')}`);
        } else if (rec?.error) {
          this.syncState.message += ` Reconcile failed: ${rec.error}`;
        }
        this.logger.log(`[${label}] ${this.syncState.message}`);
      } else {
        const tail = (stderr || stdout).trim().split(/\r?\n/).slice(-15).join('\n');
        this.syncState.status = 'failed';
        this.syncState.error = timedOut
          ? `Timed out after ${timeoutMinutes} minute(s)`
          : tail || `Process exited with code ${code}`;
        this.syncState.message = `${label} failed: ${this.syncState.error}`;
        this.logger.error(this.syncState.message);
      }
    });

    proc.on('error', (err) => {
      clearTimeout(killTimer);
      void activeLease.release();
      this.syncState.status = 'failed';
      this.syncState.error = err.message;
      this.syncState.message = `Failed to start mail extraction: ${err.message}`;
      this.logger.error(this.syncState.message);
    });

    return { status: 'running', message: `${label} started. Processing in background...` };
  }

  /** Run the Outlook auto-extraction pipeline for mail received since the last watermark */
  async syncEmails(limit = 25): Promise<{ status: string; message: string; data?: any }> {
    return this.runMailExtraction(
      ['--limit', String(limit)],
      'Mail extraction',
      `Connecting to Microsoft 365 and extracting requirements (limit ${limit})...`,
      () =>
        `Mail extraction completed. Examined ${this.syncState.totalProcessed} email(s), ` +
        `created ${this.syncState.totalSynced} and refreshed ${this.syncState.totalDeduped} requirement(s).`,
    );
  }

  /** Run historical extraction backfill (yesterday and day before yesterday) */
  async backfillHistorical(opts?: { days?: number; force?: boolean; limit?: number }): Promise<{ status: string; message: string; data?: any }> {
    const days = opts?.days || parseInt(process.env.MAIL_EXTRACTION_HISTORICAL_DAYS || '2', 10);
    const tzName = process.env.MAIL_EXTRACTION_TIMEZONE || 'Asia/Kolkata';
    const args = ['--mode', 'historical', '--days', String(days), '--timezone', tzName];
    const limit = opts?.limit || parseInt(process.env.MAIL_EXTRACTION_HISTORICAL_LIMIT || '200', 10);
    args.push('--limit', String(limit));
    if (opts?.force) args.push('--force');

    return this.runMailExtraction(
      args,
      'Historical mail backfill',
      `Connecting to Microsoft 365 and extracting historical requirements (past ${days} day(s))...`,
      (parsed) =>
        `Historical mail backfill completed. Window: [${parsed?.startIso || ''} .. ${parsed?.endIso || ''}]. ` +
        `Examined ${this.syncState.totalProcessed} email(s), created ${this.syncState.totalSynced} requirement(s).`,
    );
  }

  /** POST /api/v1/requirements/ingest-email — Outlook extraction pipeline */
  async ingestFromEmail(payload: Record<string, any>) {
    // Defense in depth: the pipeline already refuses internal mail, but the API enforces it too.
    const sourceSender = firstText(payload.source_sender_email, payload.sender_email, payload.from_email);
    if (isInternalSender(sourceSender)) {
      this.logger.warn(`Rejected ingest from internal sender ${sourceSender} (subject: ${firstText(payload.subject)})`);
      return { data: { ignored: true, reason: 'Internal sender: internal mail cannot create or update requirements' } };
    }

    if (payload.status_update_only) {
      return this.applyEmailStatusUpdate(payload);
    }

    // A record is never created from a title invented from the email subject.
    const title = firstText(payload.job_title, payload.title, payload.role);
    if (!title) {
      return { data: { ignored: true, reason: 'A job title is required; the email subject is not used as a title' } };
    }
    const clientName = firstText(payload.requirement_from, payload.client_name, payload.client, payload.clientName);
    const sourceSubject = firstText(payload.subject, payload.email_subject) || '';

    // Phase 7: Explicitly reject synthetic, mock, or test fixtures from production ingestion
    if (
      payload.is_test ||
      payload.is_synthetic ||
      payload.is_dummy ||
      payload.isTest ||
      payload.isSynthetic ||
      /^(?:\[\s*(?:test|mock|synthetic|demo|sample|fixture)\s*\]|synthetic|mock|dummy|sample\s+requirement\s+for\s+testing)/i.test(sourceSubject) ||
      /^(?:\[\s*(?:test|mock|synthetic|demo|sample|fixture)\s*\]|synthetic|mock|dummy|sample\s+requirement\s+for\s+testing)/i.test(title) ||
      /^(?:test\s+client|mock\s+client|sample\s+vendor|synthetic\s+org)/i.test(clientName)
    ) {
      return { data: { ignored: true, reason: 'Synthetic or test requirement rejected from production ingestion' } };
    }

    if (!title || !clientName) {
      return { data: { ignored: true, reason: 'A job title and client name are required' } };
    }

    const sourceClientJdId = firstText(payload.client_jd_id, payload.clientJdId, payload.req_id, payload.client_req_id) || null;
    const sourceMessageId = firstText(payload.graph_message_id, payload.graphMessageId, payload.messageId) || null;
    const idempotencyKey = firstText(payload.idempotencyKey, payload.idempotency_key) || null;

    const lockKey = idempotencyKey
      ? `idem:${idempotencyKey}`
      : `${clientName.toLowerCase().trim()}:${sourceClientJdId ? `jd:${sourceClientJdId.toLowerCase().trim()}` : `msg:${sourceMessageId || ''}:${title.toLowerCase().trim()}`}`;

    return this.withIngestLock(lockKey, async () => {
      return this.doIngestFromEmail(payload, title, clientName, sourceClientJdId, sourceMessageId, idempotencyKey);
    });
  }

  /**
   * Reconciliation support: for client requirement IDs listed in emails, report which exist as
   * live requirements, which a user deliberately deleted, and which are missing entirely.
   */
  async clientIdPresence(ids: string[]) {
    const wanted = [...new Set(ids.map((i) => String(i || '').trim()).filter(Boolean))].slice(0, 2000);
    const rows = await this.requirementModel
      .find({ sourceClientJdId: { $in: wanted } }, { sourceClientJdId: 1, deletedAt: 1, reqCode: 1 })
      .setOptions({ includeDeleted: true })
      .lean()
      .exec();
    const live = new Set<string>();
    const deleted = new Set<string>();
    for (const r of rows as any[]) (r.deletedAt ? deleted : live).add(String(r.sourceClientJdId));
    return {
      data: {
        live: [...live],
        deleted: [...deleted].filter((i) => !live.has(i)),
        missing: wanted.filter((i) => !live.has(i) && !deleted.has(i)),
      },
    };
  }

  /**
   * Status-only client instruction (hold / stop sourcing / reopen / resume / close) for an
   * EXISTING requirement. Never creates, revives or re-dates a record; returns matched=false
   * when the requirement cannot be identified unambiguously, so the pipeline queues it for review.
   */
  private async applyEmailStatusUpdate(payload: Record<string, any>) {
    const newStatus = mapMailStatus(payload.job_status ?? payload.status);
    if (!newStatus) {
      return { data: { matched: false, reason: 'Unrecognised status instruction' } };
    }
    const orgUser = await this.userModel.findOne({ orgId: { $exists: true, $ne: null } }).select('_id orgId').exec();
    const orgId = orgUser?.orgId
      ? new Types.ObjectId(orgUser.orgId.toString())
      : new Types.ObjectId('6ab4f38ff2e0e1823c038948');
    const performedBy = (orgUser?._id as Types.ObjectId) || orgId;

    const clientName = firstText(payload.requirement_from, payload.client_name, payload.client, payload.clientName);
    const client = clientName
      ? await this.clientModel.findOne({ orgId, deletedAt: null, clientName: { $regex: new RegExp(`^${escapeRegex(clientName)}$`, 'i') } }).exec()
      : null;
    const jdId = normalizeJdId(firstText(payload.client_jd_id, payload.clientJdId, payload.req_id));
    const conversationId = firstText(payload.conversation_id, payload.conversationId);
    const subject = firstText(payload.subject, payload.email_subject);

    const live: Record<string, any> = { orgId, deletedAt: null };
    if (client) live.clientId = client._id;
    let candidates: RequirementDocument[] = [];
    if (client && jdId) {
      candidates = await this.requirementModel
        .find({ ...live, sourceClientJdId: { $regex: new RegExp(`^${escapeRegex(jdId)}$`, 'i') } })
        .exec();
    }
    if (candidates.length === 0 && conversationId) {
      candidates = await this.requirementModel.find({ ...live, conversationId }).exec();
    }
    if (candidates.length === 0 && client && subject) {
      const wanted = normalizeSubject(subject);
      const pool = await this.requirementModel.find({ ...live, sourceSubject: { $ne: null } }).exec();
      candidates = pool.filter((r) => wanted && normalizeSubject(r.sourceSubject || '') === wanted);
    }
    if (candidates.length !== 1) {
      return {
        data: {
          matched: false,
          reason: candidates.length ? 'Ambiguous: several requirements match this thread' : 'No existing requirement matches',
          candidates: candidates.map((c) => c.reqCode),
        },
      };
    }

    const doc = candidates[0];
    const isResume = newStatus === 'Open';
    const pausedOrClosed = ['Hold', 'On Hold', 'Closed'].includes(doc.status);
    const reason = firstText(payload.status_reason) || String(payload.job_status || '');
    const seenAt = parseDate(payload.receivedDateTime) || new Date();
    const lastSeen = (doc as any).lastSeenAt ? new Date((doc as any).lastSeenAt) : null;
    const isStale = !!(lastSeen && seenAt.getTime() < lastSeen.getTime());
    const changed = !isStale && doc.status !== newStatus && (!isResume || pausedOrClosed);
    if (changed) {
      const oldStatus = doc.status;
      doc.status = newStatus;
      (doc as any).lastUpdatedAt = new Date();
      await this.logHistory(
        orgId,
        doc._id as Types.ObjectId,
        'EMAIL_STATUS_UPDATE',
        performedBy,
        { status: oldStatus },
        { status: newStatus, statusReason: reason, sourceMessageId: firstText(payload.graphMessageId, payload.graph_message_id) },
        `Client email set status to ${newStatus} (${reason}) from "${subject}"`,
      );
    }
    // Ordering and identity fields (reqCode, firstDetectedAt, emailArrivedTime) are left untouched.
    if (!isStale) (doc as any).lastSeenAt = seenAt;
    await doc.save();
    return {
      data: { matched: true, requirementId: doc._id.toString(), reqCode: doc.reqCode, status: doc.status, changed },
    };
  }

  private async withIngestLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existingLock = this.ingestMutex.get(key) || Promise.resolve();
    let resolveLock!: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });
    this.ingestMutex.set(key, existingLock.then(() => lockPromise));

    try {
      await existingLock;
      return await fn();
    } finally {
      resolveLock();
      if (this.ingestMutex.get(key) === lockPromise) {
        this.ingestMutex.delete(key);
      }
    }
  }

  private async doIngestFromEmail(
    payload: Record<string, any>,
    title: string,
    clientName: string,
    sourceClientJdId: string | null,
    sourceMessageId: string | null,
    idempotencyKey: string | null = null,
  ) {
    const orgUser = await this.userModel.findOne({ orgId: { $exists: true, $ne: null } }).select('_id orgId').exec();
    const orgId = orgUser?.orgId
      ? new Types.ObjectId(orgUser.orgId.toString())
      : new Types.ObjectId('6ab4f38ff2e0e1823c038948');
    const performedBy = (orgUser?._id as Types.ObjectId) || orgId;

    const conversationId = firstText(payload.conversation_id, payload.conversationId) || null;
    const inReplyTo = firstText(payload.in_reply_to, payload.inReplyTo, payload.internet_message_id, payload.internetMessageId) || null;

    const mandatorySkills = uniqueStrings([
      ...asStringList(payload.mandatory_skills),
      ...asStringList(payload.mandatorySkills),
    ]);
    const skills = uniqueStrings([
      ...mandatorySkills,
      ...asStringList(payload.skills),
      ...asStringList(payload.skillsRequired),
      ...asStringList(payload.soft_skills),
    ]);
    const experience = parseExperience(firstText(
      payload.overall_experience,
      payload.experience,
      payload.experience_text,
      payload.overall_experience_min ? `${payload.overall_experience_min}-${payload.overall_experience_max}` : '',
    ));
    const experienceLevel = firstText(payload.experience_level, payload.experienceLevel) || null;
    const budget = parseBudget(payload);
    const budgetText = firstText(
      payload.budget_text,
      payload.budgetText,
      payload.budget_raw,
      payload.monthly_budget,
      payload.yearly_budget,
      payload.budget,
    ) || null;
    const location = firstText(payload.location, payload.city, payload.work_location) || null;
    const workMode = firstText(payload.work_mode, payload.workMode, payload.work_mode_text) || null;
    const employmentType = firstText(payload.employment_type, payload.employmentType, payload.engagement_type) || null;
    const noticePeriod = firstText(payload.notice_period, payload.noticePeriod) || null;
    const description = firstText(payload.description, payload.job_description, payload.bodyText, payload.body_text) || null;
    const openings = parseCount(payload.number_of_positions ?? payload.openings ?? payload.positions);
    const status = mapMailStatus(payload.job_status ?? payload.status);
    const priority = mapMailPriority(payload.priority);

    const clientEmail = firstEmail(payload.client_lead_poc, payload.client_poc, payload.from, payload.clientEmail);
    const toEmails = uniqueStrings([
      ...asStringList(payload.to),
      ...asStringList(payload.to_emails),
      ...asStringList(payload.email_to),
      ...asStringList(payload.internal_poc_email),
    ].flatMap(splitEmails));
    const ccEmails = uniqueStrings([
      ...asStringList(payload.cc),
      ...asStringList(payload.cc_emails),
      ...asStringList(payload.email_cc),
    ].flatMap(splitEmails));
    const arrived = parseDate(payload.receivedDateTime || payload.demand_received_date || payload.emailArrivedTime) || new Date();
    const pocName = firstText(payload.from_name, payload.client_lead_poc_name, payload.poc_name);
    const sourceSubject = firstText(payload.subject, payload.email_subject) || null;
    const sourceEmailBody = firstText(payload.bodyText, payload.body_text, payload.body) || null;
    const sourceEmailHtml = firstText(payload.bodyHtml, payload.body_html) || null;

    const client = await this.ensureMailClient(orgId, clientName, clientEmail, pocName);
    const isLtts =
      (clientName || '').trim().toLowerCase() === 'ltts' ||
      (client?.clientName || '').trim().toLowerCase() === 'ltts' ||
      /l\s*&\s*t\s*technology|ltts/i.test(clientName || '') ||
      /l\s*&\s*t\s*technology|ltts/i.test(client?.clientName || '');

    let finalSourceClientJdId = sourceClientJdId;
    if (isLtts && finalSourceClientJdId) {
      const exists = await this.requirementModel.exists({
        orgId,
        clientId: client._id,
        sourceClientJdId: finalSourceClientJdId,
        deletedAt: null,
      });
      if (exists) {
        finalSourceClientJdId = `${finalSourceClientJdId}-R${Date.now()}`;
      }
    }

    const lookAlikes: string[] = [];
    const existing = isLtts ? null : await this.findMailRequirement({
      orgId,
      clientId: client._id as Types.ObjectId,
      sourceClientJdId: finalSourceClientJdId,
      sourceMessageId,
      conversationId,
      inReplyTo,
      title,
      arrived,
      subject: sourceSubject,
      idempotencyKey,
      skills,
      mandatorySkills,
      experience,
      location,
      workMode,
    }, lookAlikes);

    // allow_lookalike: a reviewer confirmed this is a separate requirement (pipeline review queue).
    if (!isLtts && !existing && !finalSourceClientJdId && lookAlikes.length > 0 && !payload.allow_lookalike) {
      // Identity is ambiguous: neither create a possible duplicate nor merge into a different
      // requirement. The pipeline queues this for human review.
      this.logger.warn(`Ingest of "${title}" (${clientName}) is ambiguous with ${lookAlikes.join(', ')}; needs review`);
      return {
        data: {
          ignored: true,
          needsReview: true,
          reason: `Possible duplicate of ${lookAlikes.join(', ')} from a different email; needs review`,
          candidates: lookAlikes,
        },
      };
    }

    if (existing) {
      // Keep the first stored mail as the original; only fill it for records that predate this field.
      if (sourceEmailBody || sourceEmailHtml) {
        await this.requirementModel.updateOne(
          { _id: existing._id, sourceEmailBody: null, sourceEmailHtml: null },
          { $set: { sourceEmailBody, sourceEmailHtml, sourceFromName: pocName || null, sourceSubject: (existing as any).sourceSubject || sourceSubject } },
        ).exec();
      }
      return this.applyRequirementDeltaUpdate({
        existing,
        orgId,
        performedBy,
        title,
        description,
        skills,
        mandatorySkills,
        experience,
        experienceLevel,
        budget,
        budgetText,
        location,
        workMode,
        employmentType,
        noticePeriod,
        openings,
        status,
        priority,
        sourceClientJdId: finalSourceClientJdId,
        sourceMessageId,
        conversationId,
        inReplyTo,
        clientEmail,
        toEmails,
        ccEmails,
        arrived,
        idempotencyKey,
      });
    }

    try {
      const draft = new this.requirementModel({
        orgId,
        title,
        clientId: client._id,
        clientName: client.clientName,
        priority: priority || 'Medium',
        status: status || 'Open',
        assignmentStatus: 'Unassigned',
        openings: openings || 1,
        budgetRange: budget,
        budgetText: budgetText || undefined,
        skillsRequired: skills,
        mandatorySkills,
        experienceRange: experience,
        experienceLevel: experienceLevel || undefined,
        location: location || workMode || 'Hybrid',
        workMode: workMode || undefined,
        employmentType: employmentType || undefined,
        noticePeriod: noticePeriod || undefined,
        description: description || undefined,
        clientEmail,
        toEmails: sanitizeEmailList(toEmails),
        ccEmails: sanitizeEmailList(ccEmails),
        emailArrivedTime: arrived,
        firstDetectedAt: arrived,
        sourceEmailReceivedAt: arrived,
        lastSeenAt: arrived,
        lastUpdatedAt: null,
        idempotencyKey,
        sourceMessageId,
        sourceClientJdId: finalSourceClientJdId,
        conversationId,
        inReplyTo,
        sourceSubject,
        sourceEmailBody,
        sourceEmailHtml,
        sourceFromName: pocName || null,
      });
      // The Requirement ID's day is the requirement's original creation date (the client email).
      const saved = await this.saveNewRequirement(draft, arrived);

      this.syncState.totalSynced += 1;

      return {
        data: {
          requirementId: saved._id.toString(),
          reqCode: saved.reqCode,
          deduped: false,
        },
      };
    } catch (err: any) {
      if (!isLtts && err?.code === 11000) {
        this.logger.warn(`E11000 duplicate key caught during ingestFromEmail. Re-fetching existing record to apply update.`);
        const raceExisting = await this.findMailRequirement({
          orgId,
          clientId: client._id as Types.ObjectId,
          sourceClientJdId,
          sourceMessageId,
          conversationId,
          inReplyTo,
          title,
          arrived,
          subject: sourceSubject,
          idempotencyKey,
          skills,
          mandatorySkills,
          experience,
          location,
          workMode,
        });
        if (raceExisting) {
          return this.applyRequirementDeltaUpdate({
            existing: raceExisting,
            orgId,
            performedBy,
            title,
            description,
            skills,
            mandatorySkills,
            experience,
            experienceLevel,
            budget,
            budgetText,
            location,
            workMode,
            employmentType,
            noticePeriod,
            openings,
            status,
            priority,
            sourceClientJdId,
            sourceMessageId,
            conversationId,
            inReplyTo,
            clientEmail,
            toEmails,
            ccEmails,
            arrived,
            idempotencyKey,
          });
        }
      }
      throw err;
    }
  }

  private async applyRequirementDeltaUpdate(params: {
    existing: RequirementDocument;
    orgId: Types.ObjectId;
    performedBy: Types.ObjectId;
    title: string;
    description: string | null;
    skills: string[];
    mandatorySkills: string[];
    experience: { min: number; max: number };
    experienceLevel: string | null;
    budget: { min: number; max: number; currency: string };
    budgetText?: string | null;
    location: string | null;
    workMode: string | null;
    employmentType: string | null;
    noticePeriod: string | null;
    openings: number | null;
    status: string | null;
    priority: string | null;
    sourceClientJdId: string | null;
    sourceMessageId: string | null;
    conversationId: string | null;
    inReplyTo: string | null;
    clientEmail: string | null;
    toEmails: string[];
    ccEmails: string[];
    arrived: Date;
    idempotencyKey?: string | null;
  }) {
    const { existing, orgId, performedBy } = params;
    const oldValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};

    // An email older than the latest one already applied (a replay or backfill out of order)
    // must not override newer values, e.g. re-open a requirement a later reply cancelled.
    const lastSeen = (existing as any).lastSeenAt ? new Date((existing as any).lastSeenAt) : null;
    if (!existing.deletedAt && lastSeen && params.arrived && params.arrived.getTime() < lastSeen.getTime()) {
      return {
        data: {
          requirementId: existing._id.toString(),
          reqCode: existing.reqCode,
          deduped: true,
          updated: false,
          stale: true,
        },
      };
    }

    if (existing.deletedAt) {
      // Replaying the email that created a requirement a user later deleted must not resurrect it.
      if (params.sourceMessageId && existing.sourceMessageId === params.sourceMessageId) {
        return {
          data: {
            requirementId: existing._id.toString(),
            reqCode: existing.reqCode,
            deduped: true,
            updated: false,
            skipped: 'deleted_by_user',
          },
        };
      }
      existing.deletedAt = null;
      // Codes are unique only among live requirements, so the old code may have been reused meanwhile.
      const codeTaken = await this.requirementModel.exists({
        orgId,
        reqCode: existing.reqCode,
        deletedAt: null,
        _id: { $ne: existing._id },
      });
      if (codeTaken) {
        // Only reachable for codes reused by the old generator, which ignored deleted rows.
        existing.reqCode = await this.generateReqCode(orgId, (existing as any).firstDetectedAt || existing.emailArrivedTime || params.arrived);
      }
    }

    if (params.title && params.title.trim() && existing.title !== params.title.trim()) {
      oldValues.title = existing.title;
      newValues.title = params.title.trim();
      existing.title = params.title.trim();
    }

    if (params.description && params.description.trim() && existing.description !== params.description.trim()) {
      oldValues.description = existing.description;
      newValues.description = params.description.trim();
      existing.description = params.description.trim();
    }

    if ((params.experience.min > 0 || params.experience.max > 0) &&
        (params.experience.min !== existing.experienceRange?.min || params.experience.max !== existing.experienceRange?.max)) {
      oldValues.experienceRange = existing.experienceRange;
      newValues.experienceRange = params.experience;
      existing.experienceRange = params.experience;
    }

    if (params.experienceLevel && existing.experienceLevel !== params.experienceLevel) {
      oldValues.experienceLevel = existing.experienceLevel;
      newValues.experienceLevel = params.experienceLevel;
      existing.experienceLevel = params.experienceLevel;
    }

    if ((params.budget.min > 0 || params.budget.max > 0) &&
        (params.budget.min !== existing.budgetRange?.min || params.budget.max !== existing.budgetRange?.max || (params.budget.currency && params.budget.currency !== existing.budgetRange?.currency))) {
      oldValues.budgetRange = existing.budgetRange;
      newValues.budgetRange = params.budget;
      existing.budgetRange = params.budget;
    }

    if (params.budgetText && params.budgetText.trim() && existing.budgetText !== params.budgetText.trim()) {
      oldValues.budgetText = existing.budgetText;
      newValues.budgetText = params.budgetText.trim();
      existing.budgetText = params.budgetText.trim();
    }

    if (params.location && existing.location !== params.location) {
      oldValues.location = existing.location;
      newValues.location = params.location;
      existing.location = params.location;
    }

    if (params.workMode && existing.workMode !== params.workMode) {
      oldValues.workMode = existing.workMode;
      newValues.workMode = params.workMode;
      existing.workMode = params.workMode;
    }

    if (params.employmentType && existing.employmentType !== params.employmentType) {
      oldValues.employmentType = existing.employmentType;
      newValues.employmentType = params.employmentType;
      existing.employmentType = params.employmentType;
    }

    if (params.noticePeriod && existing.noticePeriod !== params.noticePeriod) {
      oldValues.noticePeriod = existing.noticePeriod;
      newValues.noticePeriod = params.noticePeriod;
      existing.noticePeriod = params.noticePeriod;
    }

    if (params.openings && params.openings > 0 && existing.openings !== params.openings) {
      oldValues.openings = existing.openings;
      newValues.openings = params.openings;
      existing.openings = params.openings;
    }

    if (params.priority && existing.priority !== params.priority) {
      oldValues.priority = existing.priority;
      newValues.priority = params.priority;
      existing.priority = params.priority;
    }

    if (params.status && existing.status !== params.status) {
      oldValues.status = existing.status;
      newValues.status = params.status;
      existing.status = params.status;
    }

    if (params.skills && params.skills.length > 0) {
      const mergedSkills = uniqueStrings([...(existing.skillsRequired || []), ...params.skills]);
      if (mergedSkills.length !== (existing.skillsRequired || []).length) {
        oldValues.skillsRequired = existing.skillsRequired;
        newValues.skillsRequired = mergedSkills;
        existing.skillsRequired = mergedSkills;
      }
    }

    if (params.mandatorySkills && params.mandatorySkills.length > 0) {
      const mergedMandatory = uniqueStrings([...(existing.mandatorySkills || []), ...params.mandatorySkills]);
      if (mergedMandatory.length !== (existing.mandatorySkills || []).length) {
        oldValues.mandatorySkills = existing.mandatorySkills;
        newValues.mandatorySkills = mergedMandatory;
        existing.mandatorySkills = mergedMandatory;
      }
    }

    if (params.sourceClientJdId && !existing.sourceClientJdId) {
      oldValues.sourceClientJdId = existing.sourceClientJdId;
      newValues.sourceClientJdId = params.sourceClientJdId;
      // The client's reference is stored separately; the Requirement ID never changes on update.
      existing.sourceClientJdId = params.sourceClientJdId;
    }

    if (params.sourceMessageId && !existing.sourceMessageId) {
      existing.sourceMessageId = params.sourceMessageId;
    }
    if (params.conversationId && !existing.conversationId) {
      existing.conversationId = params.conversationId;
    }
    if (params.inReplyTo && !existing.inReplyTo) {
      existing.inReplyTo = params.inReplyTo;
    }
    if (params.clientEmail && !existing.clientEmail) {
      existing.clientEmail = params.clientEmail;
    }
    if (params.toEmails && params.toEmails.length > 0) {
      existing.toEmails = uniqueStrings([...(existing.toEmails || []), ...params.toEmails]);
    }
    if (params.ccEmails && params.ccEmails.length > 0) {
      existing.ccEmails = uniqueStrings([...(existing.ccEmails || []), ...params.ccEmails]);
    }
    if (params.idempotencyKey && !(existing as any).idempotencyKey) {
      (existing as any).idempotencyKey = params.idempotencyKey;
    }

    // Phase 5 Lifecycle Timestamps: Preserve firstDetectedAt and sourceEmailReceivedAt!
    if (!(existing as any).firstDetectedAt) {
      (existing as any).firstDetectedAt = existing.emailArrivedTime || (existing as any).createdAt || params.arrived;
    }
    if (!(existing as any).sourceEmailReceivedAt) {
      (existing as any).sourceEmailReceivedAt = existing.emailArrivedTime || (existing as any).createdAt || params.arrived;
    }
    const seen = params.arrived || new Date();
    if (!lastSeen || seen.getTime() > lastSeen.getTime()) (existing as any).lastSeenAt = seen;

    const hasChanges = Object.keys(newValues).length > 0;
    if (hasChanges) {
      (existing as any).lastUpdatedAt = new Date();
      await this.logHistory(
        orgId,
        existing._id as Types.ObjectId,
        'EMAIL_EXTRACT_UPDATE',
        performedBy,
        oldValues,
        newValues,
        `Updated via auto email extraction from ${params.sourceMessageId || 'email stream'} (delta changes)`,
      );
    } else {
      await this.logHistory(
        orgId,
        existing._id as Types.ObjectId,
        'EMAIL_EXTRACT_DEDUP',
        performedBy,
        {},
        { sourceMessageId: params.sourceMessageId, arrived: params.arrived },
        'Duplicate email received across thread; preserved existing requirement without duplicate insertion',
      );
    }

    await existing.save();
    this.syncState.totalDeduped += 1;

    return {
      data: {
        requirementId: existing._id.toString(),
        reqCode: existing.reqCode,
        deduped: true,
        updated: hasChanges,
        changes: newValues,
      },
    };
  }

  private async ensureMailClient(orgId: Types.ObjectId, clientName: string, email: string | null, pocName: string) {
    const escaped = escapeRegex(clientName);
    const found = await this.clientModel.findOne({
      orgId,
      deletedAt: null,
      clientName: { $regex: new RegExp(`^${escaped}$`, 'i') },
    }).exec();
    if (found) {
      if (email && !(found.pocContacts || []).some(contact => String(contact?.email || '').toLowerCase() === email)) {
        found.pocContacts = [...(found.pocContacts || []), { name: pocName || clientName, email }];
        await found.save();
      }
      return found;
    }
    return this.clientModel.create({
      orgId,
      clientId: `CLIENT-MAIL-${Date.now()}`,
      clientName,
      domain: 'Information Technology',
      tier: 'Tier-1',
      status: 'Active',
      slaDays: 5,
      pocContacts: email ? [{ name: pocName || clientName, email }] : [],
      schemaVersion: 1,
    });
  }

  private async findMailRequirement(params: {
    orgId: Types.ObjectId;
    clientId: Types.ObjectId;
    sourceClientJdId: string | null;
    sourceMessageId: string | null;
    conversationId: string | null;
    inReplyTo: string | null;
    title: string;
    arrived: Date;
    subject?: string | null;
    idempotencyKey?: string | null;
    skills?: string[];
    mandatorySkills?: string[];
    experience?: { min: number; max: number };
    location?: string | null;
    workMode?: string | null;
  }, ambiguousOut?: string[]): Promise<RequirementDocument | null> {
    const {
      orgId,
      clientId,
      sourceClientJdId,
      sourceMessageId,
      conversationId,
      inReplyTo,
      title,
      arrived,
      subject,
      idempotencyKey,
      skills = [],
      mandatorySkills = [],
      experience,
      location,
      workMode,
    } = params;

    const cleanSourceJd = normalizeJdId(sourceClientJdId);

    const hasConflictingJdId = (docJdId?: string | null): boolean => {
      const cleanDocJd = normalizeJdId(docJdId);
      if (!cleanDocJd || !cleanSourceJd) return false;
      return cleanDocJd !== cleanSourceJd;
    };

    // Tier 0: Idempotency Key Match (exact duplicate API submission / retry)
    if (idempotencyKey && idempotencyKey.trim()) {
      const byIdem = await this.requirementModel
        .findOne({ orgId, idempotencyKey: idempotencyKey.trim() })
        .setOptions({ includeDeleted: true })
        .exec();
      // A retry key never overrides the client's own requirement ID (old keys omitted it).
      if (byIdem && !hasConflictingJdId(byIdem.sourceClientJdId)) return byIdem;
    }

    // Tier 1: Client Requisition ID Match (most reliable business identifier)
    if (cleanSourceJd) {
      const byJd = await this.requirementModel
        .findOne({
          orgId,
          clientId,
          sourceClientJdId: { $regex: new RegExp(`^${escapeRegex(cleanSourceJd)}$`, 'i') },
        })
        .setOptions({ includeDeleted: true })
        .exec();
      if (byJd) return byJd;

      // Also check reqCode suffix match e.g. "2026/10/15-046 (212883-1)"
      const byReqCode = await this.requirementModel
        .findOne({
          orgId,
          clientId,
          reqCode: { $regex: new RegExp(`\\(${escapeRegex(cleanSourceJd)}\\)$`, 'i') },
        })
        .setOptions({ includeDeleted: true })
        .exec();
      if (byReqCode) return byReqCode;
    }

    // Tier 2: Same Message ID (retry or re-processing of the exact same email)
    if (sourceMessageId && sourceMessageId.trim()) {
      const msgClean = sourceMessageId.trim();
      const msgCandidates = await this.requirementModel
        .find({ orgId, sourceMessageId: msgClean })
        .setOptions({ includeDeleted: true })
        .exec();

      for (const cand of msgCandidates) {
        if (hasConflictingJdId(cand.sourceClientJdId)) continue;
        if (cleanSourceJd && cand.sourceClientJdId) {
          if (normalizeJdId(cand.sourceClientJdId) === cleanSourceJd) return cand;
          continue;
        }
        if (isTitleMatch(cand.title, title)) {
          return cand;
        }
      }
      // An email without client IDs that produced exactly one requirement is that requirement,
      // even if a re-read words the title differently (AI extraction is not word-for-word stable).
      const sameEmail = msgCandidates.filter((c) => !c.deletedAt && !hasConflictingJdId(c.sourceClientJdId));
      if (!cleanSourceJd && sameEmail.length === 1) {
        return sameEmail[0];
      }
    }

    // Tier 3: Conversation Thread / In-Reply-To Header Match (thread replies & updates)
    // MUST verify title and location compatibility — NEVER blindly merge just because thread has 1 requirement!
    const threadFilter: Record<string, any>[] = [];
    if (conversationId && conversationId.trim()) {
      threadFilter.push({ conversationId: conversationId.trim() });
    }
    if (inReplyTo && inReplyTo.trim()) {
      threadFilter.push({ sourceMessageId: inReplyTo.trim() }, { inReplyTo: inReplyTo.trim() });
    }

    if (threadFilter.length > 0) {
      const threadCandidates = await this.requirementModel
        .find({ orgId, clientId, $or: threadFilter })
        .setOptions({ includeDeleted: true })
        .exec();

      for (const cand of threadCandidates) {
        if (hasConflictingJdId(cand.sourceClientJdId)) continue;
        if (isTitleMatch(cand.title, title)) {
          if (isLocationCompatible(cand.location, location)) {
            return cand;
          }
        }
      }
    }

    // Tier 4: Business Multi-Attribute Identity Match (when client JD ID is unavailable)
    // To NEVER merge two distinct genuine requirements with the same role:
    // Requires: Same client + matching title + compatible location/city + overlapping skills + compatible experience
    if (title && title.trim()) {
      const clientReqs = await this.requirementModel
        .find({ orgId, clientId, deletedAt: null })
        .setOptions({ includeDeleted: true })
        .exec();

      for (const cand of clientReqs) {
        // If either has a client JD ID and they conflict or one is missing, treat with caution
        if (cand.sourceClientJdId && cleanSourceJd && hasConflictingJdId(cand.sourceClientJdId)) {
          continue;
        }
        if (cand.sourceClientJdId && !cleanSourceJd) {
          // Candidate in DB has a verified client ID, but incoming doesn't; don't blindly merge
          continue;
        }

        if (!isTitleMatch(cand.title, title)) {
          continue;
        }

        // 1. Location / City check: if both specify cities and they differ (e.g. Pune vs Bangalore), DO NOT merge!
        if (!isLocationCompatible(cand.location, location)) {
          continue;
        }

        // 2. Experience range compatibility check: if ranges are completely disjoint (e.g. 1-3 yrs vs 10-15 yrs), DO NOT merge!
        if (experience && !isExperienceCompatible(cand.experienceRange, experience)) {
          continue;
        }

        // 3. Skill overlap check: if both have skills specified, require at least 35% overlap
        const incomingAllSkills = [...(mandatorySkills || []), ...(skills || [])];
        const candAllSkills = [...(cand.mandatorySkills || []), ...(cand.skillsRequired || [])];
        if (incomingAllSkills.length > 0 && candAllSkills.length > 0) {
          const overlap = computeSkillOverlap(candAllSkills, incomingAllSkills);
          if (overlap < 0.35) {
            continue; // Distinct roles (e.g. Java backend vs Java Android)
          }
        }

        // 4. Source context: the same client email subject identifies the same requirement.
        if (subject && cand.sourceSubject && normalizeSubject(cand.sourceSubject) === normalizeSubject(subject)) {
          return cand;
        }

        // Different (or unknown) subjects: similar title/skills alone is NOT proof of identity
        // (e.g. "Application Engineer - US" vs "- UK"). Never merge; report a strong look-alike
        // as ambiguous so the caller can route it to review instead of guessing.
        if (incomingAllSkills.length > 0 && candAllSkills.length > 0) {
          const overlap = computeSkillOverlap(candAllSkills, incomingAllSkills);
          if (overlap >= 0.6 && arrived && cand.emailArrivedTime) {
            const diffDays = Math.abs(arrived.getTime() - new Date(cand.emailArrivedTime).getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays <= 30 && ambiguousOut) ambiguousOut.push(cand.reqCode);
          }
        }
      }
    }

    return null;
  }
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text && !['null', 'none', 'n/a', 'na', 'undefined'].includes(text.toLowerCase())) return text;
  }
  return '';
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(item => String(item ?? '').trim()).filter(Boolean);
  const text = String(value ?? '').trim();
  return text ? [text] : [];
}

function splitEmails(value: string): string[] {
  return value.split(/[;,]/).map(part => part.trim()).filter(part => part.includes('@'));
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function firstEmail(...values: unknown[]): string | null {
  const email = uniqueStrings(values.flatMap(value => asStringList(value).flatMap(splitEmails)))[0];
  return email || null;
}

function parseCount(value: unknown): number | null {
  const match = String(value ?? '').match(/\d+/);
  if (!match) return null;
  const count = Number(match[0]);
  return Number.isFinite(count) && count > 0 ? count : null;
}

function parseExperience(value: string): { min: number; max: number | null } {
  const text = String(value ?? '').trim();
  const rangeMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:-|to|–|—)\s*(\d+(?:\.\d+)?)/i);
  if (rangeMatch) {
    return { min: Number(rangeMatch[1]), max: Number(rangeMatch[2]) };
  }
  // "5+ years" / "minimum 5 years" is a minimum with no upper limit, not exactly 5.
  const open = text.match(/(\d+(?:\.\d+)?)\s*\+/) || text.match(/\b(?:min(?:imum)?|at\s+least)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i);
  if (open) {
    return { min: Number(open[1]), max: null };
  }
  const single = text.match(/(\d+(?:\.\d+)?)/);
  if (!single) return { min: 0, max: 0 };
  const years = Number(single[1]);
  return { min: years, max: years };
}

function parseBudget(payload: Record<string, any>): { min: number; max: number; currency: string } {
  const currency = firstText(payload.budget_currency) || 'INR';

  // Check direct numbers first
  let min = numberFrom(payload.yearly_budget_min);
  let max = numberFrom(payload.yearly_budget_max);

  // If monthly min/max given
  const mMin = numberFrom(payload.monthly_budget_min);
  const mMax = numberFrom(payload.monthly_budget_max);
  if (mMin > 0 && !min) min = mMin * 12;
  if (mMax > 0 && !max) max = mMax * 12;

  // If still 0, parse from strings: yearly_budget, monthly_budget, budget, budget_text
  const budgetStrings = [
    payload.yearly_budget,
    payload.budget,
    payload.budget_text,
    payload.budgetText,
  ].filter(v => typeof v === 'string' && v.trim());

  for (const str of budgetStrings) {
    if (min > 0 && max > 0) break;
    const clean = String(str).replace(/,/g, '').trim();
    // Check range like "8 - 10", "8-10 LPA", "90k - 1L", "800000 - 1000000"
    const rangeMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:-|to|–|—)\s*(\d+(?:\.\d+)?)/i);
    if (rangeMatch) {
      let v1 = Number(rangeMatch[1]);
      let v2 = Number(rangeMatch[2]);
      const isLpa = /lpa|lakh|lac/i.test(clean);
      if (isLpa || (currency === 'INR' && v1 < 100 && v2 < 100)) {
        if (v1 < 100) v1 = Math.round(v1 * 100000);
        if (v2 < 100) v2 = Math.round(v2 * 100000);
      }
      if (!min) min = v1;
      if (!max) max = v2;
    } else {
      const singleMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:lpa|lakh|lac)?/i);
      if (singleMatch) {
        let v = Number(singleMatch[1]);
        if (/lpa|lakh|lac/i.test(clean) || (currency === 'INR' && v < 100)) {
          v = Math.round(v * 100000);
        }
        if (!min) min = v;
        if (!max) max = v;
      }
    }
  }

  // Also check monthly_budget string if still missing
  if ((!min || !max) && payload.monthly_budget) {
    const clean = String(payload.monthly_budget).replace(/,/g, '').trim();
    const rangeMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:-|to|–|—)\s*(\d+(?:\.\d+)?)/i);
    if (rangeMatch) {
      const m1 = Number(rangeMatch[1]);
      const m2 = Number(rangeMatch[2]);
      if (!min) min = Math.round(m1 * 12);
      if (!max) max = Math.round(m2 * 12);
    } else {
      const singleMatch = clean.match(/(\d+(?:\.\d+)?)/);
      if (singleMatch) {
        const m = Number(singleMatch[1]);
        if (!min) min = Math.round(m * 12);
        if (!max) max = Math.round(m * 12);
      }
    }
  }

  // Scale any remaining LPA numbers (< 100) in INR
  if (currency === 'INR') {
    if (min > 0 && min < 100) min = Math.round(min * 100000);
    if (max > 0 && max < 100) max = Math.round(max * 100000);
  }

  if (min > max && max > 0) {
    const tmp = min;
    min = max;
    max = tmp;
  }

  return { min: min || 0, max: max || min || 0, currency };
}

function numberFrom(value: unknown): number {
  const match = String(value ?? '').replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function parseDate(value: unknown): Date | null {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function mapMailPriority(value: unknown): string | null {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return null;
  if (text.includes('urgent') || text === 'high') return 'High';
  if (text === 'low') return 'Low';
  if (text === 'medium') return 'Medium';
  return null;
}

function mapMailStatus(value: unknown): string | null {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return null;
  if (text.includes('hold')) return 'On Hold';
  if (text.includes('close') || text.includes('cancel')) return 'Closed';
  if (text.includes('open') || text.includes('active')) return 'Open';
  return null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeTitle(t?: string | null): string {
  if (!t) return '';
  return t
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isTitleMatch(t1?: string | null, t2?: string | null): boolean {
  const n1 = normalizeTitle(t1);
  const n2 = normalizeTitle(t2);
  if (!n1 || !n2) return false;
  if (n1 === n2) return true;
  const words1 = new Set(n1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(n2.split(' ').filter(w => w.length > 2));
  if (words1.size === 0 || words2.size === 0) return false;
  let matches = 0;
  for (const w of words1) {
    if (words2.has(w)) matches++;
  }
  const ratio = (matches * 2) / (words1.size + words2.size);
  return ratio >= 0.75;
}

function normalizeSubject(s?: string | null): string {
  if (!s) return '';
  return s
    .replace(/^(re|fwd|fw|automatic reply|out of office):\s*/i, '')
    .trim()
    .toLowerCase();
}

function normalizeJdId(id?: string | null): string {
  if (!id) return '';
  const text = String(id).trim();
  if (!text || ['null', 'none', 'n/a', 'na', 'undefined'].includes(text.toLowerCase())) return '';
  return text.replace(/^[[(<"']+|[\])>"']+$/g, '').trim().toUpperCase();
}

const CITY_SYNONYMS: Record<string, string> = {
  bangalore: 'bengaluru',
  bengaluru: 'bengaluru',
  gurgaon: 'gurugram',
  gurugram: 'gurugram',
  bombay: 'mumbai',
  mumbai: 'mumbai',
  calcutta: 'kolkata',
  kolkata: 'kolkata',
  madras: 'chennai',
  chennai: 'chennai',
  hyderabad: 'hyderabad',
  hyd: 'hyderabad',
  pune: 'pune',
  noida: 'noida',
  delhi: 'delhi',
  cochin: 'kochi',
  kochi: 'kochi',
  ahmedabad: 'ahmedabad',
  trivandrum: 'thiruvananthapuram',
  thiruvananthapuram: 'thiruvananthapuram',
};

function extractCities(loc?: string | null): Set<string> {
  const result = new Set<string>();
  if (!loc) return result;
  const clean = loc.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokens = clean.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    if (CITY_SYNONYMS[token]) {
      result.add(CITY_SYNONYMS[token]);
    }
  }
  return result;
}

function isLocationCompatible(loc1?: string | null, loc2?: string | null): boolean {
  if (!loc1 || !loc2) return true;
  const text1 = loc1.toLowerCase().trim();
  const text2 = loc2.toLowerCase().trim();
  if (!text1 || !text2) return true;

  const remoteKeywords = ['remote', 'work from home', 'wfh', 'anywhere', 'pan india', 'across india'];
  if (remoteKeywords.some(k => text1.includes(k)) || remoteKeywords.some(k => text2.includes(k))) {
    return true;
  }

  const cities1 = extractCities(text1);
  const cities2 = extractCities(text2);

  if (cities1.size > 0 && cities2.size > 0) {
    for (const c of cities1) {
      if (cities2.has(c)) return true;
    }
    return false;
  }

  return true;
}

function isExperienceCompatible(
  exp1?: { min: number; max: number | null } | string | null,
  exp2?: { min: number; max: number | null } | string | null,
): boolean {
  if (!exp1 || !exp2) return true;
  const p1 = typeof exp1 === 'object' && 'min' in exp1 ? exp1 : parseExperience(String(exp1));
  const p2 = typeof exp2 === 'object' && 'min' in exp2 ? exp2 : parseExperience(String(exp2));

  if (p1.min === 0 && p1.max === 0) return true;
  if (p2.min === 0 && p2.max === 0) return true;

  const max1 = p1.max ?? Number.POSITIVE_INFINITY;
  const max2 = p2.max ?? Number.POSITIVE_INFINITY;
  if (p2.min > max1 + 1 || p1.min > max2 + 1) {
    return false;
  }
  return true;
}

function computeSkillOverlap(skills1: string[], skills2: string[]): number {
  if (!skills1 || !skills2) return 0;
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#]/g, '').trim();
  const set1 = new Set(skills1.map(normalize).filter(Boolean));
  const set2 = new Set(skills2.map(normalize).filter(Boolean));

  if (set1.size === 0 && set2.size === 0) return 1.0;
  if (set1.size === 0 || set2.size === 0) return 0.5;

  let common = 0;
  for (const s of set1) {
    if (set2.has(s)) common++;
  }

  return (2 * common) / (set1.size + set2.size);
}



/** Creation day for Requirement IDs, as YYYY-MM-DD in Asia/Kolkata. */
export function reqCodeDay(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.REQUIREMENT_ID_TIMEZONE || 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** True for addresses in our own domain(s); such mail can never create or update requirements. */
export function isInternalSender(email: unknown): boolean {
  const e = String(email ?? '').trim().toLowerCase();
  const domain = e.includes('@') ? e.split('@').pop() || '' : '';
  if (!domain) return false;
  const internal = String(process.env.MAIL_INTERNAL_DOMAINS || 'metaforgeit.com')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return internal.some((d) => domain === d || domain.endsWith(`.${d}`));
}
