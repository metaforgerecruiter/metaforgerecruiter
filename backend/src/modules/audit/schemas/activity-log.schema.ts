import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type ActivityLogDocument = ActivityLog & Document;

@Schema({ timestamps: true, collection: 'activity_logs' })
export class ActivityLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  orgId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true })
  userEmail: string;

  @Prop({ required: true })
  userRole: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true, enum: ['Submissions', 'Requirements', 'User Management', 'Client Management', 'Interviews', 'System & Access', 'Candidate Sourcing'] })
  category: string;

  @Prop({ required: true })
  targetEntity: string;

  @Prop({ default: null })
  targetId: string;

  @Prop({ default: null })
  clientName: string;

  @Prop({ required: true })
  ipAddress: string;

  @Prop({ default: 'Success', enum: ['Success', 'Warning', 'Security Alert'] })
  status: string;

  @Prop({ type: Object, default: {} })
  details: Record<string, any>;

  @Prop({ default: 1 })
  schemaVersion: number;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);
ActivityLogSchema.index({ orgId: 1, userEmail: 1, createdAt: -1 });
ActivityLogSchema.index({ orgId: 1, category: 1, status: 1, createdAt: -1 });
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 94608000 }); // 3 Years TTL
