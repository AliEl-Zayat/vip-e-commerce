import mongoose, { Schema } from 'mongoose';

export type DiscountType = 'percentage' | 'fixed';
export type CouponApplicableTo = 'all' | 'category' | 'product';

export interface ICouponUsage {
  userId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  usedAt: Date;
}

export interface ICoupon extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number; // Percentage (0-100) or fixed amount in cents
  minPurchaseAmount?: number; // Minimum purchase to use coupon (in cents)
  maxDiscountAmount?: number; // Maximum discount amount (for percentage, in cents)
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number; // Total usage limit
  usageLimitPerUser?: number; // Per-user usage limit
  applicableTo: CouponApplicableTo;
  applicableCategories?: string[]; // If applicableTo is 'category'
  applicableProducts?: mongoose.Types.ObjectId[]; // If applicableTo is 'product'
  isActive: boolean;
  usageCount: number;
  usageHistory: ICouponUsage[];
  createdAt: Date;
  updatedAt: Date;
}

const couponUsageSchema = new Schema<ICouponUsage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minPurchaseAmount: {
      type: Number,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
    },
    validFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      min: 1,
    },
    usageLimitPerUser: {
      type: Number,
      min: 1,
    },
    applicableTo: {
      type: String,
      enum: ['all', 'category', 'product'],
      default: 'all',
    },
    applicableCategories: [
      {
        type: String,
      },
    ],
    applicableProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    usageHistory: [couponUsageSchema],
  },
  {
    timestamps: true,
  }
);

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });

// Validate discount value based on type
couponSchema.pre('save', function (next) {
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    return next(new Error('Percentage discount cannot exceed 100%'));
  }
  next();
});

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);

