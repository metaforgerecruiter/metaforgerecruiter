import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type InterviewFeedbackDocument = InterviewFeedback & Document;

@Schema({ timestamps: true, collection: 'interview_feedbacks' })
export class InterviewFeedback {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  orgId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Interview', required: true })
  interviewId: Types.ObjectId;

  @Prop({ required: true })
  evaluatorName: string;

  @Prop({ required: true })
  evaluatorEmail: string;

  @Prop({ default: 0 })
  technicalScore: number;

  @Prop({ default: null })
  feedbackNotes: string;

  @Prop({ required: true, enum: ['Passed', 'Rejected', 'Hold'] })
  recommendation: string;

  @Prop({ default: null })
  rejectionReason: string;

  @Prop({ default: 1 })
  schemaVersion: number;
}

export const InterviewFeedbackSchema = SchemaFactory.createForClass(InterviewFeedback);
InterviewFeedbackSchema.index({ orgId: 1, interviewId: 1, createdAt: -1 });
