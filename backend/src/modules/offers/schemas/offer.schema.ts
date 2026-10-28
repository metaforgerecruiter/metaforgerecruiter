import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { DataScopePlugin } from '../../../database/plugins/data-scope.plugin';

export type OfferDocument = Offer & Document;

@Schema({
  timestamps: true,
  collection: 'offers',
})
export class Offer {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  orgId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  offerId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Submission',
    required: true,
  })
  submissionId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Candidate',
    required: true,
  })
  candidateId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Requirement',
    required: true,
  })
  requirementId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  offeredCtc: number;

  @Prop({ default: Date.now })
  offerReleaseDate: Date;

  @Prop({ required: true })
  joiningDate: Date;

  @Prop({
    default: 'Offer Released',
    enum: [
      'Offer Released',
      'Accepted',
      'Joined',
      'Declined',
      'Backed Out',
    ],
  })
  status: string;

  @Prop({ default: null })
  declinedReason: string;

  @Prop({ default: null })
  notJoinedNote: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  @Prop({ default: 1 })
  schemaVersion: number;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);

// Compound Indexes prefixed with orgId and suffix deletedAt
OfferSchema.index(
  { orgId: 1, submissionId: 1, deletedAt: 1 },
  { unique: true },
);

OfferSchema.index({
  orgId: 1,
  status: 1,
  joiningDate: 1,
  deletedAt: 1,
});

OfferSchema.plugin(DataScopePlugin);
