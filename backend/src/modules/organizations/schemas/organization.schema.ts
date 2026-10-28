import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true, collection: 'organizations' })
export class Organization {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ default: 'Professional', enum: ['Starter', 'Professional', 'Enterprise'] })
  tier: string;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: 1 })
  schemaVersion: number;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
OrganizationSchema.index({ name: 1 }, { unique: true });
OrganizationSchema.index({ slug: 1 }, { unique: true });
