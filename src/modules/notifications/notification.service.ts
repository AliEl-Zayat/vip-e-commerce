import mongoose from 'mongoose';
import { Notification, INotification, NotificationType } from './notification.model';
import { CreateNotificationDto, UpdateNotificationDto } from './dto/notification.dto';
import { AppError } from '../../utils/error.util';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.util';
import { sendEmail } from '../../utils/email.util';
import { pushNotificationService } from '../push-notifications/push-notification.service';

export class NotificationService {
  async create(data: CreateNotificationDto): Promise<INotification> {
    const notification = await Notification.create({
      userId: new mongoose.Types.ObjectId(data.userId),
      type: data.type,
      title: data.title,
      message: data.message,
      channels: data.channels || ['in_app'],
      data: data.data,
      sentAt: new Date(),
    });

    // Send via configured channels
    await this.sendNotification(notification);

    return notification;
  }

  async sendNotification(notification: INotification): Promise<void> {
    const user = await mongoose.model('User').findById(notification.userId);
    if (!user) {
      return;
    }

    // Send email if email channel is enabled
    if (notification.channels.includes('email')) {
      try {
        await sendEmail({
          to: (user as any).email,
          subject: notification.title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>${notification.title}</h2>
              <p>${notification.message}</p>
              ${notification.data?.url ? `<a href="${notification.data.url}">View Details</a>` : ''}
            </div>
          `,
        });
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }

    // Send push notification if push channel is enabled
    if (notification.channels.includes('push')) {
      try {
        await pushNotificationService.sendToUser(notification.userId.toString(), {
          title: notification.title,
          body: notification.message,
          data: notification.data || {},
        });
      } catch (error) {
        console.error('Failed to send push notification:', error);
      }
    }
  }

  async getUserNotifications(
    userId: string,
    page?: number,
    limit?: number,
    read?: boolean,
    type?: NotificationType
  ) {
    const { skip, limit: queryLimit } = parsePagination({ page, limit });

    const filter: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };
    if (read !== undefined) {
      filter.read = read;
    }
    if (type) {
      filter.type = type;
    }

    const [notifications, totalItems] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(queryLimit),
      Notification.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(page || 1, queryLimit, totalItems);

    return { notifications, meta };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      read: false,
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    const notification = await Notification.findOne({
      _id: notificationId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!notification) {
      throw AppError.notFound('Notification not found');
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  async markAllAsRead(userId: string, type?: NotificationType): Promise<{ count: number }> {
    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
      read: false,
    };
    if (type) {
      filter.type = type;
    }

    const result = await Notification.updateMany(filter, {
      $set: { read: true, readAt: new Date() },
    });

    return { count: result.modifiedCount };
  }

  async update(notificationId: string, userId: string, data: UpdateNotificationDto): Promise<INotification> {
    const notification = await Notification.findOne({
      _id: notificationId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!notification) {
      throw AppError.notFound('Notification not found');
    }

    if (data.read !== undefined) {
      notification.read = data.read;
      if (data.read) {
        notification.readAt = new Date();
      } else {
        notification.readAt = undefined;
      }
    }

    await notification.save();
    return notification;
  }

  async delete(notificationId: string, userId: string): Promise<void> {
    const result = await Notification.deleteOne({
      _id: notificationId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw AppError.notFound('Notification not found');
    }
  }

  async deleteAll(userId: string, read?: boolean): Promise<{ count: number }> {
    const filter: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };
    if (read !== undefined) {
      filter.read = read;
    }

    const result = await Notification.deleteMany(filter);
    return { count: result.deletedCount };
  }

  // Helper methods for common notification types
  async notifyOrderPlaced(userId: string, orderId: string, orderNumber: string): Promise<void> {
    await this.create({
      userId,
      type: 'order_placed',
      title: 'Order Placed Successfully',
      message: `Your order #${orderNumber} has been placed successfully.`,
      channels: ['email', 'push', 'in_app'],
      data: { orderId, orderNumber, url: `/orders/${orderId}` },
    });
  }

  async notifyOrderShipped(userId: string, orderId: string, orderNumber: string, trackingNumber?: string): Promise<void> {
    await this.create({
      userId,
      type: 'order_shipped',
      title: 'Order Shipped',
      message: `Your order #${orderNumber} has been shipped.${trackingNumber ? ` Tracking: ${trackingNumber}` : ''}`,
      channels: ['email', 'push', 'in_app'],
      data: { orderId, orderNumber, trackingNumber, url: `/orders/${orderId}` },
    });
  }

  async notifyLowStock(userId: string, productId: string, productTitle: string, stock: number): Promise<void> {
    await this.create({
      userId,
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: `${productTitle} is running low on stock (${stock} remaining).`,
      channels: ['email', 'in_app'],
      data: { productId, productTitle, stock, url: `/products/${productId}` },
    });
  }

  async notifyPriceDrop(userId: string, productId: string, productTitle: string, oldPrice: number, newPrice: number): Promise<void> {
    await this.create({
      userId,
      type: 'price_drop',
      title: 'Price Drop Alert',
      message: `${productTitle} price dropped from $${(oldPrice / 100).toFixed(2)} to $${(newPrice / 100).toFixed(2)}.`,
      channels: ['email', 'push', 'in_app'],
      data: { productId, productTitle, oldPrice, newPrice, url: `/products/${productId}` },
    });
  }
}

export const notificationService = new NotificationService();

