import mongoose, { Schema } from 'mongoose';
import { MongooseTransformReturn } from '../../types/mongoose.types';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  title: string;
  quantity: number;
  price: number; // Price at time of order
  total: number;
}

export interface IShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface IShippingInfo {
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface IOrder extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  tax: number;
  total: number;
  currency: string;
  couponCode?: string;
  couponId?: mongoose.Types.ObjectId;
  status: OrderStatus;
  shippingAddress: IShippingAddress;
  shippingInfo?: IShippingInfo;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zipCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const shippingInfoSchema = new Schema<IShippingInfo>(
  {
    carrier: {
      type: String,
    },
    trackingNumber: {
      type: String,
    },
    estimatedDelivery: {
      type: Date,
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      // Index defined at schema level: orderSchema.index({ userId: 1, createdAt: -1 })
    },
    items: {
      type: [orderItemSchema],
      required: [true, 'Order items are required'],
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: 'Order must have at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal must be non-negative'],
    },
    shippingCost: {
      type: Number,
      required: [true, 'Shipping cost is required'],
      min: [0, 'Shipping cost must be non-negative'],
      default: 0,
    },
    tax: {
      type: Number,
      required: [true, 'Tax is required'],
      min: [0, 'Tax must be non-negative'],
      default: 0,
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: [0, 'Total must be non-negative'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      default: 'USD',
      uppercase: true,
      length: [3, 'Currency must be 3 characters'],
    },
    discountAmount: {
      type: Number,
      required: [true, 'Discount amount is required'],
      min: [0, 'Discount amount must be non-negative'],
      default: 0,
    },
    couponCode: {
      type: String,
      uppercase: true,
      trim: true,
    },
    couponId: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
    },
    status: {
      type: String,
      enum: {
        values: [
          'pending',
          'confirmed',
          'processing',
          'shipped',
          'delivered',
          'cancelled',
          'refunded',
        ],
        message:
          'Status must be one of: pending, confirmed, processing, shipped, delivered, cancelled, refunded',
      },
      default: 'pending',
      // Index defined at schema level: orderSchema.index({ status: 1, createdAt: -1 })
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, 'Shipping address is required'],
    },
    shippingInfo: {
      type: shippingInfoSchema,
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'failed', 'refunded'],
        message: 'Payment status must be one of: pending, paid, failed, refunded',
      },
      default: 'pending',
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: {
      transform: (_doc, ret: MongooseTransformReturn) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret: MongooseTransformReturn) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for better query performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ 'items.productId': 1 });

// Generate order number before saving
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    let orderNumber: string;
    let isUnique = false;

    // Ensure uniqueness
    while (!isUnique) {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      orderNumber = `ORD-${timestamp}-${random}`;

      const existingOrder = await mongoose.model('Order').findOne({ orderNumber });
      if (!existingOrder) {
        isUnique = true;
      }
    }

    this.orderNumber = orderNumber!;
  }
  next();
});

export const Order = mongoose.model<IOrder>('Order', orderSchema);
