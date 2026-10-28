import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CandidateBlacklist, CandidateBlacklistDocument } from '../schemas/candidate-blacklist.schema';

@Injectable()
export class BlacklistRepository {
  constructor(
    @InjectModel(CandidateBlacklist.name)
    private readonly blacklistModel: Model<CandidateBlacklistDocument>,
  ) {}

  async findAll(
    filter: Record<string, any>,
    page = 1,
    limit = 20,
  ): Promise<{ data: CandidateBlacklistDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const total = await this.blacklistModel.countDocuments(filter).exec();
    const data = await this.blacklistModel
      .find(filter)
      .populate('candidateId', 'name email phone status')
      .populate('blacklistedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const totalPages = Math.ceil(total / limit) || 1;
    return { data, total, page, limit, totalPages };
  }

  async findById(orgId: Types.ObjectId, id: string): Promise<CandidateBlacklistDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.blacklistModel
      .findOne({ _id: new Types.ObjectId(id), orgId, deletedAt: null })
      .populate('candidateId', 'name email phone status')
      .populate('blacklistedBy', 'name email role')
      .exec();
  }

  async findByEmailOrPhone(orgId: Types.ObjectId, email: string, phone: string): Promise<CandidateBlacklistDocument | null> {
    return this.blacklistModel
      .findOne({
        orgId,
        deletedAt: null,
        $or: [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }],
      })
      .exec();
  }

  async create(data: Partial<CandidateBlacklist>): Promise<CandidateBlacklistDocument> {
    const newEntry = new this.blacklistModel(data);
    return newEntry.save();
  }

  async update(
    orgId: Types.ObjectId,
    id: string,
    updateData: Partial<CandidateBlacklist>,
  ): Promise<CandidateBlacklistDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.blacklistModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), orgId, deletedAt: null },
        { $set: updateData },
        { new: true },
      )
      .populate('candidateId', 'name email phone status')
      .populate('blacklistedBy', 'name email role')
      .exec();
  }

  async softDelete(orgId: Types.ObjectId, id: string): Promise<CandidateBlacklistDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.blacklistModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), orgId, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true },
      )
      .exec();
  }
}
