import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type AIParsingJobDocument = AIParsingJob & Document;

@Schema({ timestamps: true, collection: 'ai_parsing_jobs' })
export class AIParsingJob {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  orgId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  jobId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'FileMetadata', required: true })
  sourceFileId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Candidate', default: null })
  candidateId: Types.ObjectId;

  @Prop({ default: 'mammoth-v1' })
  parserEngine: string;

  @Prop({ default: 'v2.4.1' })
  promptVersion: string;

  @Prop({ default: 'PENDING', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] })
  status: string;

  @Prop({ default: null })
  rawTextExtracted: string;

  @Prop({ type: Object, default: {} })
  extractedData: Record<string, any>;

  @Prop({ default: 0.0 })
  confidenceScore: number;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop({ default: null })
  errorMessage: string;

  @Prop({ default: 1 })
  schemaVersion: number;
}

export const AIParsingJobSchema = SchemaFactory.createForClass(AIParsingJob);
AIParsingJobSchema.index({ orgId: 1, jobId: 1 }, { unique: true });
AIParsingJobSchema.index({ orgId: 1, status: 1, createdAt: -1 });
