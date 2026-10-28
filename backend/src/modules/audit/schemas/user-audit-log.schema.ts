import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type UserAuditLogDocument = UserAuditLog & Document;

export enum AuditSessionStatus {
  ACTIVE = 'Active',
  LOGGED_OUT = 'Logged Out',
  SESSION_EXPIRED = 'Session Expired',
}

@Schema({ timestamps: true, collection: 'user_audit_logs' })
export class UserAuditLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: false, default: null })
  orgId: Types.ObjectId;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false, default: null })
  userObjectId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  userName: string;

  @Prop({ required: true, trim: true, lowercase: true })
  userEmail: string;

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  role: string;

  @Prop({ required: true, index: true })
  date: string; // YYYY-MM-DD in Asia/Kolkata

  @Prop({ required: true, type: Date })
  firstLoginTime: Date;

  @Prop({ type: Date, default: null })
  latestLogoutTime: Date | null;

  @Prop({
    required: true,
    enum: [AuditSessionStatus.ACTIVE, AuditSessionStatus.LOGGED_OUT, AuditSessionStatus.SESSION_EXPIRED],
    default: AuditSessionStatus.ACTIVE,
    index: true,
  })
  status: string;

  @Prop({ type: Date, default: Date.now })
  lastActiveAt: Date;

  @Prop({ default: 1 })
  loginCount: number;

  @Prop({ default: null })
  ipAddress: string | null;

  @Prop({ default: null })
  userAgent: string | null;
}

export const UserAuditLogSchema = SchemaFactory.createForClass(UserAuditLog);
UserAuditLogSchema.index({ date: 1, userId: 1 }, { unique: true });
UserAuditLogSchema.index({ date: -1, createdAt: -1 });
UserAuditLogSchema.index({ role: 1, status: 1 });
