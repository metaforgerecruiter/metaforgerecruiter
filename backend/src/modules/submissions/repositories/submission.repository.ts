import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { Submission, SubmissionDocument } from '../schemas/submission.schema';

@Injectable()
export class SubmissionRepository {
  constructor(
    @InjectModel(Submission.name) private readonly submissionModel: Model<SubmissionDocument>
  ) {}

  async findById(id: string | Types.ObjectId, currentUser?: any): Promise<SubmissionDocument> {
    const doc = await this.submissionModel.findById(id, null, { currentUser }).exec();
    if (!doc) throw new NotFoundException(`Submission not found`);
    return doc;
  }

  /**
   * Optimistic Concurrency Control Update (P0-02)
   */
  async updateWithVersion(
    id: string | Types.ObjectId,
    currentVersion: number,
    updateData: UpdateQuery<SubmissionDocument>,
    currentUser?: any
  ): Promise<SubmissionDocument> {
    const filter = { _id: id, __v: currentVersion };
    const updated = await this.submissionModel
      .findOneAndUpdate(filter, updateData, { new: true, currentUser })
      .exec();

    if (!updated) {
      throw new ConflictException(
        `Optimistic locking conflict: Submission ${id} has been modified by another transaction (version mismatch __v=${currentVersion})`
      );
    }
    return updated;
  }

  /**
   * Uniform Soft Delete (P0-04)
   */
  async softDelete(id: string | Types.ObjectId, currentUser?: any): Promise<SubmissionDocument> {
    const filter: any = { _id: id, deletedAt: null };
    if (currentUser?.orgId) {
      filter.orgId = new Types.ObjectId(currentUser.orgId.toString());
    }
    const updated = await this.submissionModel
      .findOneAndUpdate(filter, { deletedAt: new Date() }, { new: true, currentUser })
      .exec();

    if (!updated) throw new NotFoundException(`Submission ${id} not found`);
    return updated;
  }
}
