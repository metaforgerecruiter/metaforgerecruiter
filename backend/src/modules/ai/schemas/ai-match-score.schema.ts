import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type AIMatchScoreDocument = AIMatchScore & Document;

@Schema({ timestamps: true, collection: 'ai_match_scores' })
export class AIMatchScore {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  orgId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Candidate', required: true })
  candidateId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Requirement', required: true })
  requirementId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Submission', default: null })
  submissionId: Types.ObjectId;

  @Prop({ default: 0.0 })
  overallMatchScore: number;

  @Prop({ default: 0.0 })
  skillMatchPercentage: number;

  @Prop({ default: 0.0 })
  experienceMatchPercentage: number;

  @Prop({ type: [String], default: [] })
  matchingSkills: string[];

  @Prop({ type: [String], default: [] })
  missingSkills: string[];

  @Prop({ default: '' })
  summaryEvaluation: string;

  @Prop({ type: [Number], default: [] })
  vectorEmbedding: number[];

  @Prop({ default: 1 })
  schemaVersion: number;
}

export const AIMatchScoreSchema = SchemaFactory.createForClass(AIMatchScore);
AIMatchScoreSchema.index({ orgId: 1, candidateId: 1, requirementId: 1 });
