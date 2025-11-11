import mongoose, { Schema } from 'mongoose';
import { MongooseTransformFn, MongooseTransformReturn } from '../../types/mongoose.types';

export type NotificationType =
  | 'order_placed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'low_stock'
  | 'price_drop'
  | 'new_product'
  | 'review_added'
  | 'wishlist_price_drop'
  | 'system';

export type NotificationChannel = 'email' | 'push' | 'in_app';

export interface INotification extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  data?: Record<string, unknown>; // Additional data (orderId, productId, etc.)
  read: boolean;
  readAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      // Index defined at schema level: notificationSchema.index({ userId: 1, read: 1, createdAt: -1 })
    },
    type: {
      type: String,
      enum: {
        values: [
          'order_placed',
          'order_shipped',
          'order_delivered',
          'order_cancelled',
          'low_stock',
          'price_drop',
          'new_product',
          'review_added',
          'wishlist_price_drop',
          'system',
        ],
        message: 'Invalid notification type',
      },
      required: [true, 'Notification type is required'],
      // Index defined at schema level: notificationSchema.index({ userId: 1, type: 1 })
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    channels: {
      type: [String],
      enum: {
        values: ['email', 'push', 'in_app'],
        message: 'Channel must be email, push, or in_app',
      },
      default: ['in_app'],
    },
    data: {
      type: Schema.Types.Mixed,
    },
    read: {
      type: Boolean,
      default: false,
      // Index defined at schema level: notificationSchema.index({ userId: 1, read: 1, createdAt: -1 })
    },
    readAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: {
      transform: ((_doc, ret: MongooseTransformReturn) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }) as MongooseTransformFn,
    },
    toObject: {
      transform: ((_doc, ret: MongooseTransformReturn) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }) as MongooseTransformFn,
    },
  }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1, type: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
