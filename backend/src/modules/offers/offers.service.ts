import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Offer, OfferDocument } from './schemas/offer.schema';
import { OfferRepository } from './repositories/offer.repository';
import { Submission, SubmissionDocument } from '../submissions/schemas/submission.schema';
import { Candidate, CandidateDocument } from '../candidates/schemas/candidate.schema';
import { Requirement, RequirementDocument } from '../requirements/schemas/requirement.schema';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { UpdateOfferStatusDto } from './dto/update-offer-status.dto';
import { NotificationsService } from '../notifications/notifications.service';
import {
  assertCanAccessSubmission,
  requireOrgId,
} from '../../common/security/resource-access.util';

@Injectable()
export class OffersService {
  constructor(
    @InjectModel(Offer.name)
    private readonly offerModel: Model<OfferDocument>,
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
    @InjectModel(Candidate.name)
    private readonly candidateModel: Model<CandidateDocument>,
    @InjectModel(Requirement.name)
    private readonly requirementModel: Model<RequirementDocument>,
    private readonly offerRepository: OfferRepository,
    @Optional()
    private readonly notificationsService?: NotificationsService,
  ) {}

  /** Format document for API output */
  private sanitizeOffer(doc: any) {
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
      offerId: obj.offerId || `OFR-${obj._id ? obj._id.toString().substring(18) : '000'}`,
      submissionId: subObj ? subObj._id.toString() : (obj.submissionId?.toString() || obj.submissionId),
      candidateId: candidateObj ? candidateObj._id.toString() : (obj.candidateId?.toString() || obj.candidateId),
      requirementId: reqObj ? reqObj._id.toString() : (obj.requirementId?.toString() || obj.requirementId),
      offeredCtc: typeof obj.offeredCtc === 'number' ? obj.offeredCtc : 0,
      joiningDate: obj.joiningDate || new Date(),
      status: obj.status || 'Offer Released',
      declinedReason: obj.declinedReason || null,
      notJoinedNote: obj.notJoinedNote || null,

      // UI helper properties
      candidate: candidateName,
      candidateName,
      requirementTitle,
      clientName,
      position: requirementTitle,
      createdAt: obj.createdAt || new Date(),
      updatedAt: obj.updatedAt || new Date(),
    };
  }

  /** Generate OFR-XXX sequence code */
  async generateOfferId(orgId: Types.ObjectId): Promise<string> {
    const regex = /^OFR-(\d+)$/i;
    const latest = await this.offerModel
      .find({ orgId, offerId: regex })
      .sort({ offerId: -1 })
      .limit(1)
      .exec();

    let seq = 1;
    if (latest && latest.length > 0) {
      const parts = latest[0].offerId.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    } else {
      const count = await this.offerModel.countDocuments({ orgId }).exec();
      seq = count + 1;
    }

    return `OFR-${String(seq).padStart(3, '0')}`;
  }

  /** GET /api/v1/offers */
  async findAll(
    currentUser: any,
    query?: {
      candidateId?: string;
      submissionId?: string;
      requirementId?: string;
      status?: string;
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

    if (query?.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.offerId = regex;
    }

    const items = await this.offerModel
      .find(filter)
      .populate('candidateId', 'name fullName email phone')
      .populate('requirementId', 'title reqCode clientName')
      .populate('submissionId', 'submissionId stage')
      .sort({ createdAt: -1 })
      .exec();

    return items.map((item) => this.sanitizeOffer(item));
  }

  /** GET /api/v1/offers/:id */
  async findById(id: string, currentUser: any) {
    const orgId = requireOrgId(currentUser);

    let doc: OfferDocument | null = null;

    if (Types.ObjectId.isValid(id)) {
      doc = await this.offerModel
        .findOne({ _id: id, orgId, deletedAt: null })
        .populate('candidateId', 'name fullName email phone')
        .populate('requirementId', 'title reqCode clientName')
        .populate('submissionId', 'submissionId stage')
        .exec();
    }

    if (!doc) {
      doc = await this.offerModel
        .findOne({ offerId: id, orgId, deletedAt: null })
        .populate('candidateId', 'name fullName email phone')
        .populate('requirementId', 'title reqCode clientName')
        .populate('submissionId', 'submissionId stage')
        .exec();
    }

    if (!doc) {
      throw new NotFoundException(`Offer '${id}' not found`);
    }

    return this.sanitizeOffer(doc);
  }

  /** POST /api/v1/offers */
  async create(dto: CreateOfferDto, currentUser: any) {
    const orgId = requireOrgId(currentUser);

    if (!Types.ObjectId.isValid(dto.submissionId)) {
      throw new BadRequestException('Invalid submissionId ObjectId');
    }

    const submissionObjectId = new Types.ObjectId(dto.submissionId);
    const subDoc = await this.submissionModel
      .findOne({ _id: submissionObjectId, orgId, deletedAt: null })
      .exec();

    if (!subDoc) {
      throw new NotFoundException(`Submission '${dto.submissionId}' not found`);
    }
    assertCanAccessSubmission(subDoc, currentUser);

    // Check duplicate active offer for submission
    const existing = await this.offerModel.findOne({
      orgId,
      submissionId: submissionObjectId,
      deletedAt: null,
    }).exec();

    if (existing) {
      throw new ConflictException(`An active offer (${existing.offerId}) already exists for this submission`);
    }

    const candidateId = dto.candidateId && Types.ObjectId.isValid(dto.candidateId)
      ? new Types.ObjectId(dto.candidateId)
      : new Types.ObjectId(subDoc.candidateId.toString());

    const requirementId = dto.requirementId && Types.ObjectId.isValid(dto.requirementId)
      ? new Types.ObjectId(dto.requirementId)
      : new Types.ObjectId(subDoc.requirementId.toString());

    const joiningDate = new Date(dto.joiningDate);
    if (isNaN(joiningDate.getTime())) {
      throw new BadRequestException('Invalid joiningDate');
    }

    const offerId = await this.generateOfferId(orgId);
    const initialStatus = dto.status || 'Offer Released';

    const newOffer = new this.offerModel({
      orgId,
      offerId,
      submissionId: submissionObjectId,
      candidateId,
      requirementId,
      offeredCtc: dto.offeredCtc,
      offerReleaseDate: new Date(),
      joiningDate,
      status: initialStatus,
      declinedReason: dto.declinedReason || null,
    });

    const saved = await newOffer.save();

    // Update submission stage to Offered
    if (subDoc.stage !== 'Offered' && subDoc.stage !== 'Placed') {
      subDoc.stage = 'Offered';
      await subDoc.save();
    }

    // Trigger notification
    if (this.notificationsService && subDoc.recruiterId) {
      try {
        await this.notificationsService.createNotification({
          orgId,
          userId: new Types.ObjectId(subDoc.recruiterId.toString()),
          type: 'offer_released',
          title: 'Offer Released',
          message: `Offer ${saved.offerId} released for candidate with CTC ${saved.offeredCtc}`,
          entityId: new Types.ObjectId(saved._id.toString()),
          entityType: 'offer',
        });
      } catch (e) {}
    }

    return this.findById(saved._id.toString(), currentUser);
  }

  /** PUT /api/v1/offers/:id */
  async update(id: string, dto: UpdateOfferDto, currentUser: any) {
    const orgId = requireOrgId(currentUser);

    let doc: OfferDocument | null = null;
    if (Types.ObjectId.isValid(id)) {
      doc = await this.offerModel.findOne({ _id: id, orgId, deletedAt: null }).exec();
    }
    if (!doc) {
      doc = await this.offerModel.findOne({ offerId: id, orgId, deletedAt: null }).exec();
    }

    if (!doc) {
      throw new NotFoundException(`Offer '${id}' not found`);
    }

    if (dto.offeredCtc !== undefined) doc.offeredCtc = dto.offeredCtc;
    if (dto.joiningDate !== undefined) {
      const d = new Date(dto.joiningDate);
      if (!isNaN(d.getTime())) doc.joiningDate = d;
    }
    if (dto.status !== undefined) {
      doc.status = dto.status;
      if (dto.status === 'Joined' || dto.status === 'Placed') {
        const subDoc = await this.submissionModel
          .findOne({ _id: doc.submissionId, orgId, deletedAt: null })
          .exec();
        if (subDoc) {
          subDoc.stage = 'Placed';
          await subDoc.save();
        }
      }
    }
    if (dto.declinedReason !== undefined) doc.declinedReason = dto.declinedReason;
    if (dto.notJoinedNote !== undefined) doc.notJoinedNote = dto.notJoinedNote;

    const updated = await doc.save();
    return this.findById(updated._id.toString(), currentUser);
  }

  /** PUT /api/v1/offers/:id/status */
  async updateStatus(id: string, dto: UpdateOfferStatusDto, currentUser: any) {
    const orgId = requireOrgId(currentUser);

    let doc: OfferDocument | null = null;
    if (Types.ObjectId.isValid(id)) {
      doc = await this.offerModel.findOne({ _id: id, orgId, deletedAt: null }).exec();
    }
    if (!doc) {
      doc = await this.offerModel.findOne({ offerId: id, orgId, deletedAt: null }).exec();
    }

    if (!doc) {
      throw new NotFoundException(`Offer '${id}' not found`);
    }

    doc.status = dto.status;
    if (dto.declinedReason !== undefined) doc.declinedReason = dto.declinedReason || dto.notes || null;
    if (dto.notJoinedNote !== undefined) doc.notJoinedNote = dto.notJoinedNote || dto.notes || null;

    if (dto.status === 'Joined' || dto.status === 'Placed') {
      const subDoc = await this.submissionModel.findById(doc.submissionId).exec();
      if (subDoc) {
        subDoc.stage = 'Placed';
        await subDoc.save();
      }
    }

    const updated = await doc.save();

    if (this.notificationsService) {
      try {
        const subDoc = await this.submissionModel.findById(doc.submissionId).exec();
        const recruiterId = subDoc?.recruiterId || currentUser?.id;
        if (recruiterId) {
          const type = dto.status === 'Placed' || dto.status === 'Joined' ? 'candidate_placed' : 'offer_released';
          await this.notificationsService.createNotification({
            orgId,
            userId: new Types.ObjectId(recruiterId.toString()),
            type,
            title: `Offer Status: ${dto.status}`,
            message: `Offer ${updated.offerId} status was updated to ${dto.status}`,
            entityId: new Types.ObjectId(updated._id.toString()),
            entityType: 'offer',
          });
        }
      } catch (e) {}
    }

    return this.findById(updated._id.toString(), currentUser);
  }

  /** DELETE /api/v1/offers/:id */
  async softDelete(id: string, currentUser: any) {
    const orgId = requireOrgId(currentUser);

    let targetId: string = id;
    if (Types.ObjectId.isValid(id)) {
      const byId = await this.offerModel.findOne({ _id: id, orgId, deletedAt: null }).exec();
      if (!byId) throw new NotFoundException(`Offer '${id}' not found`);
      targetId = byId._id.toString();
    } else {
      const doc = await this.offerModel.findOne({ offerId: id, orgId, deletedAt: null }).exec();
      if (!doc) throw new NotFoundException(`Offer '${id}' not found`);
      targetId = doc._id.toString();
    }

    const deleted = await this.offerRepository.softDelete(targetId, currentUser);
    return { message: `Offer '${deleted.offerId || targetId}' soft-deleted successfully` };
  }
}
