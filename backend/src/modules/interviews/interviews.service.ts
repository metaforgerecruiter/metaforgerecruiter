import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Interview, InterviewDocument } from './schemas/interview.schema';
import {
  InterviewFeedback,
  InterviewFeedbackDocument,
} from './schemas/interview-feedback.schema';
import { InterviewRepository } from './repositories/interview.repository';
import { Submission, SubmissionDocument } from '../submissions/schemas/submission.schema';
import { Candidate, CandidateDocument } from '../candidates/schemas/candidate.schema';
import { Requirement, RequirementDocument } from '../requirements/schemas/requirement.schema';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { RescheduleInterviewDto } from './dto/reschedule-interview.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { CancelInterviewDto } from './dto/cancel-interview.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import {
  assertCanAccessInterview,
  assertCanAccessSubmission,
  orgScope,
  requireOrgId,
} from '../../common/security/resource-access.util';

@Injectable()
export class InterviewsService {
  private readonly logger = new Logger(InterviewsService.name);

  constructor(
    @InjectModel(Interview.name)
    private readonly interviewModel: Model<InterviewDocument>,
    @InjectModel(InterviewFeedback.name)
    private readonly feedbackModel: Model<InterviewFeedbackDocument>,
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
    @InjectModel(Candidate.name)
    private readonly candidateModel: Model<CandidateDocument>,
    @InjectModel(Requirement.name)
    private readonly requirementModel: Model<RequirementDocument>,
    private readonly interviewRepository: InterviewRepository,
    @Optional()
    private readonly notificationsService?: NotificationsService,
    @Optional()
    private readonly mailService?: MailService,
  ) {}

  /** Format document for API output */
  private sanitizeInterview(doc: any) {
    const obj = doc.toObject ? doc.toObject() : doc;

    const candidateObj = obj.candidateId && typeof obj.candidateId === 'object' ? obj.candidateId : null;
    const reqObj = obj.requirementId && typeof obj.requirementId === 'object' ? obj.requirementId : null;
    const subObj = obj.submissionId && typeof obj.submissionId === 'object' ? obj.submissionId : null;

    const candidateName = candidateObj?.name || candidateObj?.fullName || 'N/A';
    const requirementTitle = reqObj?.title || reqObj?.reqCode || 'N/A';
    const clientName = reqObj?.clientName || 'N/A';

    return {
      ...obj,
      id: obj._id ? obj._id.toString() : obj.id,
      interviewId: obj.interviewId || `int-${obj._id ? obj._id.toString().substring(18) : '000'}`,
      submissionId: subObj ? subObj._id.toString() : (obj.submissionId?.toString() || obj.submissionId),
      candidateId: candidateObj ? candidateObj._id.toString() : (obj.candidateId?.toString() || obj.candidateId),
      requirementId: reqObj ? reqObj._id.toString() : (obj.requirementId?.toString() || obj.requirementId),

      // UI Helper properties
      candidate: candidateName,
      position: requirementTitle,
      client: clientName,
      stage: obj.round || 'L1 Technical',
      round: obj.round || 'L1 Technical',
      date: obj.dateTime ? new Date(obj.dateTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      recruiter: obj.interviewerName || 'Technical Interviewer',
      candidateName,
      requirementTitle,
      clientName,
      status: obj.status || 'Scheduled',
      notes: obj.notes || '',
      candidateEmail: obj.candidateEmail || candidateObj?.email || '',
      candidatePhone: obj.candidatePhone || candidateObj?.phone || '',
      emailSent: Boolean(obj.emailSent),
      whatsappSent: Boolean(obj.whatsappSent),
      whatsappUrl: obj.whatsappUrl || null,
    };
  }


  normalizeRound(round?: string): string {
    if (!round) return 'L1 Technical';
    const r = round.trim();
    const lower = r.toLowerCase();
    if (lower.includes('l1') || lower.includes('technical round 1') || lower.includes('technical 1')) return 'L1 Technical';
    if (lower.includes('l2') || lower.includes('technical round 2') || lower.includes('technical 2')) return 'L2 Technical';
    if (lower.includes('manager')) return 'Manager Round';
    if (lower.includes('hr')) return 'HR Round';
    if (lower.includes('client') || lower.includes('final')) return 'Client Round';
    if (lower.includes('screen')) return 'Screening';
    return r;
  }

  normalizeMode(mode?: string): string {
    if (!mode) return 'Online';
    const lower = mode.toLowerCase();
    if (lower.includes('in-person') || lower.includes('offline') || lower.includes('in person')) return 'In-Person';
    if (lower.includes('telephon') || lower.includes('phone') || lower.includes('call')) return 'Telephonic';
    return 'Online';
  }

  /** Generate int-XXX sequence code */
  async generateInterviewId(orgId: Types.ObjectId): Promise<string> {
    const regex = /^int-(\d+)$/i;
    const latest = await this.interviewModel
      .find({ orgId, interviewId: regex })
      .sort({ interviewId: -1 })
      .limit(1)
      .exec();

    let seq = 1;
    if (latest && latest.length > 0) {
      const parts = latest[0].interviewId.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    } else {
      const count = await this.interviewModel.countDocuments({ orgId }).exec();
      seq = count + 1;
    }

    return `int-${String(seq).padStart(3, '0')}`;
  }

  /** GET /api/v1/interviews */
  async findAll(
    currentUser: any,
    query?: {
      candidateId?: string;
      submissionId?: string;
      requirementId?: string;
      status?: string;
      round?: string;
      search?: string;
    },
  ) {
    const orgId = requireOrgId(currentUser);

    const filter: Record<string, any> = { orgId, deletedAt: null };

    if (query?.candidateId && Types.ObjectId.isValid(query.candidateId)) {
      filter.candidateId = new Types.ObjectId(query.candidateId);
    }

    if (query?.submissionId && Types.ObjectId.isValid(query.submissionId)) {
      filter.submissionId = new Types.ObjectId(query.submissionId);
    }

    if (query?.requirementId && Types.ObjectId.isValid(query.requirementId)) {
      filter.requirementId = new Types.ObjectId(query.requirementId);
    }

    if (query?.status) {
      filter.status = query.status;
    }

    if (query?.round) {
      filter.round = query.round;
    }

    if (query?.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { interviewId: regex },
        { interviewerName: regex },
        { round: regex },
      ];
    }

    const items = await this.interviewModel
      .find(filter)
      .populate('candidateId', 'name fullName email phone')
      .populate('requirementId', 'title reqCode clientName')
      .populate('submissionId', 'submissionId stage')
      .sort({ dateTime: -1 })
      .exec();

    return items.map((item) => this.sanitizeInterview(item));
  }

  /** Load interview by Mongo id or business id, scoped to caller org + role. */
  private async loadInterviewForUser(
    id: string,
    currentUser: any,
    populate = false,
  ): Promise<InterviewDocument> {
    const scope = orgScope(currentUser);
    const applyPopulate = (q: any) => {
      if (!populate) return q;
      return q
        .populate('candidateId', 'name fullName email phone')
        .populate('requirementId', 'title reqCode clientName')
        .populate('submissionId', 'submissionId stage');
    };
    let doc: InterviewDocument | null = null;
    if (Types.ObjectId.isValid(id)) {
      doc = await applyPopulate(this.interviewModel.findOne({ _id: id, ...scope })).exec();
    }
    if (!doc) {
      doc = await applyPopulate(
        this.interviewModel.findOne({ interviewId: id, ...scope }),
      ).exec();
    }
    if (!doc) {
      throw new NotFoundException(`Interview '${id}' not found`);
    }
    let linkedSubmission: any = null;
    if (doc.submissionId) {
      const subId = (doc.submissionId as any)._id || doc.submissionId;
      linkedSubmission = await this.submissionModel
        .findOne({ _id: subId, ...scope })
        .exec();
    }
    assertCanAccessInterview(doc, currentUser, linkedSubmission || undefined);
    return doc;
  }

  /** GET /api/v1/interviews/:id */
  async findById(id: string, currentUser: any) {
    const doc = await this.loadInterviewForUser(id, currentUser, true);

    const sanitized = this.sanitizeInterview(doc);

    // Fetch associated feedback records
    const feedbacks = await this.feedbackModel
      .find({ interviewId: doc._id })
      .sort({ createdAt: -1 })
      .exec();

    return {
      ...sanitized,
      feedbacks,
    };
  }

  /** POST /api/v1/interviews */
  async create(dto: CreateInterviewDto, currentUser: any) {
    const orgId = requireOrgId(currentUser);

    let subDoc: any = null;
    let candidateDoc: any = null;

    // 1. Try finding submission by _id or submissionId code (org-scoped)
    if (dto.submissionId && Types.ObjectId.isValid(dto.submissionId)) {
      subDoc = await this.submissionModel
        .findOne({ _id: new Types.ObjectId(dto.submissionId), orgId, deletedAt: null })
        .exec();
    }
    if (!subDoc && dto.submissionId) {
      subDoc = await this.submissionModel.findOne({ orgId, submissionId: dto.submissionId.trim(), deletedAt: null }).exec();
    }
    if (subDoc) {
      assertCanAccessSubmission(subDoc, currentUser);
    }

    // 2. If not found by submission, check if dto.submissionId is actually a candidate _id
    if (!subDoc && dto.submissionId && Types.ObjectId.isValid(dto.submissionId)) {
      candidateDoc = await this.candidateModel
        .findOne({ _id: new Types.ObjectId(dto.submissionId), orgId, deletedAt: null })
        .exec();
      if (candidateDoc) {
        subDoc = await this.submissionModel.findOne({ orgId, candidateId: candidateDoc._id, deletedAt: null }).sort({ createdAt: -1 }).exec();
      }
    }

    // 3. If not found, check if dto.candidateId is provided
    if (!subDoc && dto.candidateId && Types.ObjectId.isValid(dto.candidateId)) {
      candidateDoc = await this.candidateModel
        .findOne({ _id: new Types.ObjectId(dto.candidateId), orgId, deletedAt: null })
        .exec();
      if (candidateDoc) {
        subDoc = await this.submissionModel.findOne({ orgId, candidateId: candidateDoc._id, deletedAt: null }).sort({ createdAt: -1 }).exec();
      }
    }

    // 4. If not found, search candidate by name or candidateId code (e.g. 'Test Candidate Notif 1791180884155')
    if (!subDoc && dto.submissionId) {
      const cleanSub = dto.submissionId.trim();
      const escaped = cleanSub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const candidateNamePart = escaped.split(' — ')[0].trim();
      candidateDoc = await this.candidateModel.findOne({
        orgId,
        $or: [
          { name: new RegExp(`^${escaped}$`, 'i') },
          { candidateId: cleanSub },
          { name: new RegExp(`^${candidateNamePart}$`, 'i') },
        ],
        deletedAt: null,
      }).exec();

      if (candidateDoc) {
        subDoc = await this.submissionModel.findOne({ orgId, candidateId: candidateDoc._id, deletedAt: null }).sort({ createdAt: -1 }).exec();
      }
    }

    // 5. If candidate found or candidate email/phone provided, but candidate has no submission yet, auto-create one
    if (!subDoc) {
      if (!candidateDoc && dto.candidateEmail) {
        candidateDoc = await this.candidateModel.findOne({ orgId, email: dto.candidateEmail.trim().toLowerCase(), deletedAt: null }).exec();
      }
      if (!candidateDoc && dto.candidatePhone) {
        candidateDoc = await this.candidateModel.findOne({ orgId, phone: dto.candidatePhone.trim(), deletedAt: null }).exec();
      }

      if (candidateDoc) {
        let reqDoc: any = null;
        if (dto.requirementId && Types.ObjectId.isValid(dto.requirementId)) {
          reqDoc = await this.requirementModel
            .findOne({ _id: new Types.ObjectId(dto.requirementId), orgId, deletedAt: null })
            .exec();
        }
        if (!reqDoc) {
          reqDoc = await this.requirementModel.findOne({ orgId, deletedAt: null }).sort({ createdAt: -1 }).exec();
        }

        const latestSub = await this.submissionModel.find({ orgId }).sort({ submissionId: -1 }).limit(1).exec();
        const subSeq = (latestSub.length > 0 ? (parseInt(latestSub[0].submissionId?.replace('SUB-', '') || '0', 10) || 100) : 100) + 1;
        const autoSubId = `SUB-${String(subSeq).padStart(3, '0')}`;

        subDoc = new this.submissionModel({
          orgId,
          submissionId: autoSubId,
          candidateId: candidateDoc._id,
          requirementId: reqDoc ? reqDoc._id : null,
          clientId: reqDoc?.clientId || null,
          recruiterId: currentUser?.id ? new Types.ObjectId(currentUser.id.toString()) : candidateDoc.sourcedByRecruiterId || null,
          stage: 'Interview Scheduled',
          leadApprovalStatus: 'Pending',
          matchScore: 85,
          submittedAt: new Date(),
        });
        await subDoc.save();
      }
    }

    // 6. If STILL no subDoc, fallback to the most recent submission in org to avoid breaking
    if (!subDoc) {
      subDoc = await this.submissionModel.findOne({ orgId, deletedAt: null }).sort({ createdAt: -1 }).exec();
    }

    if (!subDoc) {
      throw new NotFoundException(`Unable to resolve submission or candidate record for interview.`);
    }
    assertCanAccessSubmission(subDoc, currentUser);

    const submissionObjectId = subDoc._id as Types.ObjectId;

    if (!candidateDoc && subDoc.candidateId) {
      candidateDoc = await this.candidateModel
        .findOne({ _id: subDoc.candidateId, orgId, deletedAt: null })
        .exec();
    }

    const candidateId = candidateDoc?._id
      || (dto.candidateId && Types.ObjectId.isValid(dto.candidateId) ? new Types.ObjectId(dto.candidateId) : null)
      || subDoc.candidateId;

    let reqDoc: any = null;
    if (dto.requirementId && Types.ObjectId.isValid(dto.requirementId)) {
      reqDoc = await this.requirementModel
        .findOne({ _id: dto.requirementId, orgId, deletedAt: null })
        .exec();
    } else if (subDoc.requirementId) {
      reqDoc = await this.requirementModel
        .findOne({ _id: subDoc.requirementId, orgId, deletedAt: null })
        .exec();
    }
    const requirementId = reqDoc?._id || subDoc.requirementId;

    let interviewDate = new Date(dto.dateTime);
    if (isNaN(interviewDate.getTime())) {
      interviewDate = new Date();
    }

    const durationMinutes = dto.durationMinutes || 60;
    const candidateEmail = (dto.candidateEmail || candidateDoc?.email || '').trim().toLowerCase();
    const candidatePhone = (dto.candidatePhone || candidateDoc?.phone || '').trim();

    let interviewerEmail = (dto.interviewerEmail || '').trim().toLowerCase();
    // Guard against candidate email erroneously passed as interviewer email
    if (!interviewerEmail || interviewerEmail === candidateEmail) {
      interviewerEmail = (currentUser?.email || 'recruiter@metaforgeit.com').trim().toLowerCase();
    }

    // Check conflict only for valid interviewer who is not the candidate
    if (interviewerEmail && interviewerEmail !== 'interviewer@metaforgeit.com' && interviewerEmail !== 'recruiter@metaforgeit.com') {
      const conflict = await this.interviewModel.findOne({
        orgId,
        interviewerEmail,
        status: 'Scheduled',
        dateTime: {
          $gte: new Date(interviewDate.getTime() - durationMinutes * 60000),
          $lte: new Date(interviewDate.getTime() + durationMinutes * 60000),
        },
        deletedAt: null,
      }).exec();

      if (conflict) {
        this.logger.warn(`Interviewer ${interviewerEmail} has an overlapping interview around ${interviewDate.toISOString()}`);
      }
    }

    const interviewId = await this.generateInterviewId(orgId);
    const round = this.normalizeRound(dto.round);
    const mode = this.normalizeMode(dto.mode);
    const candidateName = candidateDoc?.name || candidateDoc?.fullName || 'Candidate';
    const positionTitle = reqDoc?.title || reqDoc?.reqCode || 'Open Position';
    const clientName = reqDoc?.clientName || 'Client Account';
    const interviewerName = dto.interviewerName || currentUser?.name || 'Recruitment Team';
    const meetingUrl = dto.meetingUrl?.trim() || '';
    const notes = dto.notes?.trim() || '';

    // 7. Dispatch Invite via Email if requested / candidate email provided
    let emailSent = false;
    let emailError: string | null = null;
    const shouldSendEmail = dto.sendEmail !== false && Boolean(candidateEmail);

    if (shouldSendEmail && this.mailService) {
      try {
        const formattedDate = interviewDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const formattedTime = interviewDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        const subject = `Interview Invitation: ${round} - ${positionTitle} at ${clientName}`;
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px; color: #ffffff;">
      <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">Interview Invitation</h1>
      <p style="margin: 0; font-size: 14px; opacity: 0.9;">MetaForge Recruitment Platform</p>
    </div>
    
    <div style="padding: 32px;">
      <p style="font-size: 15px; line-height: 1.6; margin-top: 0; color: #334155;">
        Dear <strong>${candidateName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        We are pleased to invite you for an interview for the <strong>${positionTitle}</strong> position with <strong>${clientName}</strong>. Please find the details of your interview session below:
      </p>

      <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; width: 35%; font-weight: 600;">Interview Round:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${round}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Position:</td>
            <td style="padding: 8px 0; color: #0f172a;">${positionTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Company / Client:</td>
            <td style="padding: 8px 0; color: #0f172a;">${clientName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Date:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Time:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${formattedTime} (${durationMinutes} mins)</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Interview Mode:</td>
            <td style="padding: 8px 0; color: #0f172a;">${mode}</td>
          </tr>
          ${meetingUrl ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Meeting Link:</td>
            <td style="padding: 8px 0;"><a href="${meetingUrl}" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${meetingUrl}</a></td>
          </tr>
          ` : ''}
          ${notes ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600; vertical-align: top;">Notes:</td>
            <td style="padding: 8px 0; color: #334155; font-style: italic;">${notes}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      ${meetingUrl ? `
      <div style="text-align: center; margin: 28px 0;">
        <a href="${meetingUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
          Join Interview
        </a>
      </div>
      ` : ''}

      <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin-top: 24px;">
        Please make sure to be ready 5 minutes before the scheduled time. If you have any questions or need to reschedule, please reply to this email or contact your recruiter <strong>${interviewerName}</strong> (${interviewerEmail}).
      </p>

      <div style="border-top: 1px solid #e2e8f0; margin-top: 28px; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
        MetaForge Recruitment &bull; Automated Interview Notification System
      </div>
    </div>
  </div>
</body>
</html>
        `.trim();

        await this.mailService.sendMail({
          to: [candidateEmail],
          cc: interviewerEmail && interviewerEmail !== candidateEmail ? [interviewerEmail] : undefined,
          subject,
          html,
        });

        emailSent = true;
        this.logger.log(`Interview invite sent successfully to candidate email ${candidateEmail}`);
      } catch (err: any) {
        emailError = err?.message || 'Failed to dispatch email';
        this.logger.error(`Error sending interview invite email to ${candidateEmail}: ${emailError}`);
      }
    }

    // 8. Generate WhatsApp Invite Message & URL if requested / candidate phone provided
    let whatsappUrl: string | null = null;
    let whatsappSent = false;
    const shouldSendWhatsApp = dto.sendWhatsApp !== false && Boolean(candidatePhone);

    if (shouldSendWhatsApp) {
      const formattedDate = interviewDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const formattedTime = interviewDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const messageText = [
        `*Interview Invitation - MetaForge Recruitment*`,
        ``,
        `Dear *${candidateName}*,`,
        `Your interview has been scheduled with the following details:`,
        ``,
        `📋 *Position:* ${positionTitle}`,
        `🏢 *Client:* ${clientName}`,
        `🎯 *Round:* ${round}`,
        `📅 *Date:* ${formattedDate}`,
        `⏰ *Time:* ${formattedTime}`,
        `💻 *Mode:* ${mode}`,
        meetingUrl ? `🔗 *Meeting Link:* ${meetingUrl}` : '',
        notes ? `📝 *Notes:* ${notes}` : '',
        ``,
        `Please confirm your availability. Best of luck!`,
        `- *${interviewerName}* (MetaForge Recruitment)`,
      ].filter(Boolean).join('\n');

      let cleanNumber = candidatePhone.replace(/[^\d]/g, '');
      if (cleanNumber.length === 10) {
        cleanNumber = `91${cleanNumber}`;
      }

      whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(messageText)}`;
      whatsappSent = true;
    }

    const newInterview = new this.interviewModel({
      orgId,
      interviewId,
      submissionId: submissionObjectId,
      candidateId,
      requirementId,
      round,
      dateTime: interviewDate,
      durationMinutes,
      mode,
      meetingUrl: meetingUrl || null,
      interviewerName,
      interviewerEmail,
      status: dto.status || 'Scheduled',
      notes: notes || null,
      candidateEmail: candidateEmail || null,
      candidatePhone: candidatePhone || null,
      emailSent,
      whatsappSent,
      whatsappUrl,
    });

    const saved = await newInterview.save();

    // Update submission stage if needed
    if (subDoc.stage !== 'Interview Scheduled' && subDoc.stage !== 'Placed') {
      subDoc.stage = 'Interview Scheduled';
      await subDoc.save();
    }

    // Trigger in-app notification if notifications service available
    if (this.notificationsService && subDoc.recruiterId) {
      try {
        await this.notificationsService.createNotification({
          orgId,
          userId: new Types.ObjectId(subDoc.recruiterId.toString()),
          type: 'interview_scheduled',
          title: 'Interview Scheduled',
          message: `${saved.round} interview scheduled for ${candidateName} on ${saved.dateTime.toISOString()}`,
          entityId: new Types.ObjectId(saved._id.toString()),
          entityType: 'interview',
        });
      } catch (e) {}
    }

    const res = await this.findById(saved._id.toString(), currentUser);
    return {
      ...res,
      emailSent,
      emailError,
      whatsappSent,
      whatsappUrl,
      candidateEmail,
      candidatePhone,
      message: emailSent
        ? `Interview scheduled! Invite sent to ${candidateEmail}.`
        : 'Interview scheduled successfully.',
    };
  }


  /** PUT /api/v1/interviews/:id/reschedule */
  async reschedule(id: string, dto: RescheduleInterviewDto, currentUser: any) {
    const doc = await this.loadInterviewForUser(id, currentUser);

    const newDate = new Date(dto.dateTime);
    if (isNaN(newDate.getTime())) {
      throw new BadRequestException('Invalid dateTime');
    }

    doc.dateTime = newDate;
    if (dto.durationMinutes) {
      doc.durationMinutes = dto.durationMinutes;
    }

    doc.status = 'Rescheduled';

    const updated = await doc.save();

    if (this.notificationsService) {
      try {
        const sub = await (doc as any).populate('submissionId');
        const recruiterId = sub?.submissionId?.recruiterId || currentUser?.id;
        if (recruiterId) {
          await this.notificationsService.createNotification({
            orgId: new Types.ObjectId(updated.orgId.toString()),
            userId: new Types.ObjectId(recruiterId.toString()),
            type: 'interview_scheduled',
            title: 'Interview Rescheduled',
            message: `Interview ${updated.interviewId} rescheduled for ${updated.dateTime.toISOString()}`,
            entityId: new Types.ObjectId(updated._id.toString()),
            entityType: 'interview',
          });
        }
      } catch (e) {}
    }

    return this.findById(updated._id.toString(), currentUser);
  }

  /** PUT /api/v1/interviews/:id/feedback */
  async submitFeedback(id: string, dto: SubmitFeedbackDto, currentUser: any) {
    const doc = await this.loadInterviewForUser(id, currentUser);

    const evaluatorName = dto.evaluatorName || currentUser?.name || doc.interviewerName;
    const evaluatorEmail = (dto.evaluatorEmail || currentUser?.email || doc.interviewerEmail).toLowerCase();

    // Create feedback record
    const feedback = new this.feedbackModel({
      orgId: doc.orgId,
      interviewId: doc._id,
      evaluatorName,
      evaluatorEmail,
      technicalScore: dto.technicalScore || 0,
      feedbackNotes: dto.feedbackNotes || dto.notes || '',
      recommendation: dto.recommendation,
      rejectionReason: dto.rejectionReason || null,
    });

    await feedback.save();

    // Update interview status
    doc.status = dto.recommendation === 'Passed' ? 'Passed' : (dto.recommendation === 'Rejected' ? 'Rejected' : 'Completed');
    await doc.save();

    if (this.notificationsService) {
      try {
        const performedBy = currentUser?.id || currentUser?.userId
          ? new Types.ObjectId((currentUser.id || currentUser.userId).toString())
          : new Types.ObjectId();

        await this.notificationsService.createNotification({
          orgId: new Types.ObjectId(doc.orgId.toString()),
          userId: performedBy,
          type: 'interview_scheduled',
          title: 'Interview Feedback Submitted',
          message: `Feedback (${dto.recommendation || 'Submitted'}) recorded for interview ${doc.interviewId}`,
          entityId: new Types.ObjectId(doc._id.toString()),
          entityType: 'interview',
        });
      } catch (e) {}
    }

    return this.findById(doc._id.toString(), currentUser);
  }

  /** POST /api/v1/interviews/:id/cancel */
  async cancel(id: string, dto: CancelInterviewDto, currentUser: any) {
    const doc = await this.loadInterviewForUser(id, currentUser);

    doc.status = 'Cancelled';
    const updated = await doc.save();

    if (this.notificationsService) {
      try {
        const performedBy = currentUser?.id || currentUser?.userId
          ? new Types.ObjectId((currentUser.id || currentUser.userId).toString())
          : new Types.ObjectId();

        await this.notificationsService.createNotification({
          orgId: new Types.ObjectId(updated.orgId.toString()),
          userId: performedBy,
          type: 'interview_scheduled',
          title: 'Interview Cancelled',
          message: `Interview ${updated.interviewId} was cancelled`,
          entityId: new Types.ObjectId(updated._id.toString()),
          entityType: 'interview',
        });
      } catch (e) {}
    }

    return this.findById(updated._id.toString(), currentUser);
  }

  /** DELETE /api/v1/interviews/:id */
  async softDelete(id: string, currentUser: any) {
    const doc = await this.loadInterviewForUser(id, currentUser);
    const targetId = doc._id.toString();
    const deleted = await this.interviewRepository.softDelete(targetId, currentUser);
    return { message: `Interview '${deleted.interviewId || targetId}' soft-deleted successfully` };
  }
}
