import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type RecruiterLoginHistoryDocument = RecruiterLoginHistory & Document;

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  LOGGED_OUT = 'LOGGED_OUT',
  EXPIRED = 'EXPIRED',
}

@Schema({ timestamps: true, collection: 'recruiter_login_histories' })
export class RecruiterLoginHistory {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', default: null, index: true })
  orgId: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  userId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userObjectId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ required: true, trim: true, index: true })
  role: string;

  @Prop({ required: true, unique: true, index: true })
  sessionId: string;

  @Prop({ required: true, type: Date, index: true })
  loginTime: Date;

  @Prop({ type: Date, default: null })
  logoutTime: Date;

  @Prop({ type: Date, default: null })
  lastActiveAt: Date;

  @Prop({
    required: true,
    enum: Object.values(SessionStatus),
    default: SessionStatus.ACTIVE,
    index: true,
  })
  sessionStatus: SessionStatus;

  @Prop({ type: Number, default: 0 })
  durationMinutes: number;

  @Prop({ type: String, default: null })
  ipAddress: string;

  @Prop({ type: String, default: null })
  userAgent: string;

  @Prop({ required: true, trim: true, index: true })
  loginDate: string; // YYYY-MM-DD in Asia/Kolkata timezone

  @Prop({ type: String, default: null })
  logoutType: string; // 'USER_ACTION' | 'SESSION_TIMEOUT' | 'BROWSER_CLOSED_EXPIRED' | 'NEW_LOGIN_REPLACED'

  @Prop({ type: Date, default: null })
  deletedAt: Date;
}

export const RecruiterLoginHistorySchema = SchemaFactory.createForClass(RecruiterLoginHistory);

RecruiterLoginHistorySchema.index({ loginDate: 1, role: 1, sessionStatus: 1 });
RecruiterLoginHistorySchema.index({ userObjectId: 1, loginTime: -1 });
RecruiterLoginHistorySchema.index({ userId: 1, loginDate: 1 });
RecruiterLoginHistorySchema.index({ email: 1, loginDate: 1 });
RecruiterLoginHistorySchema.index({ sessionStatus: 1, lastActiveAt: 1 });
