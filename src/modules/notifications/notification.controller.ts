import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { UpdateNotificationDto, MarkAllReadDto } from './dto/notification.dto';
import { success } from '../../utils/response.util';

export class NotificationController {
  async getUserNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
      const read = req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined;
      const type = req.query.type as string | undefined;

      const { notifications, meta } = await notificationService.getUserNotifications(
        req.user._id.toString(),
        page,
        limit,
        read,
        type as any
      );

      success(
        res,
        notifications.map((n) => ({
          id: n._id.toString(),
          type: n.type,
          title: n.title,
          message: n.message,
          channels: n.channels,
          data: n.data,
          read: n.read,
          readAt: n.readAt,
          sentAt: n.sentAt,
          createdAt: n.createdAt,
        })),
        200,
        meta as unknown as Record<string, unknown>
      );
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const count = await notificationService.getUnreadCount(req.user._id.toString());
      success(res, { count });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const notification = await notificationService.markAsRead(req.params.id, req.user._id.toString());
      success(res, {
        id: notification._id.toString(),
        read: notification.read,
        readAt: notification.readAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as MarkAllReadDto;
      const result = await notificationService.markAllAsRead(req.user._id.toString(), data.type);

      success(res, { count: result.count });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as UpdateNotificationDto;
      const notification = await notificationService.update(req.params.id, req.user._id.toString(), data);

      success(res, {
        id: notification._id.toString(),
        read: notification.read,
        readAt: notification.readAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      await notificationService.delete(req.params.id, req.user._id.toString());
      success(res, { message: 'Notification deleted successfully' }, 200);
    } catch (err) {
      next(err);
    }
  }

  async deleteAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const read = req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined;
      const result = await notificationService.deleteAll(req.user._id.toString(), read);

      success(res, { count: result.count });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();

