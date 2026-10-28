import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { DataScopePlugin } from '../../../database/plugins/data-scope.plugin';

export type ClientDocument = Client & Document;

@Schema({ timestamps: true, collection: 'clients' })
export class Client {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  orgId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  clientId: string;

  @Prop({ required: true, trim: true })
  clientName: string;

  @Prop({ default: 'Information Technology' })
  domain: string;

  @Prop({ default: 'Tier-1', enum: ['Tier-1', 'Tier-2', 'Enterprise', 'Global'] })
  tier: string;

  @Prop({ default: 'Active', enum: ['Active', 'On Hold', 'Inactive', 'Archived'] })
  status: string;

  @Prop({ default: 5 })
  slaDays: number;

  @Prop({ type: Array, default: [] })
  pocContacts: Array<{ name: string; email: string; phone?: string; designation?: string }>;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  accountLeadId: Types.ObjectId;

  @Prop({ default: 0.0 })
  deliveryGapScore: number;

  @Prop({ default: null })
  agreementsUrl: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  @Prop({ default: 1 })
  schemaVersion: number;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
ClientSchema.index({ orgId: 1, clientId: 1, deletedAt: 1 }, { unique: true });
ClientSchema.index({ orgId: 1, clientName: 1, deletedAt: 1 }, { unique: true });
ClientSchema.index({ orgId: 1, status: 1, deletedAt: 1 });

ClientSchema.plugin(DataScopePlugin);
