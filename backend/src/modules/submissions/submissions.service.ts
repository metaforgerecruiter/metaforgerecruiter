import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Submission, SubmissionDocument } from './schemas/submission.schema';
import {
  SubmissionHistory,
  SubmissionHistoryDocument,
} from './schemas/submission-history.schema';
import { SubmissionRepository } from './repositories/submission.repository';
import { Requirement, RequirementDocument } from '../requirements/schemas/requirement.schema';
import { Candidate, CandidateDocument } from '../candidates/schemas/candidate.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Team, TeamDocument } from '../teams/schemas/team.schema';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { LeadApprovalDto } from './dto/lead-approval.dto';
import { ForwardClientDto } from './dto/forward-client.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { getClientEmailDefaults, isAccentureClient, sanitizeEmailList } from '../../common/constants/client-email-defaults';
import { MailService } from '../mail/mail.service';
import { reqCodeCandidates } from '../../common/requirement-id';
import {
  assertCanAccessSubmission,
  orgScope,
  requireOrgId,
} from '../../common/security/resource-access.util';

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
    @InjectModel(SubmissionHistory.name)
    private readonly historyModel: Model<SubmissionHistoryDocument>,
    @InjectModel(Requirement.name)
    private readonly requirementModel: Model<RequirementDocument>,
    @InjectModel(Candidate.name)
    private readonly candidateModel: Model<CandidateDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Team.name)
    private readonly teamModel: Model<TeamDocument>,
    private readonly submissionRepository: SubmissionRepository,
    @Optional()
    private readonly notificationsService?: NotificationsService,
    @Optional()
    private readonly mailService?: MailService,
  ) {}

  /** Format document for API output */
  private sanitizeSubmission(doc: any) {
    const obj = doc.toObject ? doc.toObject() : doc;

    const candidateObj = obj.candidateId && typeof obj.candidateId === 'object' ? obj.candidateId : null;
    const reqObj = obj.requirementId && typeof obj.requirementId === 'object' ? obj.requirementId : null;
    const clientObj = obj.clientId && typeof obj.clientId === 'object' ? obj.clientId : null;
    const recruiterObj = obj.recruiterId && typeof obj.recruiterId === 'object' ? obj.recruiterId : null;
    const leadObj = obj.leadId && typeof obj.leadId === 'object' ? obj.leadId : null;

    return {
      ...obj,
      id: obj._id ? obj._id.toString() : obj.id,
      candidateId: candidateObj ? candidateObj._id.toString() : (obj.candidateId?.toString() || obj.candidateId),
      requirementId: reqObj ? reqObj._id.toString() : (obj.requirementId?.toString() || obj.requirementId),
      clientId: clientObj ? clientObj._id.toString() : (obj.clientId?.toString() || obj.clientId),
      recruiterId: recruiterObj ? recruiterObj._id.toString() : (obj.recruiterId?.toString() || obj.recruiterId),
      leadId: leadObj ? leadObj._id.toString() : (obj.leadId?.toString() || null),
      // Computed helper fields expected by frontend UI
      candidateName: candidateObj?.name || 'N/A',
      requirementTitle: reqObj?.title || 'N/A',
      clientName: clientObj?.clientName || reqObj?.clientName || 'N/A',
      recruiterName: recruiterObj?.name || 'N/A',
      leadName: leadObj?.name || 'N/A',
      candidate: candidateObj?.name || candidateObj?._id?.toString() || obj.candidateId?.toString() || 'N/A',
      email: candidateObj?.email || obj.email || '',
      phone: candidateObj?.phone || obj.phone || '',
      reqCode: reqObj?.reqCode || '',
      req: reqObj?.title || reqObj?.reqCode || reqObj?._id?.toString() || obj.requirementId?.toString() || 'N/A',
      client: clientObj?.clientName || reqObj?.clientName || obj.clientId?.toString() || 'N/A',
      recruiter: recruiterObj?.name || recruiterObj?._id?.toString() || obj.recruiterId?.toString() || 'N/A',
      date: obj.submittedAt ? new Date(obj.submittedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      match: obj.matchScore ? `${Math.round(obj.matchScore <= 1 ? obj.matchScore * 100 : obj.matchScore)}%` : '85%',
    };
  }

  /** Generate SUB-XXX sequence code */
  async generateSubmissionId(orgId: Types.ObjectId): Promise<string> {
    const regex = /^SUB-(\d+)$/;
    const latest = await this.submissionModel
      .find({ orgId, submissionId: regex })
      .sort({ submissionId: -1 })
      .limit(1)
      .exec();

    let seq = 1;
    if (latest && latest.length > 0) {
      const parts = latest[0].submissionId.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    } else {
      const count = await this.submissionModel.countDocuments({ orgId }).exec();
      seq = count + 1;
    }

    return `SUB-${String(seq).padStart(3, '0')}`;
  }

  /** Write history log record */
  private async logHistory(
    orgId: Types.ObjectId,
    submissionId: Types.ObjectId,
    previousStage: string,
    newStage: string,
    performedBy: Types.ObjectId,
    notes: string = '',
  ) {
    try {
      const history = new this.historyModel({
        orgId,
        submissionId,
        previousStage,
        newStage,
        performedBy,
        notes,
      });
      await history.save();
    } catch (e) {
      // Ignore non-fatal audit log failures
    }
  }

  /** GET /api/v1/submissions */
  async findAll(
    currentUser: any,
    query?: {
      stage?: string;
      recruiterId?: string;
      leadId?: string;
      clientId?: string;
      requirementId?: string;
      candidateId?: string;
      search?: string;
    },
  ) {
    const orgId = requireOrgId(currentUser);
    const role = (currentUser?.role || 'recruiter').toLowerCase();
    const userObjectId = currentUser?.id || currentUser?.userId
      ? new Types.ObjectId((currentUser.id || currentUser.userId).toString())
      : null;

    const filter: Record<string, any> = { orgId, deletedAt: null };

    // Role-based access control:
    // SuperAdmin & Admin: see ALL org submissions.
    // Team Lead: see assigned submissions & submissions created by recruiters on their team.
    // Recruiter: see assigned/submitted records.
    if (role === 'recruiter' && userObjectId) {
      filter.$or = [{ recruiterId: userObjectId }, { leadId: userObjectId }];
    } else if ((role === 'lead' || role === 'team lead') && userObjectId) {
      const teamRecruiterIds: Types.ObjectId[] = [userObjectId];
      const teams = await this.teamModel.find({ orgId, leadId: userObjectId, deletedAt: null }).exec();
      for (const t of teams) {
        if (Array.isArray(t.recruiterIds)) {
          for (const rId of t.recruiterIds) {
            if (rId) teamRecruiterIds.push(new Types.ObjectId(rId.toString()));
          }
        }
      }
      const teamUsers = await this.userModel.find({
        orgId,
        $or: [
          ...(teams.length ? [{ teamId: { $in: teams.map(t => t._id) } }] : []),
          { _id: { $in: teamRecruiterIds } },
        ],
        deletedAt: null,
      }).exec();
      for (const u of teamUsers) {
        teamRecruiterIds.push(new Types.ObjectId(u._id.toString()));
      }

      filter.$or = [
        { leadId: userObjectId },
        { recruiterId: { $in: teamRecruiterIds } },
      ];
    }

    if (query?.stage) {
      filter.stage = query.stage;
    }

    if (query?.recruiterId && Types.ObjectId.isValid(query.recruiterId)) {
      filter.recruiterId = new Types.ObjectId(query.recruiterId);
    }

    if (query?.leadId && Types.ObjectId.isValid(query.leadId)) {
      filter.leadId = new Types.ObjectId(query.leadId);
    }

    if (query?.clientId && Types.ObjectId.isValid(query.clientId)) {
      filter.clientId = new Types.ObjectId(query.clientId);
    }

    if (query?.requirementId && Types.ObjectId.isValid(query.requirementId)) {
      filter.requirementId = new Types.ObjectId(query.requirementId);
    }

    if (query?.candidateId && Types.ObjectId.isValid(query.candidateId)) {
      filter.candidateId = new Types.ObjectId(query.candidateId);
    }

    if (query?.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.submissionId = regex;
    }

    const items = await this.submissionModel
      .find(filter)
      .populate('candidateId', 'name email phone skills totalExperienceYears')
      .populate('requirementId', 'title reqCode clientName status')
      .populate('clientId', 'clientName domain')
      .populate('recruiterId', 'name email')
      .populate('leadId', 'name email')
      .sort({ updatedAt: -1, submittedAt: -1, createdAt: -1 })
      .exec();

    return items.map((item) => this.sanitizeSubmission(item));
  }

  /** Load submission by Mongo id or business id, scoped to caller org + role. */
  private async loadSubmissionForUser(
    id: string,
    currentUser: any,
    populate = false,
  ): Promise<SubmissionDocument> {
    const scope = orgScope(currentUser);
    const applyPopulate = (q: any) => {
      if (!populate) return q;
      return q
        .populate('candidateId', 'name email phone skills totalExperienceYears')
        .populate('requirementId', 'title reqCode clientName status')
        .populate('clientId', 'clientName domain')
        .populate('recruiterId', 'name email')
        .populate('leadId', 'name email');
    };
    let doc: SubmissionDocument | null = null;
    if (Types.ObjectId.isValid(id)) {
      doc = await applyPopulate(this.submissionModel.findOne({ _id: id, ...scope })).exec();
    }
    if (!doc) {
      doc = await applyPopulate(
        this.submissionModel.findOne({ submissionId: id, ...scope }),
      ).exec();
    }
    if (!doc) {
      throw new NotFoundException(`Submission '${id}' not found`);
    }
    assertCanAccessSubmission(doc, currentUser);
    return doc;
  }

  /** GET /api/v1/submissions/:id */
  async findById(id: string, currentUser: any) {
    const doc = await this.loadSubmissionForUser(id, currentUser, true);

    const sanitized = this.sanitizeSubmission(doc);

    // Fetch history records
    const historyLogs = await this.historyModel
      .find({ submissionId: doc._id })
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();

    return {
      ...sanitized,
      history: historyLogs,
    };
  }

  /** POST /api/v1/submissions */
  async create(dto: CreateSubmissionDto, currentUser: any) {
    const orgId = requireOrgId(currentUser);
    const performedBy = currentUser?.id || currentUser?.userId
      ? new Types.ObjectId((currentUser.id || currentUser.userId).toString())
      : new Types.ObjectId();

    let candidateId = dto.candidateId;
    let requirementId = dto.requirementId;

    if ((!candidateId || !Types.ObjectId.isValid(candidateId)) && (dto.email || dto.candidate)) {
      const candFilter: Record<string, any> = { orgId, deletedAt: null };
      if (dto.email) candFilter.email = dto.email.trim().toLowerCase();
      else candFilter.name = dto.candidate;
      let cand = await this.candidateModel.findOne(candFilter).exec();
      if (!cand && dto.email && dto.candidate) {
        cand = await this.candidateModel.create({
          orgId,
          candidateId: `CAND-${Date.now()}`,
          name: dto.candidate,
          email: dto.email.trim().toLowerCase(),
          phone: dto.phone || `pending-${Date.now()}`,
          sourcedByRecruiterId: performedBy,
          status: 'Submitted',
          schemaVersion: 1,
        });
      }
      if (cand) candidateId = cand._id.toString();
    }

    if ((!requirementId || !Types.ObjectId.isValid(requirementId)) && dto.req) {
      const reqDoc = await this.requirementModel.findOne({ orgId, reqCode: { $in: reqCodeCandidates(String(dto.req)) }, deletedAt: null }).exec();
      if (reqDoc) requirementId = reqDoc._id.toString();
    }

    if (!candidateId || !Types.ObjectId.isValid(candidateId)) {
      throw new BadRequestException('Invalid candidateId ObjectId');
    }
    if (!requirementId || !Types.ObjectId.isValid(requirementId)) {
      throw new BadRequestException('Invalid requirementId ObjectId');
    }

    const candidateObjectId = new Types.ObjectId(candidateId);
    const requirementObjectId = new Types.ObjectId(requirementId);

    // Check existing active submission for candidate + requirement
    const existing = await this.submissionModel
      .findOne({
        orgId,
        candidateId: candidateObjectId,
        requirementId: requirementObjectId,
        deletedAt: null,
      })
      .exec();

    if (existing) {
      throw new ConflictException(
        `Candidate is already submitted to this requirement (Submission ${existing.submissionId})`,
      );
    }

    // Lookup Requirement to resolve clientId & leadId if not provided (org-scoped)
    const reqDoc = await this.requirementModel
      .findOne({ _id: requirementObjectId, orgId, deletedAt: null })
      .exec();
    if (!reqDoc) {
      throw new NotFoundException('Requirement not found');
    }
    if (reqDoc.status === 'On Hold' || reqDoc.status === 'Hold') {
      throw new BadRequestException(`Cannot submit candidate: Requirement '${reqDoc.reqCode || reqDoc.title}' is On Hold`);
    }
    const clientId = dto.clientId && Types.ObjectId.isValid(dto.clientId)
      ? new Types.ObjectId(dto.clientId)
      : (reqDoc?.clientId ? new Types.ObjectId(reqDoc.clientId.toString()) : new Types.ObjectId());

    let recruiterId = dto.recruiterId && Types.ObjectId.isValid(dto.recruiterId)
      ? new Types.ObjectId(dto.recruiterId)
      : performedBy;
    if ((!dto.recruiterId || !Types.ObjectId.isValid(dto.recruiterId)) && dto.recruiter) {
      const rec = await this.userModel.findOne({ orgId, name: dto.recruiter, deletedAt: null }).exec();
      if (rec) recruiterId = rec._id as Types.ObjectId;
    }

    let leadId = dto.leadId && Types.ObjectId.isValid(dto.leadId)
      ? new Types.ObjectId(dto.leadId)
      : (reqDoc?.assignedLeadId ? new Types.ObjectId(reqDoc.assignedLeadId.toString()) : null);

    if (!leadId && recruiterId) {
      const team = await this.teamModel.findOne({
        orgId,
        $or: [{ recruiterIds: recruiterId }, { leadId: recruiterId }],
        deletedAt: null,
      }).exec();
      if (team?.leadId) {
        leadId = new Types.ObjectId(team.leadId.toString());
      }
    }

    let matchScore = dto.matchScore;
    if (matchScore == null && dto.match) {
      const parsed = parseFloat(String(dto.match).replace('%', ''));
      if (!Number.isNaN(parsed)) matchScore = parsed;
    }

    const submissionId = await this.generateSubmissionId(orgId);
    const initialStage = dto.stage || 'Submitted';
    const initialApproval = initialStage === 'Submitted to Lead' ? 'Pending' : 'Pending';

    const newSubmission = new this.submissionModel({
      orgId,
      submissionId,
      candidateId: candidateObjectId,
      requirementId: requirementObjectId,
      clientId,
      recruiterId,
      leadId,
      stage: initialStage,
      leadApprovalStatus: initialApproval,
      matchScore: matchScore ?? 85.0,
      submittedAt: new Date(),
    });

    const saved = await newSubmission.save();

    await this.logHistory(
      orgId,
      new Types.ObjectId(saved._id.toString()),
      'None',
      saved.stage,
      performedBy,
      'Submission created',
    );

    // Trigger notification if leadId exists
    if (this.notificationsService && leadId) {
      try {
        await this.notificationsService.createNotification({
          orgId,
          userId: leadId,
          type: 'lead_approval_requested',
          title: 'Lead Approval Requested',
          message: `Candidate submission ${saved.submissionId} requires your review`,
          entityId: new Types.ObjectId(saved._id.toString()),
          entityType: 'submission',
        });
      } catch (e) {
        // Non-fatal
      }
    }

    const created = await this.findById(saved._id.toString(), currentUser);
    if (dto.clientEmails?.length || dto.leadEmail || dto.leadEmails?.length) {
      const senderName = currentUser?.name || currentUser?.recruiterName || 'Recruiter';
      await this.sendClientSubmissionEmail({
        clientEmails: dto.clientEmails,
        leadEmail: dto.leadEmail,
        leadEmails: dto.leadEmails,
        ccEmails: dto.ccEmails,
        subject: dto.emailSubject,
        candidateId: candidateObjectId.toString(),
        candidateIds: dto.candidateIds,
        requirementId: requirementObjectId.toString(),
        senderName: dto.recruiterName || senderName,
        senderEmail: dto.recruiterEmail,
        trackerColumns: dto.trackerColumns,
        trackerRows: dto.trackerRows,
        trackerHeaderColor: dto.trackerHeaderColor,
        emailGreeting: dto.emailGreeting,
        emailIntroduction: dto.emailIntroduction,
      });
    }
    return created;
  }

  /** PUT /api/v1/submissions/:id/stage */
  async updateStage(id: string, dto: UpdateStageDto, currentUser: any) {
    const doc = await this.loadSubmissionForUser(id, currentUser);

    const previousStage = doc.stage;
    const performedBy = currentUser?.id || currentUser?.userId
      ? new Types.ObjectId((currentUser.id || currentUser.userId).toString())
      : new Types.ObjectId();

    doc.stage = dto.stage;

    if (dto.stage === 'Submitted to Lead') {
      doc.leadApprovalStatus = 'Pending';
      if (this.notificationsService && doc.leadId) {
        try {
          await this.notificationsService.createNotification({
            orgId: new Types.ObjectId(doc.orgId.toString()),
            userId: new Types.ObjectId(doc.leadId.toString()),
            type: 'lead_approval_requested',
            title: 'Lead Approval Requested',
            message: `Candidate submission ${doc.submissionId} requires your review`,
            entityId: new Types.ObjectId(doc._id.toString()),
            entityType: 'submission',
          });
        } catch (e) {}
      }
    } else if (dto.stage === 'Submitted to Client') {
      doc.leadApprovalStatus = 'Approved';
      doc.leadApprovedAt = doc.leadApprovedAt || new Date();
      doc.clientForwardedAt = new Date();
    } else if (dto.stage === 'Approved') {
      doc.leadApprovalStatus = 'Approved';
      doc.leadApprovedAt = new Date();
    }

    const updated = await doc.save();

    await this.logHistory(
      new Types.ObjectId(doc.orgId.toString()),
      new Types.ObjectId(doc._id.toString()),
      previousStage,
      updated.stage,
      performedBy,
      dto.notes || `Stage updated to ${updated.stage}`,
    );

    return this.findById(updated._id.toString(), currentUser);
  }

  /** POST /api/v1/submissions/:id/lead-approval */
  async leadApproval(id: string, dto: LeadApprovalDto, currentUser: any) {
    const doc = await this.loadSubmissionForUser(id, currentUser);

    const previousStage = doc.stage;
    const performedBy = currentUser?.id || currentUser?.userId
      ? new Types.ObjectId((currentUser.id || currentUser.userId).toString())
      : new Types.ObjectId();

    const approvalStatus = dto.status
      ? dto.status
      : dto.approved === true
      ? 'Approved'
      : dto.approved === false
      ? 'Rejected'
      : 'Approved';

    doc.leadApprovalStatus = approvalStatus;

    if (approvalStatus === 'Approved' || approvalStatus === 'Forwarded') {
      doc.leadApprovedAt = new Date();
      if (doc.stage === 'Submitted' || doc.stage === 'Submitted to Lead') {
        doc.stage = 'Submitted to Client';
        doc.clientForwardedAt = new Date();
      }
    } else if (approvalStatus === 'Rejected') {
      doc.stage = 'Rejected';
      doc.rejectionReason = dto.reason || dto.notes || 'Rejected by Team Lead';
    }

    const updated = await doc.save();

    await this.logHistory(
      new Types.ObjectId(doc.orgId.toString()),
      new Types.ObjectId(doc._id.toString()),
      previousStage,
      updated.stage,
      performedBy,
      dto.notes || `Lead approval set to ${approvalStatus}`,
    );

    // Notify recruiter
    if (this.notificationsService && doc.recruiterId) {
      try {
        await this.notificationsService.createNotification({
          orgId: new Types.ObjectId(doc.orgId.toString()),
          userId: new Types.ObjectId(doc.recruiterId.toString()),
          type: approvalStatus === 'Approved' ? 'submission_approved' : 'submission_rejected',
          title: `Submission ${approvalStatus}`,
          message: `Submission ${doc.submissionId} was ${approvalStatus.toLowerCase()} by Team Lead`,
          entityId: new Types.ObjectId(doc._id.toString()),
          entityType: 'submission',
        });
      } catch (e) {}
    }

    return this.findById(updated._id.toString(), currentUser);
  }

  /** POST /api/v1/submissions/:id/forward-client */
  async forwardClient(id: string, dto: ForwardClientDto, currentUser: any) {
    const doc = await this.loadSubmissionForUser(id, currentUser);

    const previousStage = doc.stage;
    const performedBy = currentUser?.id || currentUser?.userId
      ? new Types.ObjectId((currentUser.id || currentUser.userId).toString())
      : new Types.ObjectId();

    doc.stage = 'Submitted to Client';
    doc.leadApprovalStatus = 'Forwarded';
    doc.clientForwardedAt = new Date();

    const updated = await doc.save();

    await this.logHistory(
      new Types.ObjectId(doc.orgId.toString()),
      new Types.ObjectId(doc._id.toString()),
      previousStage,
      updated.stage,
      performedBy,
      dto.notes || 'Forwarded to Client',
    );

    const forwarded = await this.findById(updated._id.toString(), currentUser);
    if (dto.clientEmails?.length || dto.leadEmail || dto.leadEmails?.length) {
      const senderName = currentUser?.name || currentUser?.recruiterName || 'Recruiter';
      await this.sendClientSubmissionEmail({
        clientEmails: dto.clientEmails,
        leadEmail: dto.leadEmail,
        leadEmails: dto.leadEmails,
        ccEmails: dto.ccEmails,
        subject: dto.emailSubject,
        candidateId: doc.candidateId.toString(),
        candidateIds: dto.candidateIds,
        requirementId: doc.requirementId.toString(),
        senderName: dto.recruiterName || senderName,
        senderEmail: dto.recruiterEmail,
        trackerColumns: dto.trackerColumns,
        trackerRows: dto.trackerRows,
        trackerHeaderColor: dto.trackerHeaderColor,
        emailGreeting: dto.emailGreeting,
        emailIntroduction: dto.emailIntroduction,
      });
    }
    return forwarded;
  }

  private async sendClientSubmissionEmail(input: {
    clientEmails?: string[];
    leadEmail?: string;
    leadEmails?: string[];
    ccEmails?: string[];
    subject?: string;
    candidateId?: string;
    candidateIds?: string[];
    requirementId: string;
    senderName?: string;
    senderEmail?: string;
    trackerColumns?: string[];
    trackerRows?: Record<string, string>[];
    trackerHeaderColor?: string;
    emailGreeting?: string;
    emailIntroduction?: string;
  }) {
    const allowRequirementEmails =
      process.env.ENABLE_REQUIREMENT_EMAILS === 'true' ||
      process.env.ENABLE_SUBMISSION_EMAILS === 'true';

    if (!allowRequirementEmails) {
      this.logger.log(
        `Outbound requirement submission email blocked by policy (ENABLE_REQUIREMENT_EMAILS=false). Skipping email dispatch for requirement ${input.requirementId}.`,
      );
      return;
    }

    if (!this.mailService) {
      throw new ServiceUnavailableException('Email service is not available');
    }

    const requirement = await this.requirementModel.findById(input.requirementId).exec();
    const reqTitle = requirement?.title || '';
    const reqCode = requirement?.reqCode || '';
    const clientName = requirement?.clientName || '';

    const emailDefaults = getClientEmailDefaults(clientName);
    const normalizeEmail = (email: string) => String(email || '').trim().toLowerCase();
    const isEmail = (email: string) => email.includes('@');

    let rawClientEmails = input.clientEmails || [];
    let rawCcEmails = input.ccEmails || [];
    let senderEmail = input.senderEmail;

    if (emailDefaults) {
      if (!rawClientEmails.length) {
        rawClientEmails = emailDefaults.submission.to;
      }
      if (!rawCcEmails.length) {
        rawCcEmails = emailDefaults.submission.cc;
      }
      if (!senderEmail) {
        senderEmail = emailDefaults.submission.from;
      }
    }

    const clientTo = Array.from(
      new Set(rawClientEmails.map(normalizeEmail).filter(isEmail)),
    );
    const leadList = Array.from(
      new Set(
        [
          ...(input.leadEmails || []),
          ...(input.leadEmail ? [input.leadEmail] : []),
        ]
          .map(normalizeEmail)
          .filter(isEmail),
      ),
    ).filter((email) => !clientTo.includes(email));
    if (!clientTo.length && !leadList.length) return;

    const ccList = Array.from(new Set(rawCcEmails.map(normalizeEmail).filter(isEmail)))
      .filter((email) => !clientTo.includes(email) && !leadList.includes(email));

    const escapeHtml = (value: string) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const cell = (value: unknown) => {
      const text = String(value ?? '').trim();
      return escapeHtml(text || '—');
    };

    const pageColumns = (input.trackerColumns || []).map((column) => String(column || '').trim()).filter(Boolean);
    const pageRows = Array.isArray(input.trackerRows)
      ? input.trackerRows.filter((row) => row && typeof row === 'object')
      : [];

    let columns = pageColumns;
    let rows = pageRows;
    if (!columns.length || !rows.length) {
      const candidateIdList = [
        ...(input.candidateIds || []),
        ...(input.candidateId ? [input.candidateId] : []),
      ];
      const validObjectIds = Array.from(new Set(candidateIdList))
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));
      const candidates = validObjectIds.length
        ? await this.candidateModel.find({ _id: { $in: validObjectIds } }).exec()
        : [];
      const today = new Date();
      const submittedOn = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      columns = [
        'Sl No',
        'Submission Date',
        'Skillset',
        'Candidate Name',
        'Contact Number',
        'Email ID',
        'Total Yrs of Exp',
        'Relevant Exp',
        'Current Company',
        'Current CTC',
        'Expected CTC/Rate Card',
        'Notice Period',
        'Current Location',
        'Preferred Location',
        'Availability for Interview',
        'Reason',
        'Offer in Hand',
        'LinkedIn URL',
      ];
      rows = candidates.map((candidate, index) => {
        const skills = Array.isArray(candidate.skills) ? candidate.skills.filter(Boolean).join(', ') : '';
        const createdValue = (candidate as { createdAt?: Date | string }).createdAt;
        const created = createdValue ? new Date(createdValue) : null;
        const createdLabel = created && !Number.isNaN(created.getTime())
          ? `${String(created.getDate()).padStart(2, '0')}/${String(created.getMonth() + 1).padStart(2, '0')}/${created.getFullYear()}`
          : submittedOn;
        return {
          'Sl No': String(index + 1),
          'Submission Date': createdLabel,
          Skillset: skills,
          'Candidate Name': candidate.name || '',
          'Contact Number': candidate.phone || '',
          'Email ID': candidate.email || '',
          'Total Yrs of Exp': candidate.totalExperienceYears != null ? `${candidate.totalExperienceYears} Years` : '',
          'Relevant Exp': candidate.relevantExperienceYears != null ? `${candidate.relevantExperienceYears} Years` : '',
          'Current Company': candidate.currentCompany || '',
          'Current CTC': candidate.currentCtc != null ? String(candidate.currentCtc) : '',
          'Expected CTC/Rate Card': candidate.expectedCtc != null ? String(candidate.expectedCtc) : '',
          'Notice Period': candidate.noticePeriodDays != null ? `${candidate.noticePeriodDays} days` : '',
          'Current Location': candidate.currentLocation || '',
          'Preferred Location': candidate.preferredLocation || '',
          'Availability for Interview': candidate.interviewAvailability || '',
          Reason: candidate.reasonForChange || '',
          'Offer in Hand': candidate.offerInHand || '',
          'LinkedIn URL': candidate.linkedInUrl || '',
        };
      });
    }

    if (!rows.length) return;

    const headerColor = /^#[0-9A-Fa-f]{3,8}$/.test(String(input.trackerHeaderColor || '').trim())
      ? String(input.trackerHeaderColor).trim()
      : '#C5E0B4';
    const headerCells = columns
      .map((column) => `<th style="padding:8px 6px;border:1px solid #1e293b;background-color:${headerColor};color:#0f172a;text-align:left;font-size:10px;text-transform:uppercase;">${escapeHtml(column.replace(/\u200b/g, ''))}</th>`)
      .join('');
    const bodyRows = rows
      .map((row) => {
        const cells = columns
          .map((column) => `<td style="padding:6px 8px;border:1px solid #1e293b;vertical-align:top;">${cell(row[column])}</td>`)
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    const greeting = (input.emailGreeting || `Dear ${clientName || 'Hiring Team'},`).trim();
    const introduction = (input.emailIntroduction || `I hope you are doing well. Please find the attached resume and tracker below for the Role - ${reqTitle}.`).trim();
    const introHtml = introduction
      .split(/\n{2,}/)
      .map((paragraph) => `<p style="margin:0 0 12px 0;">${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
      .join('');
    const roleLine = [reqCode, reqTitle].filter(Boolean).join(' — ');
    const senderName = input.senderName || 'Recruiter';
    const subject = input.subject?.trim()
      || (roleLine ? `Candidate submission — ${roleLine}` : 'Candidate submission');

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:16px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
  <div style="max-width:1100px;margin:0 auto;background:#ffffff;border:1px solid #cbd5e1;">
    <div style="background-color:#0d1b3e;padding:18px 24px;">
      <span style="color:#ffffff;font-size:26px;font-weight:bold;letter-spacing:-0.5px;">metaforge</span>
    </div>
    <div style="padding:8px 24px 4px;font-size:12px;color:#475569;font-weight:bold;">Metaforge IT Solutions</div>
    <div style="border-bottom:2px solid #800000;margin:0 24px 20px;"></div>
    <div style="padding:0 24px 24px;font-size:13px;line-height:1.5;">
      <p style="margin:0 0 12px 0;">${escapeHtml(greeting)}</p>
      ${introHtml}
      <div style="overflow-x:auto;margin:8px 0 24px 0;">
        <table style="width:100%;border-collapse:collapse;font-size:11px;font-family:Arial,Helvetica,sans-serif;">
          <thead><tr>${headerCells}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>
      <p style="margin:0 0 4px 0;">Thank you for your time and consideration.</p>
      <p style="margin:0 0 16px 0;">We look forward to your feedback.</p>
      <p style="margin:0 0 2px 0;">Regards,</p>
      <p style="margin:0 0 2px 0;font-weight:bold;font-size:14px;color:#0f172a;">${escapeHtml(senderName)}</p>
      ${input.senderEmail ? `<p style="margin:0 0 2px 0;font-size:12px;color:#475569;">${escapeHtml(input.senderEmail)}</p>` : ''}
      <p style="margin:0;font-size:12px;color:#475569;font-weight:bold;">Metaforge IT Solutions</p>
    </div>
  </div>
</body>
</html>`;

    const text = [
      greeting,
      '',
      introduction,
      '',
      columns.map((column) => column.replace(/\u200b/g, '')).join('\t'),
      ...rows.map((row) => columns.map((column) => String(row[column] || '—').replace(/\s+/g, ' ')).join('\t')),
      '',
      'Thank you for your time and consideration.',
      'We look forward to your feedback.',
      '',
      'Regards,',
      senderName,
      input.senderEmail || '',
      'Metaforge IT Solutions',
    ].filter((line) => line !== undefined).join('\n');

    try {
      if (clientTo.length > 0) {
        await this.mailService.sendMail({
          from: senderEmail,
          to: clientTo,
          cc: ccList.length ? ccList : undefined,
          subject,
          text,
          html,
        });
      }
      if (leadList.length > 0) {
        await this.mailService.sendMail({
          from: senderEmail,
          to: leadList,
          cc: ccList.length ? ccList : undefined,
          subject: subject.startsWith('[Lead Review]') ? subject : `[Lead Review] ${subject}`,
          text,
          html,
        });
      }
    } catch {
      throw new ServiceUnavailableException('The submission was saved, but the email could not be sent.');
    }
  }

  /** DELETE /api/v1/submissions/:id */
  async softDelete(id: string, currentUser: any) {
    const existing = await this.loadSubmissionForUser(id, currentUser);
    const targetId = existing._id.toString();

    const deleted = await this.submissionRepository.softDelete(targetId, currentUser);
    const performedBy = currentUser?.id || currentUser?.userId
      ? new Types.ObjectId((currentUser.id || currentUser.userId).toString())
      : new Types.ObjectId();

    await this.logHistory(
      new Types.ObjectId(deleted.orgId.toString()),
      new Types.ObjectId(deleted._id.toString()),
      deleted.stage,
      'Deleted',
      performedBy,
      'Submission soft deleted',
    );

    return { message: `Submission '${deleted.submissionId}' soft-deleted successfully` };
  }
}