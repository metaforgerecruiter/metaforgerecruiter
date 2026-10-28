import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { DataScopePlugin } from '../../../database/plugins/data-scope.plugin';

export type SubmissionDocument = Submission & Document;

@Schema({
  timestamps: true,
  collection: 'submissions',
})
export class Submission {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  orgId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  submissionId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Candidate', required: true })
  candidateId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Requirement', required: true })
  requirementId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  recruiterId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  leadId: Types.ObjectId;

  @Prop({ default: 'Submitted', enum: ['Submitted', 'Submitted to Lead', 'Submitted to Client', 'Client Review', 'Interview Scheduled', 'Offered', 'Placed', 'Rejected'] })
  stage: string;

  @Prop({ default: 'Pending', enum: ['Pending', 'Approved', 'Rejected', 'Forwarded'] })
  leadApprovalStatus: string;

  @Prop({ default: 0.0 })
  matchScore: number;

  @Prop({ default: Date.now })
  submittedAt: Date;

  @Prop({ default: null })
  leadApprovedAt: Date;

  @Prop({ default: null })
  clientForwardedAt: Date;

  @Prop({ default: null })
  rejectionReason: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  @Prop({ default: 1 })
  schemaVersion: number;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);

// Compound Indexes prefixed with orgId and suffix deletedAt
SubmissionSchema.index({ orgId: 1, candidateId: 1, requirementId: 1, deletedAt: 1 }, { unique: true });
SubmissionSchema.index({ orgId: 1, recruiterId: 1, stage: 1, submittedAt: -1, deletedAt: 1 });
SubmissionSchema.index({ orgId: 1, leadId: 1, leadApprovalStatus: 1, deletedAt: 1 });
SubmissionSchema.index({ orgId: 1, clientId: 1, stage: 1, deletedAt: 1 });

SubmissionSchema.plugin(DataScopePlugin);
