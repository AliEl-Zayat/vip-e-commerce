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
      required: [true, 'Coupon code is required'],
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    discountType: {
      type: String,
      enum: {
        values: ['percentage', 'fixed'],
        message: 'Discount type must be percentage or fixed',
      },
      required: [true, 'Discount type is required'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value must be non-negative'],
    },
    minPurchaseAmount: {
      type: Number,
      min: [0, 'Minimum purchase amount must be non-negative'],
    },
    maxDiscountAmount: {
      type: Number,
      min: [0, 'Maximum discount amount must be non-negative'],
    },
    validFrom: {
      type: Date,
      required: [true, 'Valid from date is required'],
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: [true, 'Valid until date is required'],
    },
    usageLimit: {
      type: Number,
      min: [1, 'Usage limit must be at least 1'],
    },
    usageLimitPerUser: {
      type: Number,
      min: [1, 'Usage limit per user must be at least 1'],
    },
    applicableTo: {
      type: String,
      enum: {
        values: ['all', 'category', 'product'],
        message: 'Applicable to must be all, category, or product',
      },
      default: 'all',
    },
    applicableCategories: [
      {
        type: String,
        trim: true,
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
      // Index defined at schema level: couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 })
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, 'Usage count must be non-negative'],
    },
    usageHistory: {
      type: [couponUsageSchema],
      default: [],
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

// Compound indexes for better query performance
couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
couponSchema.index({ applicableTo: 1, applicableProducts: 1 });

// Validate discount value based on type
couponSchema.pre('save', function (next) {
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    return next(new Error('Percentage discount cannot exceed 100%'));
  }
  if (this.validFrom >= this.validUntil) {
    return next(new Error('Valid from date must be before valid until date'));
  }
  next();
});

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);


