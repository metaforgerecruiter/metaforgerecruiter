import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type FileMetadataDocument = FileMetadata & Document;

@Schema({ timestamps: true, collection: 'file_metadata' })
export class FileMetadata {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  orgId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  fileId: string;

  @Prop({ required: true, trim: true })
  originalName: string;

  @Prop({ required: true, trim: true })
  mimeType: string;

  @Prop({ required: true, min: 0 })
  sizeBytes: number;

  @Prop({ default: 'LOCAL', enum: ['S3', 'LOCAL', 'MINIO'] })
  storageProvider: string;

  @Prop({ required: true })
  bucketName: string;

  @Prop({ required: true })
  storageKey: string;

  @Prop({ default: null })
  checksumSha256: string;

  @Prop({ default: 'CLEAN', enum: ['CLEAN', 'INFECTED', 'PENDING'] })
  scanStatus: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  @Prop({ default: 1 })
  schemaVersion: number;
}

export const FileMetadataSchema = SchemaFactory.createForClass(FileMetadata);
FileMetadataSchema.index({ orgId: 1, fileId: 1 }, { unique: true });
