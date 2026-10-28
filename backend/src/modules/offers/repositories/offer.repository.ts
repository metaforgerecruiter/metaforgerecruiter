import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { Offer, OfferDocument } from '../schemas/offer.schema';

@Injectable()
export class OfferRepository {
  constructor(
    @InjectModel(Offer.name) private readonly offerModel: Model<OfferDocument>
  ) {}

  async findById(id: string | Types.ObjectId, currentUser?: any): Promise<OfferDocument> {
    const doc = await this.offerModel.findById(id, null, { currentUser }).exec();
    if (!doc) throw new NotFoundException(`Offer not found`);
    return doc;
  }

  /**
   * Optimistic Concurrency Control Update (P0-02)
   */
  async updateWithVersion(
    id: string | Types.ObjectId,
    currentVersion: number,
    updateData: UpdateQuery<OfferDocument>,
    currentUser?: any
  ): Promise<OfferDocument> {
    const filter = { _id: id, __v: currentVersion };
    const updated = await this.offerModel
      .findOneAndUpdate(filter, updateData, { new: true, currentUser })
      .exec();

    if (!updated) {
      throw new ConflictException(
        `Optimistic locking conflict: Offer ${id} has been modified by another transaction (version mismatch __v=${currentVersion})`
      );
    }
    return updated;
  }

  /**
   * Uniform Soft Delete (P0-04)
   */
  async softDelete(id: string | Types.ObjectId, currentUser?: any): Promise<OfferDocument> {
    const filter: any = { _id: id, deletedAt: null };
    if (currentUser?.orgId) {
      filter.orgId = new Types.ObjectId(currentUser.orgId.toString());
    }
    const updated = await this.offerModel
      .findOneAndUpdate(filter, { deletedAt: new Date() }, { new: true, currentUser })
      .exec();

    if (!updated) throw new NotFoundException(`Offer ${id} not found`);
    return updated;
  }
}
