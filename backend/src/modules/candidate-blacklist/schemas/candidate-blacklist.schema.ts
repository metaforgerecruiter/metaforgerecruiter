import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type CandidateBlacklistDocument = CandidateBlacklist & Document;

@Schema({ timestamps: true, collection: 'candidate_blacklist' })
export class CandidateBlacklist {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  orgId: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Candidate', default: null })
  candidateId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  reason: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  blacklistedBy: Types.ObjectId;

  @Prop({ default: Date.now })
  blacklistedAt: Date;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  @Prop({ default: 1 })
  schemaVersion: number;
}

export const CandidateBlacklistSchema = SchemaFactory.createForClass(CandidateBlacklist);
CandidateBlacklistSchema.index({ orgId: 1, email: 1, deletedAt: 1 }, { unique: true });
CandidateBlacklistSchema.index({ orgId: 1, phone: 1, deletedAt: 1 }, { unique: true });
