import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlacklistRepository } from './repositories/blacklist.repository';
import { CreateBlacklistDto } from './dto/create-blacklist.dto';
import { UpdateBlacklistDto } from './dto/update-blacklist.dto';
import { Candidate, CandidateDocument } from '../../modules/candidates/schemas/candidate.schema';

@Injectable()
export class BlacklistService {
  constructor(
    private readonly blacklistRepository: BlacklistRepository,
    @InjectModel(Candidate.name)
    private readonly candidateModel: Model<CandidateDocument>,
  ) {}

  private getOrgId(currentUser: any): Types.ObjectId {
    return currentUser?.orgId
      ? new Types.ObjectId(currentUser.orgId.toString())
      : new Types.ObjectId('6ab4f38ff2e0e1823c038948');
  }

  private getUserId(currentUser: any): Types.ObjectId {
    return currentUser?.id || currentUser?._id
      ? new Types.ObjectId((currentUser.id || currentUser._id).toString())
      : new Types.ObjectId('6ab6245b10fcb90ec8ecbf01');
  }

  async findAll(currentUser: any, query?: { search?: string; page?: string; limit?: string }) {
    const orgId = this.getOrgId(currentUser);
    const filter: Record<string, any> = { orgId, deletedAt: null };

    if (query?.search && query.search.trim()) {
      const term = query.search.trim();
      const regex = new RegExp(term, 'i');
      filter.$or = [
        { email: regex },
        { phone: regex },
        { reason: regex },
      ];
    }

    const page = Math.max(1, parseInt(String(query?.page || 1), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(query?.limit || 20), 10)));

    return this.blacklistRepository.findAll(filter, page, limit);
  }

  async findOne(currentUser: any, id: string) {
    const orgId = this.getOrgId(currentUser);
    const entry = await this.blacklistRepository.findById(orgId, id);
    if (!entry) {
      throw new NotFoundException(`Blacklist entry with ID "${id}" not found`);
    }
    return entry;
  }

  async create(currentUser: any, dto: CreateBlacklistDto) {
    const orgId = this.getOrgId(currentUser);
    const blacklistedBy = this.getUserId(currentUser);

    const email = dto.email.toLowerCase().trim();
    const phone = dto.phone.trim();

    // Check duplicate
    const existing = await this.blacklistRepository.findByEmailOrPhone(orgId, email, phone);
    if (existing) {
      throw new ConflictException('Candidate email or phone is already blacklisted');
    }

    let candObjId: Types.ObjectId | null = null;
    if (dto.candidateId && Types.ObjectId.isValid(dto.candidateId)) {
      candObjId = new Types.ObjectId(dto.candidateId);
    } else {
      // Auto link to Candidate document if present in DB
      const matchedCand = await this.candidateModel.findOne({
        orgId,
        deletedAt: null,
        $or: [{ email }, { phone }],
      }).exec();

      if (matchedCand) {
        candObjId = matchedCand._id as Types.ObjectId;
      }
    }

    return this.blacklistRepository.create({
      orgId,
      email,
      phone,
      candidateId: candObjId,
      reason: dto.reason.trim(),
      blacklistedBy,
      blacklistedAt: new Date(),
      deletedAt: null,
      schemaVersion: 1,
    });
  }

  async update(currentUser: any, id: string, dto: UpdateBlacklistDto) {
    const orgId = this.getOrgId(currentUser);
    const existing = await this.blacklistRepository.findById(orgId, id);
    if (!existing) {
      throw new NotFoundException(`Blacklist entry with ID "${id}" not found`);
    }

    const updateData: Record<string, any> = {};
    if (dto.email !== undefined) updateData.email = dto.email.toLowerCase().trim();
    if (dto.phone !== undefined) updateData.phone = dto.phone.trim();
    if (dto.reason !== undefined) updateData.reason = dto.reason.trim();
    if (dto.candidateId !== undefined && Types.ObjectId.isValid(dto.candidateId)) {
      updateData.candidateId = new Types.ObjectId(dto.candidateId);
    }

    const updated = await this.blacklistRepository.update(orgId, id, updateData);
    if (!updated) {
      throw new NotFoundException(`Blacklist entry with ID "${id}" not found`);
    }
    return updated;
  }

  async remove(currentUser: any, id: string) {
    const orgId = this.getOrgId(currentUser);
    const deleted = await this.blacklistRepository.softDelete(orgId, id);
    if (!deleted) {
      throw new NotFoundException(`Blacklist entry with ID "${id}" not found`);
    }
    return { success: true, message: `Blacklist entry ${id} removed successfully` };
  }
}
