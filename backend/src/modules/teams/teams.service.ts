import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { TeamsRepository } from './repositories/teams.repository';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly teamsRepository: TeamsRepository) {}

  private getOrgId(currentUser: any): Types.ObjectId {
    return currentUser?.orgId
      ? new Types.ObjectId(currentUser.orgId.toString())
      : new Types.ObjectId('6ab4f38ff2e0e1823c038948');
  }

  async findAll(currentUser: any, query?: { search?: string }) {
    const orgId = this.getOrgId(currentUser);
    const filter: Record<string, any> = { orgId, deletedAt: null };

    if (query?.search && query.search.trim()) {
      const term = query.search.trim();
      filter.$or = [
        { teamName: { $regex: new RegExp(term, 'i') } },
        { teamId: { $regex: new RegExp(term, 'i') } },
      ];
    }

    return this.teamsRepository.findAll(filter);
  }

  async findOne(currentUser: any, id: string) {
    const orgId = this.getOrgId(currentUser);
    const team = await this.teamsRepository.findById(orgId, id);
    if (!team) {
      throw new NotFoundException(`Team with ID "${id}" not found`);
    }
    return team;
  }

  async create(currentUser: any, dto: CreateTeamDto) {
    const orgId = this.getOrgId(currentUser);

    if (!Types.ObjectId.isValid(dto.leadId)) {
      throw new BadRequestException(`Invalid leadId format: "${dto.leadId}"`);
    }

    let teamId = dto.teamId;
    if (!teamId) {
      const count = await this.teamsRepository.countTeams(orgId);
      teamId = `TM-${String(count + 1).padStart(3, '0')}`;
    }

    const recruiterObjectIds = (dto.recruiterIds || [])
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    return this.teamsRepository.create({
      orgId,
      teamId,
      teamName: dto.teamName,
      leadId: new Types.ObjectId(dto.leadId),
      recruiterIds: recruiterObjectIds,
      active: true,
      deletedAt: null,
      schemaVersion: 1,
    });
  }

  async update(currentUser: any, id: string, dto: UpdateTeamDto) {
    const orgId = this.getOrgId(currentUser);
    const existing = await this.teamsRepository.findById(orgId, id);
    if (!existing) {
      throw new NotFoundException(`Team with ID "${id}" not found`);
    }

    const updateData: Record<string, any> = {};
    if (dto.teamName !== undefined) updateData.teamName = dto.teamName;
    if (dto.active !== undefined) updateData.active = dto.active;

    if (dto.leadId !== undefined) {
      if (!Types.ObjectId.isValid(dto.leadId)) {
        throw new BadRequestException(`Invalid leadId format: "${dto.leadId}"`);
      }
      updateData.leadId = new Types.ObjectId(dto.leadId);
    }

    if (dto.recruiterIds !== undefined) {
      updateData.recruiterIds = dto.recruiterIds
        .filter((rId) => Types.ObjectId.isValid(rId))
        .map((rId) => new Types.ObjectId(rId));
    }

    const updated = await this.teamsRepository.update(orgId, id, updateData);
    if (!updated) {
      throw new NotFoundException(`Team with ID "${id}" not found`);
    }
    return updated;
  }

  async remove(currentUser: any, id: string) {
    const orgId = this.getOrgId(currentUser);
    const deleted = await this.teamsRepository.softDelete(orgId, id);
    if (!deleted) {
      throw new NotFoundException(`Team with ID "${id}" not found`);
    }
    return { success: true, message: `Team ${id} deleted successfully` };
  }
}
