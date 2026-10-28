import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AIMatchScore, AIMatchScoreDocument } from '../schemas/ai-match-score.schema';
import { AIParsingJob, AIParsingJobDocument } from '../schemas/ai-parse-job.schema';

@Injectable()
export class AIRepository {
  constructor(
    @InjectModel(AIMatchScore.name)
    private readonly matchScoreModel: Model<AIMatchScoreDocument>,
    @InjectModel(AIParsingJob.name)
    private readonly parsingJobModel: Model<AIParsingJobDocument>,
  ) {}

  async findMatchScore(orgId: Types.ObjectId, candidateId: Types.ObjectId, requirementId: Types.ObjectId): Promise<AIMatchScoreDocument | null> {
    return this.matchScoreModel.findOne({ orgId, candidateId, requirementId }).exec();
  }

  async saveMatchScore(scoreData: Partial<AIMatchScore>): Promise<AIMatchScoreDocument> {
    const filter = {
      orgId: scoreData.orgId,
      candidateId: scoreData.candidateId,
      requirementId: scoreData.requirementId,
    };
    return this.matchScoreModel
      .findOneAndUpdate(filter, { $set: scoreData }, { upsert: true, new: true })
      .exec();
  }

  async findMatchScoresByOrg(orgId: Types.ObjectId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const total = await this.matchScoreModel.countDocuments({ orgId }).exec();
    const data = await this.matchScoreModel
      .find({ orgId })
      .populate('candidateId', 'name email skills')
      .populate('requirementId', 'reqCode title clientName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  async createParsingJob(jobData: Partial<AIParsingJob>): Promise<AIParsingJobDocument> {
    const newJob = new this.parsingJobModel(jobData);
    return newJob.save();
  }

  async updateParsingJob(orgId: Types.ObjectId, jobId: string, updateData: Partial<AIParsingJob>): Promise<AIParsingJobDocument | null> {
    return this.parsingJobModel.findOneAndUpdate({ orgId, jobId }, { $set: updateData }, { new: true }).exec();
  }
}
