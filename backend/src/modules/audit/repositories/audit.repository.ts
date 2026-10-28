import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityLog, ActivityLogDocument } from '../schemas/activity-log.schema';

@Injectable()
export class AuditRepository {
  constructor(
    @InjectModel(ActivityLog.name)
    private readonly activityLogModel: Model<ActivityLogDocument>,
  ) {}

  async findAll(
    filter: Record<string, any>,
    page = 1,
    limit = 20,
  ): Promise<{ data: ActivityLog[]; total: number; page: number; limit: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const total = await this.activityLogModel.countDocuments(filter).exec();
    const data = await this.activityLogModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findById(orgId: Types.ObjectId, id: string): Promise<ActivityLogDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.activityLogModel.findOne({ _id: new Types.ObjectId(id), orgId }).exec();
  }

  async createLog(logData: Partial<ActivityLog>): Promise<ActivityLogDocument> {
    const newLog = new this.activityLogModel(logData);
    return newLog.save();
  }
}
