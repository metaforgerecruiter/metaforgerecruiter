import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RecruiterAnalytics, RecruiterAnalyticsDocument } from '../schemas/recruiter-analytics.schema';

@Injectable()
export class AnalyticsRepository {
  constructor(
    @InjectModel(RecruiterAnalytics.name)
    private readonly recruiterAnalyticsModel: Model<RecruiterAnalyticsDocument>,
  ) {}

  async findByRecruiterAndDate(
    orgId: Types.ObjectId,
    recruiterId: Types.ObjectId,
    date: Date,
  ): Promise<RecruiterAnalyticsDocument | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.recruiterAnalyticsModel
      .findOne({
        orgId,
        recruiterId,
        date: { $gte: startOfDay, $lte: endOfDay },
      })
      .exec();
  }

  async getRecruiterDailyAnalytics(
    orgId: Types.ObjectId,
    startDate?: Date,
    endDate?: Date,
  ) {
    const filter: Record<string, any> = { orgId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    return this.recruiterAnalyticsModel.find(filter).sort({ date: -1 }).exec();
  }
}
