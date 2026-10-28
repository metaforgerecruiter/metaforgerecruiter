import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type RecruiterAnalyticsDocument = RecruiterAnalytics & Document;

@Schema({ timestamps: true, collection: 'recruiter_analytics' })
export class RecruiterAnalytics {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  orgId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  recruiterId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ default: 0 })
  submissionsCount: number;

  @Prop({ default: 0 })
  interviewsCount: number;

  @Prop({ default: 0 })
  placementsCount: number;

  @Prop({ default: 0 })
  activeScreenTimeMinutes: number;

  @Prop({ default: 1 })
  schemaVersion: number;
}

export const RecruiterAnalyticsSchema = SchemaFactory.createForClass(RecruiterAnalytics);
RecruiterAnalyticsSchema.index({ orgId: 1, recruiterId: 1, date: -1 });
