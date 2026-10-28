import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type DailyAttendanceReportDocument = DailyAttendanceReport & Document;

@Schema({ _id: false })
export class RecruiterAttendanceSnapshot {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  email: string;

  @Prop({ default: 'recruiter' })
  role: string;

  @Prop({ required: true, enum: ['LOGGED_IN', 'MISSING'] })
  status: string;

  @Prop({ type: Date, default: null })
  loginTime: Date;

  @Prop({ default: null })
  loginTimeFormattedIST: string;
}

export const RecruiterAttendanceSnapshotSchema = SchemaFactory.createForClass(RecruiterAttendanceSnapshot);

@Schema({ timestamps: true, collection: 'daily_attendance_reports' })
export class DailyAttendanceReport {
  @Prop({ required: true, unique: true, index: true })
  reportDate: string; // YYYY-MM-DD in Asia/Kolkata timezone

  @Prop({ required: true, type: Date })
  sentAt: Date;

  @Prop({ required: true, trim: true })
  recipient: string;

  @Prop({ required: true, trim: true })
  sender: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true, type: Number })
  totalRecruiters: number;

  @Prop({ required: true, type: Number })
  loggedInCount: number;

  @Prop({ required: true, type: Number })
  missingCount: number;

  @Prop({ required: true, type: Boolean, default: false })
  allClear: boolean;

  @Prop({ type: [RecruiterAttendanceSnapshotSchema], default: [] })
  recruiterSnapshots: RecruiterAttendanceSnapshot[];

  @Prop({ required: true, enum: ['SENT', 'FAILED', 'SKIPPED_HOLIDAY', 'SKIPPED_WEEKEND'], default: 'SENT' })
  status: string;

  @Prop({ type: String, default: null })
  errorMessage: string;

  @Prop({ type: String, default: null })
  notes: string;
}

export const DailyAttendanceReportSchema = SchemaFactory.createForClass(DailyAttendanceReport);

DailyAttendanceReportSchema.index({ reportDate: 1 }, { unique: true });
DailyAttendanceReportSchema.index({ reportDate: 1, status: 1 });
DailyAttendanceReportSchema.index({ sentAt: -1 });
