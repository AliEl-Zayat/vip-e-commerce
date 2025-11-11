import type { INotification, NotificationChannel, NotificationType } from './notification.model';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: Date;
  sentAt?: Date;
  createdAt: Date;
}

export const mapNotificationToDto = (notification: INotification): NotificationDto => ({
  id: notification._id.toString(),
  type: notification.type,
  title: notification.title,
  message: notification.message,
  channels: notification.channels,
  data: notification.data,
  read: notification.read,
  readAt: notification.readAt,
  sentAt: notification.sentAt,
  createdAt: notification.createdAt,
});
