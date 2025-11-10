import mongoose, { Schema } from 'mongoose';

export type OfferType = 'flash_sale' | 'bogo' | 'category_discount' | 'product_discount' | 'bundle' | 'free_shipping';
export type DiscountType = 'percentage' | 'fixed';

export interface IOffer extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  offerType: OfferType;
  discountType: DiscountType;
  discountValue: number; // Percentage (0-100) or fixed amount in cents
  minPurchaseAmount?: number; // Minimum purchase to qualify (in cents)
  maxDiscountAmount?: number; // Maximum discount amount (for percentage, in cents)
  
  // Flash sale specific
  flashSaleStart?: Date;
  flashSaleEnd?: Date;
  flashSaleStockLimit?: number; // Limited stock for flash sale
  
  // BOGO specific
  bogoBuyQuantity?: number; // Buy X
  bogoGetQuantity?: number; // Get Y free
  bogoProductId?: mongoose.Types.ObjectId; // Specific product for BOGO
  
  // Category/Product specific
  applicableCategories?: string[];
  applicableProducts?: mongoose.Types.ObjectId[];
  
  // Bundle specific
  bundleProducts?: Array<{
    productId: mongoose.Types.ObjectId;
    quantity: number;
  }>;
  bundlePrice?: number; // Fixed price for bundle (in cents)
  
  // Free shipping specific
  freeShippingMinAmount?: number; // Minimum order amount for free shipping
  
  // General
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  priority: number; // Higher priority offers are applied first (default: 0)
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const bundleProductSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const offerSchema = new Schema<IOffer>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    offerType: {
      type: String,
      enum: ['flash_sale', 'bogo', 'category_discount', 'product_discount', 'bundle', 'free_shipping'],
      required: true,
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
    flashSaleStart: {
      type: Date,
    },
    flashSaleEnd: {
      type: Date,
    },
    flashSaleStockLimit: {
      type: Number,
      min: 0,
    },
    bogoBuyQuantity: {
      type: Number,
      min: 1,
    },
    bogoGetQuantity: {
      type: Number,
      min: 1,
    },
    bogoProductId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
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
    bundleProducts: [bundleProductSchema],
    bundlePrice: {
      type: Number,
      min: 0,
    },
    freeShippingMinAmount: {
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
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

offerSchema.index({ offerType: 1 });
offerSchema.index({ isActive: 1 });
offerSchema.index({ validFrom: 1, validUntil: 1 });
offerSchema.index({ priority: -1 });
offerSchema.index({ applicableProducts: 1 });
offerSchema.index({ applicableCategories: 1 });

// Validate offer based on type
offerSchema.pre('save', function (next) {
  // Validate discount value
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    return next(new Error('Percentage discount cannot exceed 100%'));
  }

  // Validate flash sale dates
  if (this.offerType === 'flash_sale') {
    if (!this.flashSaleStart || !this.flashSaleEnd) {
      return next(new Error('Flash sale requires start and end dates'));
    }
    if (this.flashSaleStart >= this.flashSaleEnd) {
      return next(new Error('Flash sale start date must be before end date'));
    }
  }

  // Validate BOGO
  if (this.offerType === 'bogo') {
    if (!this.bogoBuyQuantity || !this.bogoGetQuantity) {
      return next(new Error('BOGO offer requires buy and get quantities'));
    }
  }

  // Validate bundle
  if (this.offerType === 'bundle') {
    if (!this.bundleProducts || this.bundleProducts.length < 2) {
      return next(new Error('Bundle offer requires at least 2 products'));
    }
    if (!this.bundlePrice) {
      return next(new Error('Bundle offer requires bundle price'));
    }
  }

  // Validate category/product discounts
  if (this.offerType === 'category_discount' && (!this.applicableCategories || this.applicableCategories.length === 0)) {
    return next(new Error('Category discount requires at least one category'));
  }

  if (this.offerType === 'product_discount' && (!this.applicableProducts || this.applicableProducts.length === 0)) {
    return next(new Error('Product discount requires at least one product'));
  }

  // Validate free shipping
  if (this.offerType === 'free_shipping' && !this.freeShippingMinAmount) {
    return next(new Error('Free shipping offer requires minimum amount'));
  }

  // Validate general dates
  if (this.validFrom >= this.validUntil) {
    return next(new Error('Valid from date must be before valid until date'));
  }

  next();
});

export const Offer = mongoose.model<IOffer>('Offer', offerSchema);

