import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { SavedSearchesRepository } from './repositories/saved-searches.repository';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { UpdateSavedSearchDto } from './dto/update-saved-search.dto';

@Injectable()
export class SavedSearchesService {
  constructor(private readonly savedSearchesRepository: SavedSearchesRepository) {}

  private getOrgId(currentUser: any): Types.ObjectId {
    return currentUser?.orgId
      ? new Types.ObjectId(currentUser.orgId.toString())
      : new Types.ObjectId('6ab4f38ff2e0e1823c038948');
  }

  private getUserId(currentUser: any): Types.ObjectId {
    const uId = currentUser?.id || currentUser?._id || currentUser?.userId;
    return uId
      ? new Types.ObjectId(uId.toString())
      : new Types.ObjectId('6ab6245b10fcb90ec8ecbf01');
  }

  async findAll(currentUser: any, query?: { collection?: string; search?: string }) {
    const orgId = this.getOrgId(currentUser);
    const userId = this.getUserId(currentUser);

    const filter: Record<string, any> = { orgId, userId, deletedAt: null };

    if (query?.collection) {
      filter.collection = query.collection;
    }

    if (query?.search && query.search.trim()) {
      filter.name = { $regex: new RegExp(query.search.trim(), 'i') };
    }

    return this.savedSearchesRepository.findAll(filter);
  }

  async findOne(currentUser: any, id: string) {
    const orgId = this.getOrgId(currentUser);
    const userId = this.getUserId(currentUser);

    const search = await this.savedSearchesRepository.findById(orgId, id);
    if (!search) {
      throw new NotFoundException(`Saved search with ID "${id}" not found`);
    }

    const searchUserId = (search.userId as any)?._id || search.userId;
    const isAdmin = ['admin', 'superadmin'].includes(currentUser?.role?.toLowerCase());
    if (!isAdmin && searchUserId.toString() !== userId.toString()) {
      throw new ForbiddenException('Access denied to this saved search');
    }

    return search;
  }

  async create(currentUser: any, dto: CreateSavedSearchDto) {
    const orgId = this.getOrgId(currentUser);
    const userId = this.getUserId(currentUser);

    const name = dto.name.trim();

    const existing = await this.savedSearchesRepository.findByNameAndUser(orgId, userId, name);
    if (existing) {
      throw new ConflictException(`A saved search with the name "${name}" already exists`);
    }

    return this.savedSearchesRepository.create({
      orgId,
      userId,
      name,
      filters: dto.filters || {},
      collection: dto.collection,
      deletedAt: null,
      schemaVersion: 1,
    });
  }

  async update(currentUser: any, id: string, dto: UpdateSavedSearchDto) {
    const orgId = this.getOrgId(currentUser);
    const userId = this.getUserId(currentUser);

    const existing = await this.savedSearchesRepository.findById(orgId, id);
    if (!existing) {
      throw new NotFoundException(`Saved search with ID "${id}" not found`);
    }

    const searchUserId = (existing.userId as any)?._id || existing.userId;
    const isAdmin = ['admin', 'superadmin'].includes(currentUser?.role?.toLowerCase());
    if (!isAdmin && searchUserId.toString() !== userId.toString()) {
      throw new ForbiddenException('Access denied to modify this saved search');
    }

    const updateData: Record<string, any> = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.filters !== undefined) updateData.filters = dto.filters;
    if (dto.collection !== undefined) updateData.collection = dto.collection;

    const updated = await this.savedSearchesRepository.update(orgId, id, updateData);
    if (!updated) {
      throw new NotFoundException(`Saved search with ID "${id}" not found`);
    }
    return updated;
  }

  async remove(currentUser: any, id: string) {
    const orgId = this.getOrgId(currentUser);
    const userId = this.getUserId(currentUser);

    const existing = await this.savedSearchesRepository.findById(orgId, id);
    if (!existing) {
      throw new NotFoundException(`Saved search with ID "${id}" not found`);
    }

    const searchUserId = (existing.userId as any)?._id || existing.userId;
    const isAdmin = ['admin', 'superadmin'].includes(currentUser?.role?.toLowerCase());
    if (!isAdmin && searchUserId.toString() !== userId.toString()) {
      throw new ForbiddenException('Access denied to delete this saved search');
    }

    const deleted = await this.savedSearchesRepository.softDelete(orgId, id);
    if (!deleted) {
      throw new NotFoundException(`Saved search with ID "${id}" not found`);
    }
    return { success: true, message: `Saved search ${id} deleted successfully` };
  }
}
