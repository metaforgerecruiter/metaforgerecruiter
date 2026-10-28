import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type RolePermissionDocument = RolePermission & Document;

@Schema({ timestamps: true, collection: 'roles_permissions' })
export class RolePermission {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  orgId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  roleCode: string;

  @Prop({ required: true, trim: true })
  roleName: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ default: 1 })
  schemaVersion: number;
}

export const RolePermissionSchema = SchemaFactory.createForClass(RolePermission);
RolePermissionSchema.index({ orgId: 1, roleCode: 1 }, { unique: true });
