import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { EmailTemplatesRepository } from './repositories/email-templates.repository';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';

@Injectable()
export class EmailTemplatesService {
  constructor(
    private readonly emailTemplatesRepository: EmailTemplatesRepository,
  ) {}

  private getOrgId(currentUser: any): Types.ObjectId {
    return currentUser?.orgId
      ? new Types.ObjectId(currentUser.orgId.toString())
      : new Types.ObjectId('6ab4f38ff2e0e1823c038948');
  }

  async findAll(
    currentUser: any,
    query?: { category?: string; search?: string; status?: string },
  ) {
    const orgId = this.getOrgId(currentUser);
    const filter: Record<string, any> = { orgId, deletedAt: null };

    if (query?.category) {
      filter.category = query.category;
    }

    if (query?.status === 'active') {
      filter.isActive = true;
    } else if (query?.status === 'inactive') {
      filter.isActive = false;
    }

    if (query?.search && query.search.trim()) {
      const term = query.search.trim();
      const regex = new RegExp(term, 'i');
      filter.$or = [{ name: regex }, { subject: regex }, { bodyHtml: regex }];
    }

    return this.emailTemplatesRepository.findAll(filter);
  }

  async findOne(currentUser: any, id: string) {
    const orgId = this.getOrgId(currentUser);
    const template = await this.emailTemplatesRepository.findById(orgId, id);
    if (!template) {
      throw new NotFoundException(`Email template with ID "${id}" not found`);
    }
    return template;
  }

  async create(currentUser: any, dto: CreateEmailTemplateDto) {
    const orgId = this.getOrgId(currentUser);
    const name = dto.name.trim();

    // Duplicate template name check
    const existing = await this.emailTemplatesRepository.findByName(orgId, name);
    if (existing) {
      throw new ConflictException(
        `An email template with the name "${name}" already exists`,
      );
    }

    return this.emailTemplatesRepository.create({
      orgId,
      name,
      subject: dto.subject.trim(),
      bodyHtml: dto.bodyHtml,
      category: dto.category || 'interview_invite',
      variables: dto.variables || [],
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      deletedAt: null,
      schemaVersion: 1,
    });
  }

  async update(currentUser: any, id: string, dto: UpdateEmailTemplateDto) {
    const orgId = this.getOrgId(currentUser);
    const existing = await this.emailTemplatesRepository.findById(orgId, id);
    if (!existing) {
      throw new NotFoundException(`Email template with ID "${id}" not found`);
    }

    const updateData: Record<string, any> = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.subject !== undefined) updateData.subject = dto.subject.trim();
    if (dto.bodyHtml !== undefined) updateData.bodyHtml = dto.bodyHtml;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.variables !== undefined) updateData.variables = dto.variables;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const updated = await this.emailTemplatesRepository.update(
      orgId,
      id,
      updateData,
    );
    if (!updated) {
      throw new NotFoundException(`Email template with ID "${id}" not found`);
    }
    return updated;
  }

  async remove(currentUser: any, id: string) {
    const orgId = this.getOrgId(currentUser);
    const deleted = await this.emailTemplatesRepository.softDelete(orgId, id);
    if (!deleted) {
      throw new NotFoundException(`Email template with ID "${id}" not found`);
    }
    return { success: true, message: `Email template ${id} deleted successfully` };
  }
}
