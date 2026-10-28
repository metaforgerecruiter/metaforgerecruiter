import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmailTemplate, EmailTemplateDocument } from '../schemas/email-template.schema';

@Injectable()
export class EmailTemplatesRepository {
  constructor(
    @InjectModel(EmailTemplate.name)
    private readonly emailTemplateModel: Model<EmailTemplateDocument>,
  ) {}

  async findAll(filter: Record<string, any>): Promise<EmailTemplateDocument[]> {
    return this.emailTemplateModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(orgId: Types.ObjectId, id: string): Promise<EmailTemplateDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.emailTemplateModel
      .findOne({ _id: new Types.ObjectId(id), orgId, deletedAt: null })
      .exec();
  }

  async findByName(orgId: Types.ObjectId, name: string): Promise<EmailTemplateDocument | null> {
    return this.emailTemplateModel
      .findOne({ orgId, name: name.trim(), deletedAt: null })
      .exec();
  }

  async create(data: Partial<EmailTemplate>): Promise<EmailTemplateDocument> {
    const newTemplate = new this.emailTemplateModel(data);
    return newTemplate.save();
  }

  async update(
    orgId: Types.ObjectId,
    id: string,
    updateData: Partial<EmailTemplate>,
  ): Promise<EmailTemplateDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.emailTemplateModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), orgId, deletedAt: null },
        { $set: updateData },
        { new: true },
      )
      .exec();
  }

  async softDelete(orgId: Types.ObjectId, id: string): Promise<EmailTemplateDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.emailTemplateModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), orgId, deletedAt: null },
        { $set: { deletedAt: new Date(), isActive: false } },
        { new: true },
      )
      .exec();
  }
}
