import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SavedSearch, SavedSearchDocument } from '../schemas/saved-search.schema';

@Injectable()
export class SavedSearchesRepository {
  constructor(
    @InjectModel(SavedSearch.name)
    private readonly savedSearchModel: Model<SavedSearchDocument>,
  ) {}

  async findAll(filter: Record<string, any>): Promise<SavedSearchDocument[]> {
    return this.savedSearchModel
      .find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(orgId: Types.ObjectId, id: string): Promise<SavedSearchDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.savedSearchModel
      .findOne({ _id: new Types.ObjectId(id), orgId, deletedAt: null })
      .populate('userId', 'name email role')
      .exec();
  }

  async findByNameAndUser(
    orgId: Types.ObjectId,
    userId: Types.ObjectId,
    name: string,
  ): Promise<SavedSearchDocument | null> {
    return this.savedSearchModel
      .findOne({
        orgId,
        userId,
        name: name.trim(),
        deletedAt: null,
      })
      .exec();
  }

  async create(data: Partial<SavedSearch>): Promise<SavedSearchDocument> {
    const newSearch = new this.savedSearchModel(data);
    return newSearch.save();
  }

  async update(
    orgId: Types.ObjectId,
    id: string,
    updateData: Partial<SavedSearch>,
  ): Promise<SavedSearchDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.savedSearchModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), orgId, deletedAt: null },
        { $set: updateData },
        { new: true },
      )
      .populate('userId', 'name email role')
      .exec();
  }

  async softDelete(orgId: Types.ObjectId, id: string): Promise<SavedSearchDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.savedSearchModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), orgId, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true },
      )
      .exec();
  }
}
