import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type SavedSearchDocument = SavedSearch & Document;

@Schema({ timestamps: true, collection: 'saved_searches' })
export class SavedSearch {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  orgId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: Object, required: true })
  filters: Record<string, any>;

  @Prop({ required: true, enum: ['candidates', 'requirements'] })
  collection: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  @Prop({ default: 1 })
  schemaVersion: number;
}

export const SavedSearchSchema = SchemaFactory.createForClass(SavedSearch);
SavedSearchSchema.index({ orgId: 1, userId: 1, name: 1, deletedAt: 1 }, { unique: true });
