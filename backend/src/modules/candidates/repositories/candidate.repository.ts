import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { Candidate, CandidateDocument } from '../schemas/candidate.schema';

@Injectable()
export class CandidateRepository {
  constructor(
    @InjectModel(Candidate.name) private readonly candidateModel: Model<CandidateDocument>
  ) {}

  async findById(id: string | Types.ObjectId, currentUser?: any): Promise<CandidateDocument> {
    const doc = await this.candidateModel.findById(id, null, { currentUser }).exec();
    if (!doc) throw new NotFoundException(`Candidate not found`);
    return doc;
  }

  /**
   * Optimistic Concurrency Control Update
   */
  async updateWithVersion(
    id: string | Types.ObjectId,
    currentVersion: number,
    updateData: UpdateQuery<CandidateDocument>,
    currentUser?: any
  ): Promise<CandidateDocument> {
    const filter = { _id: id, __v: currentVersion };
    const updated = await this.candidateModel
      .findOneAndUpdate(filter, updateData, { new: true, currentUser })
      .exec();

    if (!updated) {
      throw new ConflictException(
        `Optimistic locking conflict: Candidate ${id} has been modified by another transaction`
      );
    }
    return updated;
  }

  /**
   * Uniform Soft Delete
   */
  async softDelete(id: string | Types.ObjectId, currentUser?: any): Promise<CandidateDocument> {
    const filter: any = { _id: id, deletedAt: null };
    if (currentUser?.orgId) {
      filter.orgId = new Types.ObjectId(currentUser.orgId.toString());
    }
    const updated = await this.candidateModel
      .findOneAndUpdate(filter, { deletedAt: new Date() }, { new: true, currentUser })
      .exec();

    if (!updated) throw new NotFoundException(`Candidate ${id} not found`);
    return updated;
  }
}
