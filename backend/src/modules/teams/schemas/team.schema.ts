import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { DataScopePlugin } from '../../../database/plugins/data-scope.plugin';

export type TeamDocument = Team & Document;

@Schema({ timestamps: true, collection: 'teams' })
export class Team {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  orgId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  teamId: string;

  @Prop({ required: true, trim: true })
  teamName: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  leadId: Types.ObjectId;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  recruiterIds: Types.ObjectId[];

  @Prop({ default: true })
  active: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  @Prop({ default: 1 })
  schemaVersion: number;
}

export const TeamSchema = SchemaFactory.createForClass(Team);
TeamSchema.index({ orgId: 1, teamId: 1, deletedAt: 1 }, { unique: true });
TeamSchema.index({ orgId: 1, leadId: 1, deletedAt: 1 });
TeamSchema.plugin(DataScopePlugin);
