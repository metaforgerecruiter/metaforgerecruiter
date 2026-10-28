import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FileMetadata, FileMetadataDocument } from '../schemas/file-metadata.schema';

@Injectable()
export class FilesRepository {
  constructor(
    @InjectModel(FileMetadata.name)
    private readonly fileMetadataModel: Model<FileMetadataDocument>,
  ) {}

  async findAll(
    filter: Record<string, any>,
    page = 1,
    limit = 20,
  ): Promise<{ data: FileMetadataDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const total = await this.fileMetadataModel.countDocuments(filter).exec();
    const data = await this.fileMetadataModel
      .find(filter)
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const totalPages = Math.ceil(total / limit) || 1;
    return { data, total, page, limit, totalPages };
  }

  async findById(orgId: Types.ObjectId, id: string): Promise<FileMetadataDocument | null> {
    const filter: Record<string, any> = { orgId, deletedAt: null };
    if (Types.ObjectId.isValid(id)) {
      filter.$or = [{ _id: new Types.ObjectId(id) }, { fileId: id }];
    } else {
      filter.fileId = id;
    }

    return this.fileMetadataModel
      .findOne(filter)
      .populate('uploadedBy', 'name email role')
      .exec();
  }

  async create(fileData: Partial<FileMetadata>): Promise<FileMetadataDocument> {
    const newFile = new this.fileMetadataModel(fileData);
    return newFile.save();
  }

  async softDelete(orgId: Types.ObjectId, id: string): Promise<FileMetadataDocument | null> {
    const filter: Record<string, any> = { orgId, deletedAt: null };
    if (Types.ObjectId.isValid(id)) {
      filter.$or = [{ _id: new Types.ObjectId(id) }, { fileId: id }];
    } else {
      filter.fileId = id;
    }

    return this.fileMetadataModel
      .findOneAndUpdate(
        filter,
        { $set: { deletedAt: new Date() } },
        { new: true },
      )
      .exec();
  }

  async countFiles(orgId: Types.ObjectId): Promise<number> {
    return this.fileMetadataModel.countDocuments({ orgId, deletedAt: null }).exec();
  }
}
