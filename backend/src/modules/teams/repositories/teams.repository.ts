import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Team, TeamDocument } from '../schemas/team.schema';

@Injectable()
export class TeamsRepository {
  constructor(
    @InjectModel(Team.name)
    private readonly teamModel: Model<TeamDocument>,
  ) {}

  async findAll(filter: Record<string, any>): Promise<TeamDocument[]> {
    return this.teamModel
      .find(filter)
      .populate('leadId', 'name email role')
      .populate('recruiterIds', 'name email role')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(orgId: Types.ObjectId, id: string): Promise<TeamDocument | null> {
    const filter: Record<string, any> = { orgId, deletedAt: null };
    if (Types.ObjectId.isValid(id)) {
      filter.$or = [{ _id: new Types.ObjectId(id) }, { teamId: id }];
    } else {
      filter.teamId = id;
    }

    return this.teamModel
      .findOne(filter)
      .populate('leadId', 'name email role')
      .populate('recruiterIds', 'name email role')
      .exec();
  }

  async create(teamData: Partial<Team>): Promise<TeamDocument> {
    const newTeam = new this.teamModel(teamData);
    return newTeam.save();
  }

  async update(
    orgId: Types.ObjectId,
    id: string,
    updateData: Partial<Team>,
  ): Promise<TeamDocument | null> {
    const filter: Record<string, any> = { orgId, deletedAt: null };
    if (Types.ObjectId.isValid(id)) {
      filter.$or = [{ _id: new Types.ObjectId(id) }, { teamId: id }];
    } else {
      filter.teamId = id;
    }

    return this.teamModel
      .findOneAndUpdate(filter, { $set: updateData }, { new: true })
      .populate('leadId', 'name email role')
      .populate('recruiterIds', 'name email role')
      .exec();
  }

  async softDelete(orgId: Types.ObjectId, id: string): Promise<TeamDocument | null> {
    const filter: Record<string, any> = { orgId, deletedAt: null };
    if (Types.ObjectId.isValid(id)) {
      filter.$or = [{ _id: new Types.ObjectId(id) }, { teamId: id }];
    } else {
      filter.teamId = id;
    }

    return this.teamModel
      .findOneAndUpdate(
        filter,
        { $set: { deletedAt: new Date(), active: false } },
        { new: true },
      )
      .exec();
  }

  async countTeams(orgId: Types.ObjectId): Promise<number> {
    return this.teamModel.countDocuments({ orgId, deletedAt: null }).exec();
  }
}
