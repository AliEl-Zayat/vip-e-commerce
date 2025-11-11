import mongoose, { Schema } from 'mongoose';

export type StockChangeType = 'purchase' | 'sale' | 'adjustment' | 'return' | 'restock' | 'damaged' | 'expired';

export interface IStockHistory extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  changeType: StockChangeType;
  quantity: number; // Positive for additions, negative for subtractions
  previousStock: number;
  newStock: number;
  reason?: string;
  orderId?: mongoose.Types.ObjectId; // If related to an order
  userId?: mongoose.Types.ObjectId; // Who made the change
  createdAt: Date;
}

export interface IStockAlert extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  threshold: number; // Low stock threshold
  isActive: boolean;
  notifiedAt?: Date; // Last notification sent
  createdAt: Date;
  updatedAt: Date;
}

const stockHistorySchema = new Schema<IStockHistory>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      // Index defined at schema level: stockHistorySchema.index({ productId: 1, createdAt: -1 })
    },
    changeType: {
      type: String,
      enum: {
        values: ['purchase', 'sale', 'adjustment', 'return', 'restock', 'damaged', 'expired'],
        message: 'Change type must be one of: purchase, sale, adjustment, return, restock, damaged, expired',
      },
      required: [true, 'Change type is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
    },
    previousStock: {
      type: Number,
      required: [true, 'Previous stock is required'],
      min: [0, 'Previous stock must be non-negative'],
    },
    newStock: {
      type: Number,
      required: [true, 'New stock is required'],
      min: [0, 'New stock must be non-negative'],
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      // Index defined at schema level: stockHistorySchema.index({ orderId: 1 })
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

stockHistorySchema.index({ productId: 1, createdAt: -1 });
stockHistorySchema.index({ orderId: 1 });
stockHistorySchema.index({ changeType: 1, createdAt: -1 });

const stockAlertSchema = new Schema<IStockAlert>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    threshold: {
      type: Number,
      required: [true, 'Threshold is required'],
      min: [0, 'Threshold must be non-negative'],
      default: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
      // Index defined at schema level: stockAlertSchema.index({ isActive: 1, threshold: 1 })
    },
    notifiedAt: {
      type: Date,
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

stockAlertSchema.index({ isActive: 1, threshold: 1 });
stockAlertSchema.index({ productId: 1 }, { unique: true });

export const StockHistory = mongoose.model<IStockHistory>('StockHistory', stockHistorySchema);
export const StockAlert = mongoose.model<IStockAlert>('StockAlert', stockAlertSchema);

