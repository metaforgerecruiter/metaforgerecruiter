import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Organization,
  OrganizationDocument,
} from './schemas/organization.schema';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
  ) {}

  async create(data: {
    name: string;
    slug: string;
    tier?: string;
    active?: boolean;
  }): Promise<OrganizationDocument> {
    const existingName = await this.organizationModel
      .findOne({ name: data.name })
      .exec();

    if (existingName) {
      throw new ConflictException(
        'Organization with this name already exists',
      );
    }

    const existingSlug = await this.organizationModel
      .findOne({ slug: data.slug })
      .exec();

    if (existingSlug) {
      throw new ConflictException(
        'Organization with this slug already exists',
      );
    }

    return this.organizationModel.create({
      name: data.name,
      slug: data.slug,
      tier: data.tier ?? 'Professional',
      active: data.active ?? true,
      schemaVersion: 1,
    });
  }

  async findAll(): Promise<OrganizationDocument[]> {
    return this.organizationModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<OrganizationDocument> {
    const organization = await this.organizationModel
      .findById(id)
      .exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }
}