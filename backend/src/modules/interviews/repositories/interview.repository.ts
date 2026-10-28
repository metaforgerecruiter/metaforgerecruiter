import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { Interview, InterviewDocument } from '../schemas/interview.schema';

@Injectable()
export class InterviewRepository {
  constructor(
    @InjectModel(Interview.name) private readonly interviewModel: Model<InterviewDocument>
  ) {}

  async findById(id: string | Types.ObjectId, currentUser?: any): Promise<InterviewDocument> {
    const doc = await this.interviewModel.findById(id, null, { currentUser }).exec();
    if (!doc) throw new NotFoundException(`Interview not found`);
    return doc;
  }

  /**
   * Optimistic Concurrency Control Update
   */
  async updateWithVersion(
    id: string | Types.ObjectId,
    currentVersion: number,
    updateData: UpdateQuery<InterviewDocument>,
    currentUser?: any
  ): Promise<InterviewDocument> {
    const filter = { _id: id, __v: currentVersion };
    const updated = await this.interviewModel
      .findOneAndUpdate(filter, updateData, { new: true, currentUser })
      .exec();

    if (!updated) {
      throw new ConflictException(
        `Optimistic locking conflict: Interview ${id} has been modified by another transaction`
      );
    }
    return updated;
  }

  /**
   * Uniform Soft Delete
   */
  async softDelete(id: string | Types.ObjectId, currentUser?: any): Promise<InterviewDocument> {
    const filter: any = { _id: id, deletedAt: null };
    if (currentUser?.orgId) {
      filter.orgId = new Types.ObjectId(currentUser.orgId.toString());
    }
    const updated = await this.interviewModel
      .findOneAndUpdate(filter, { deletedAt: new Date() }, { new: true, currentUser })
      .exec();

    if (!updated) throw new NotFoundException(`Interview ${id} not found`);
    return updated;
  }
}
