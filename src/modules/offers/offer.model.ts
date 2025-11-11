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
      required: [true, 'Offer title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    offerType: {
      type: String,
      enum: {
        values: ['flash_sale', 'bogo', 'category_discount', 'product_discount', 'bundle', 'free_shipping'],
        message: 'Offer type must be one of: flash_sale, bogo, category_discount, product_discount, bundle, free_shipping',
      },
      required: [true, 'Offer type is required'],
      // Index defined at schema level: offerSchema.index({ offerType: 1, isActive: 1 })
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
    flashSaleStart: {
      type: Date,
    },
    flashSaleEnd: {
      type: Date,
    },
    flashSaleStockLimit: {
      type: Number,
      min: [0, 'Flash sale stock limit must be non-negative'],
    },
    bogoBuyQuantity: {
      type: Number,
      min: [1, 'BOGO buy quantity must be at least 1'],
    },
    bogoGetQuantity: {
      type: Number,
      min: [1, 'BOGO get quantity must be at least 1'],
    },
    bogoProductId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
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
    bundleProducts: {
      type: [bundleProductSchema],
      default: [],
    },
    bundlePrice: {
      type: Number,
      min: [0, 'Bundle price must be non-negative'],
    },
    freeShippingMinAmount: {
      type: Number,
      min: [0, 'Free shipping minimum amount must be non-negative'],
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
    isActive: {
      type: Boolean,
      default: true,
      // Index defined at schema level: offerSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 })
    },
    priority: {
      type: Number,
      default: 0,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, 'Usage count must be non-negative'],
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
offerSchema.index({ offerType: 1, isActive: 1 });
offerSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
offerSchema.index({ priority: -1, isActive: 1 });
offerSchema.index({ applicableProducts: 1, isActive: 1 });
offerSchema.index({ applicableCategories: 1, isActive: 1 });

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


