import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { Requirement, RequirementDocument } from '../schemas/requirement.schema';

@Injectable()
export class RequirementRepository {
  constructor(
    @InjectModel(Requirement.name) private readonly requirementModel: Model<RequirementDocument>
  ) {}

  async findById(id: string | Types.ObjectId, currentUser?: any): Promise<RequirementDocument> {
    const doc = await this.requirementModel.findById(id, null, { currentUser }).exec();
    if (!doc) throw new NotFoundException(`Requirement not found`);
    return doc;
  }

  /**
   * Optimistic Concurrency Control Update (P0-02)
   */
  async updateWithVersion(
    id: string | Types.ObjectId,
    currentVersion: number,
    updateData: UpdateQuery<RequirementDocument>,
    currentUser?: any
  ): Promise<RequirementDocument> {
    const filter = { _id: id, __v: currentVersion };
    const updated = await this.requirementModel
      .findOneAndUpdate(filter, updateData, { new: true, currentUser })
      .exec();

    if (!updated) {
      throw new ConflictException(
        `Optimistic locking conflict: Requirement ${id} has been modified by another transaction (version mismatch __v=${currentVersion})`
      );
    }
    return updated;
  }

  /**
   * Uniform Soft Delete (P0-04)
   */
  async softDelete(id: string | Types.ObjectId, currentUser?: any): Promise<RequirementDocument> {
    const filter: any = { _id: id, deletedAt: null };
    if (currentUser?.orgId) {
      filter.orgId = new Types.ObjectId(currentUser.orgId.toString());
    }
    const updated = await this.requirementModel
      .findOneAndUpdate(filter, { deletedAt: new Date() }, { new: true, currentUser })
      .exec();

    if (!updated) throw new NotFoundException(`Requirement ${id} not found`);
    return updated;
  }
}
