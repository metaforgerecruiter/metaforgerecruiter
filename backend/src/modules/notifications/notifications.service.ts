import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
  EntityType,
} from './schemas/notification.schema';

export interface CreateNotificationPayload {
  orgId: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  entityId: Types.ObjectId;
  entityType: EntityType;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  /** Format document for API output */
  private sanitizeNotification(doc: any) {
    const obj = doc.toObject ? doc.toObject() : doc;

    return {
      ...obj,
      id: obj._id ? obj._id.toString() : obj.id,
      orgId: obj.orgId ? obj.orgId.toString() : obj.orgId,
      userId: obj.userId ? obj.userId.toString() : obj.userId,
      entityId: obj.entityId ? obj.entityId.toString() : obj.entityId,
      read: Boolean(obj.readAt),
      readAt: obj.readAt || null,
      createdAt: obj.createdAt || new Date(),
      updatedAt: obj.updatedAt || new Date(),
    };
  }

  /** Insert single notification */
  async createNotification(payload: CreateNotificationPayload): Promise<NotificationDocument> {
    const notification = new this.notificationModel(payload);
    return notification.save();
  }

  /** GET /api/v1/notifications */
  async findAll(
    currentUser: any,
    query?: {
      unreadOnly?: boolean;
      type?: string;
      limit?: number;
      cursor?: string;
    },
  ) {
    const orgId = currentUser?.orgId
      ? new Types.ObjectId(currentUser.orgId.toString())
      : new Types.ObjectId('6ab4f38ff2e0e1823c038948');

    const userId = currentUser?.id || currentUser?.userId
      ? new Types.ObjectId((currentUser.id || currentUser.userId).toString())
      : new Types.ObjectId();

    const filter: Record<string, any> = { orgId, userId };

    if (query?.unreadOnly === true || query?.unreadOnly as any === 'true') {
      filter.readAt = null;
    }

    if (query?.type) {
      filter.type = query.type;
    }

    if (query?.cursor && Types.ObjectId.isValid(query.cursor)) {
      filter._id = { $lt: new Types.ObjectId(query.cursor) };
    }

    const limit = query?.limit ? Math.max(1, Math.min(100, Number(query.limit))) : 50;

    const items = await this.notificationModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    const unreadCount = await this.notificationModel.countDocuments({
      orgId,
      userId,
      readAt: null,
    }).exec();

    return {
      items: items.map((item) => this.sanitizeNotification(item)),
      unreadCount,
    };
  }

  /** GET /api/v1/notifications/:id */
  async findById(id: string, currentUser: any) {
    const orgId = currentUser?.orgId
      ? new Types.ObjectId(currentUser.orgId.toString())
      : new Types.ObjectId('6ab4f38ff2e0e1823c038948');

    const userId = currentUser?.id || currentUser?.userId
      ? new Types.ObjectId((currentUser.id || currentUser.userId).toString())
      : new Types.ObjectId();

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid notification ObjectId');
    }

    const doc = await this.notificationModel.findOne({ _id: id, orgId, userId }).exec();

    if (!doc) {
      throw new NotFoundException(`Notification '${id}' not found`);
    }

    return this.sanitizeNotification(doc);
  }

  /** PUT /api/v1/notifications/:id/read */
  async markAsRead(id: string, currentUser: any) {
    const orgId = currentUser?.orgId
      ? new Types.ObjectId(currentUser.orgId.toString())
      : new Types.ObjectId('6ab4f38ff2e0e1823c038948');

    const userId = currentUser?.id || currentUser?.userId
      ? new Types.ObjectId((currentUser.id || currentUser.userId).toString())
      : new Types.ObjectId();

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid notification ObjectId');
    }

    const updated = await this.notificationModel
      .findOneAndUpdate(
        { _id: id, orgId, userId },
        { readAt: new Date() },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(`Notification '${id}' not found or access denied`);
    }

    return this.sanitizeNotification(updated);
  }

  /** PUT /api/v1/notifications/read-all */
  async markAllAsRead(currentUser: any) {
    const orgId = currentUser?.orgId
      ? new Types.ObjectId(currentUser.orgId.toString())
      : new Types.ObjectId('6ab4f38ff2e0e1823c038948');

    const userId = currentUser?.id || currentUser?.userId
      ? new Types.ObjectId((currentUser.id || currentUser.userId).toString())
      : new Types.ObjectId();

    const result = await this.notificationModel.updateMany(
      { orgId, userId, readAt: null },
      { readAt: new Date() },
    ).exec();

    return {
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount || 0,
    };
  }

  /** DELETE /api/v1/notifications/:id */
  async softDelete(id: string, currentUser: any) {
    const orgId = currentUser?.orgId
      ? new Types.ObjectId(currentUser.orgId.toString())
      : new Types.ObjectId('6ab4f38ff2e0e1823c038948');

    const userId = currentUser?.id || currentUser?.userId
      ? new Types.ObjectId((currentUser.id || currentUser.userId).toString())
      : new Types.ObjectId();

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid notification ObjectId');
    }

    const deleted = await this.notificationModel.findOneAndDelete({ _id: id, orgId, userId }).exec();
    if (!deleted) {
      throw new NotFoundException(`Notification '${id}' not found`);
    }

    return { message: `Notification '${id}' removed successfully` };
  }
}
