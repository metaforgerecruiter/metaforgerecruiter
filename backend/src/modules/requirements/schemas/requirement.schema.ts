import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { DataScopePlugin } from '../../../database/plugins/data-scope.plugin';

export type RequirementDocument = Requirement & Document;

@Schema({
  timestamps: true,
  collection: 'requirements',
})
export class Requirement {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  orgId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  reqCode: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true,
  })
  clientId: Types.ObjectId;

  @Prop({ required: true })
  clientName: string;

  @Prop({
    default: 'Medium',
    enum: ['High', 'Medium', 'Low', 'Urgent'],
  })
  priority: string;

  @Prop({
    default: 'Open',
  })
  status: string;

  @Prop({
    default: 'Unassigned',
    enum: ['Unassigned', 'Assigned', 'In Progress', 'Closed'],
  })
  assignmentStatus: string;

  @Prop({ default: 1, min: 1 })
  openings: number;

  @Prop({ default: 0, min: 0 })
  placedCount: number;

  @Prop({
    type: Object,
    default: { min: 0, max: 0, currency: 'INR' },
  })
  budgetRange: {
    min: number;
    max: number;
    currency: string;
  };

  @Prop({ type: String, default: null, trim: true })
  budgetText: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  assignedLeadId: Types.ObjectId;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  assignedRecruiterIds: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  skillsRequired: string[];

  @Prop({
    type: Object,
    default: { min: 0, max: 0 },
  })
  experienceRange: {
    min: number;
    max: number | null;
  };

  @Prop({ default: 'Hybrid' })
  location: string;

  @Prop({ default: Date.now })
  emailArrivedTime: Date;

  @Prop({ type: String, default: null, trim: true })
  clientEmail: string;

  @Prop({ type: [String], default: [] })
  toEmails: string[];

  @Prop({ type: [String], default: [] })
  ccEmails: string[];

  @Prop({ default: false })
  revokeRequested: boolean;

  @Prop({ default: null })
  revokeReason: string;

  @Prop({ type: String, default: null, trim: true })
  sourceMessageId: string;

  @Prop({ type: String, default: null, trim: true })
  sourceClientJdId: string;

  @Prop({ type: String, default: null, trim: true })
  sourceSubject: string;

  // Original client email as extracted by the mail pipeline. Excluded from normal queries
  // (they can be large); read via GET /requirements/:id/original-email.
  @Prop({ type: String, default: null, select: false })
  sourceEmailBody: string;

  @Prop({ type: String, default: null, select: false })
  sourceEmailHtml: string;

  @Prop({ type: String, default: null, trim: true })
  sourceFromName: string;

  @Prop({ type: String, default: null, trim: true })
  description: string;

  @Prop({ type: String, default: null, trim: true })
  employmentType: string;

  @Prop({ type: String, default: null, trim: true })
  workMode: string;

  @Prop({ type: String, default: null, trim: true })
  noticePeriod: string;

  @Prop({ type: String, default: null, trim: true })
  experienceLevel: string;

  @Prop({ type: [String], default: [] })
  mandatorySkills: string[];

  @Prop({ type: String, default: null, trim: true })
  conversationId: string;

  @Prop({ type: String, default: null, trim: true })
  inReplyTo: string;

  @Prop({ type: [String], default: [] })
  references: string[];

  @Prop({ type: Date, default: Date.now, index: true })
  firstDetectedAt: Date;

  @Prop({ type: Date, default: null })
  lastUpdatedAt: Date;

  @Prop({ type: Date, default: null, index: true })
  sourceEmailReceivedAt: Date;

  @Prop({ type: Date, default: null })
  lastSeenAt: Date;

  @Prop({ type: String, default: null, trim: true })
  idempotencyKey: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  @Prop({ default: 1 })
  schemaVersion: number;
}

export const RequirementSchema =
  SchemaFactory.createForClass(Requirement);

// Compound Indexes prefixed with orgId and suffix deletedAt
RequirementSchema.index(
  {
    orgId: 1,
    reqCode: 1,
    deletedAt: 1,
  },
  {
    unique: true,
  },
);

RequirementSchema.index({
  orgId: 1,
  status: 1,
  clientId: 1,
  createdAt: -1,
  deletedAt: 1,
});

RequirementSchema.index({
  orgId: 1,
  assignedLeadId: 1,
  status: 1,
  deletedAt: 1,
});

RequirementSchema.index({
  orgId: 1,
  assignedRecruiterIds: 1,
  status: 1,
  deletedAt: 1,
});

// Fast lookup for incoming email message ID (non-unique to support multi-role emails)
RequirementSchema.index({ orgId: 1, sourceMessageId: 1 });

// Thread conversation lookup
RequirementSchema.index({ orgId: 1, conversationId: 1 });

// Database-level unique constraint on client requirement ID per client within organization
RequirementSchema.index(
  { orgId: 1, clientId: 1, sourceClientJdId: 1, deletedAt: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sourceClientJdId: { $type: 'string', $gt: '' },
      deletedAt: null,
    },
  },
);

RequirementSchema.index({ orgId: 1, idempotencyKey: 1 }, { sparse: true });
RequirementSchema.index({ orgId: 1, firstDetectedAt: -1, sourceEmailReceivedAt: -1, deletedAt: 1 });

RequirementSchema.plugin(DataScopePlugin);