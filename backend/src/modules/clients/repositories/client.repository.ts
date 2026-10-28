import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { Client, ClientDocument } from '../schemas/client.schema';

@Injectable()
export class ClientRepository {
  constructor(
    @InjectModel(Client.name) private readonly clientModel: Model<ClientDocument>
  ) {}

  async findById(id: string | Types.ObjectId, currentUser?: any): Promise<ClientDocument> {
    const doc = await this.clientModel.findById(id, null, { currentUser }).exec();
    if (!doc) throw new NotFoundException(`Client not found`);
    return doc;
  }

  /**
   * Optimistic Concurrency Control Update
   */
  async updateWithVersion(
    id: string | Types.ObjectId,
    currentVersion: number,
    updateData: UpdateQuery<ClientDocument>,
    currentUser?: any
  ): Promise<ClientDocument> {
    const filter = { _id: id, __v: currentVersion };
    const updated = await this.clientModel
      .findOneAndUpdate(filter, updateData, { new: true, currentUser })
      .exec();

    if (!updated) {
      throw new ConflictException(
        `Optimistic locking conflict: Client ${id} has been modified by another transaction`
      );
    }
    return updated;
  }

  /**
   * Uniform Soft Delete
   */
  async softDelete(id: string | Types.ObjectId, currentUser?: any): Promise<ClientDocument> {
    const filter: any = { _id: id, deletedAt: null };
    if (currentUser?.orgId) {
      filter.orgId = new Types.ObjectId(currentUser.orgId.toString());
    }
    const updated = await this.clientModel
      .findOneAndUpdate(filter, { deletedAt: new Date() }, { new: true, currentUser })
      .exec();

    if (!updated) throw new NotFoundException(`Client ${id} not found`);
    return updated;
  }
}
