import mongoose, { Schema } from 'mongoose';
import { MongooseTransformReturn, MongooseTransformFn } from '../../types/mongoose.types';

export type BehaviorEventType =
  | 'product_view'
  | 'search_query'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'purchase'
  | 'wishlist_add'
  | 'favorite_add'
  | 'category_view'
  | 'product_click';

export interface IUserBehavior extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  eventType: BehaviorEventType;
  productId?: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
  eventData: {
    query?: string; // For search queries
    filters?: Record<string, unknown>; // Search filters
    duration?: number; // Time spent in milliseconds
    price?: number; // Product price at time of event
    category?: string; // Category name
    tags?: string[]; // Product tags
    [key: string]: unknown;
  };
  createdAt: Date;
}

const userBehaviorSchema = new Schema<IUserBehavior>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        'product_view',
        'search_query',
        'add_to_cart',
        'remove_from_cart',
        'purchase',
        'wishlist_add',
        'favorite_add',
        'category_view',
        'product_click',
      ],
      required: [true, 'Event type is required'],
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      index: true,
    },
    eventData: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

// Compound indexes for better query performance
userBehaviorSchema.index({ userId: 1, createdAt: -1 });
userBehaviorSchema.index({ userId: 1, eventType: 1, createdAt: -1 });
userBehaviorSchema.index({ productId: 1, eventType: 1 });
userBehaviorSchema.index({ categoryId: 1, eventType: 1 });
userBehaviorSchema.index({ createdAt: -1 }); // For trending queries

export const UserBehavior = mongoose.model<IUserBehavior>('UserBehavior', userBehaviorSchema);

