import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { DataScopePlugin } from '../../../database/plugins/data-scope.plugin';

export type CandidateDocumentRecordDocument = CandidateDocumentRecord & Document;

@Schema({ timestamps: true, collection: 'candidate_documents' })
export class CandidateDocumentRecord {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  orgId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Candidate', required: true })
  candidateId: Types.ObjectId;

  @Prop({ required: true, enum: ['Resume', 'Offer Letter', 'Government ID', 'Degree Certificate', 'Payslip'] })
  documentType: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'FileMetadata', required: true })
  fileMetadataId: Types.ObjectId;

  @Prop({ default: false })
  isPrimaryResume: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  @Prop({ default: 1 })
  schemaVersion: number;
}

export const CandidateDocumentRecordSchema = SchemaFactory.createForClass(CandidateDocumentRecord);
CandidateDocumentRecordSchema.index({ orgId: 1, candidateId: 1, documentType: 1, deletedAt: 1 });
CandidateDocumentRecordSchema.plugin(DataScopePlugin);
