import mongoose, { Schema } from 'mongoose';
import { MongooseTransformReturn, MongooseTransformFn } from '../../types/mongoose.types';

export type RecommendationType = 'personalized' | 'similar' | 'trending' | 'for_you';

export interface IRecommendationCache extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // Optional for trending (no user-specific)
  productId?: mongoose.Types.ObjectId; // For similar products recommendations
  recommendationType: RecommendationType;
  productIds: mongoose.Types.ObjectId[];
  scores: Map<string, number>; // Product ID -> score mapping
  expiresAt: Date;
  createdAt: Date;
}

const recommendationCacheSchema = new Schema<IRecommendationCache>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      index: true,
    },
    recommendationType: {
      type: String,
      enum: ['personalized', 'similar', 'trending', 'for_you'],
      required: true,
      index: true,
    },
    productIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    scores: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index for auto-deletion
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

// Compound indexes
recommendationCacheSchema.index({ userId: 1, recommendationType: 1 });
recommendationCacheSchema.index({ productId: 1, recommendationType: 1 });
recommendationCacheSchema.index({ recommendationType: 1, expiresAt: 1 });

export const RecommendationCache = mongoose.model<IRecommendationCache>(
  'RecommendationCache',
  recommendationCacheSchema
);
