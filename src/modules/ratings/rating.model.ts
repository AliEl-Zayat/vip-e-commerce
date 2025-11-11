import mongoose, { Schema } from 'mongoose';

export interface IRating extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rating: number; // 1-5
  review?: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ratingSchema = new Schema<IRating>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      // Index defined at schema level: ratingSchema.index({ productId: 1, userId: 1 }, { unique: true })
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      // Index defined at schema level: ratingSchema.index({ productId: 1, userId: 1 }, { unique: true })
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      // Index defined at schema level: ratingSchema.index({ productId: 1, rating: 1 })
    },
    review: {
      type: String,
      trim: true,
      maxlength: [2000, 'Review cannot exceed 2000 characters'],
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: [0, 'Helpful count must be non-negative'],
    },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Ensure one rating per user per product
ratingSchema.index({ productId: 1, userId: 1 }, { unique: true });
ratingSchema.index({ productId: 1, rating: 1 });
ratingSchema.index({ productId: 1, createdAt: -1 });
ratingSchema.index({ userId: 1, createdAt: -1 });

export const Rating = mongoose.model<IRating>('Rating', ratingSchema);

