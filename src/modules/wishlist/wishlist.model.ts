import mongoose, { Schema } from 'mongoose';

export interface IWishlist extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isPublic: boolean;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    addedAt: Date;
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // Index defined at schema level: wishlistSchema.index({ userId: 1, createdAt: -1 })
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isPublic: {
      type: Boolean,
      default: false,
      // Index defined at schema level: wishlistSchema.index({ isPublic: 1, createdAt: -1 })
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        notes: {
          type: String,
          trim: true,
          maxlength: 500,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

wishlistSchema.index({ userId: 1, createdAt: -1 });
wishlistSchema.index({ isPublic: 1, createdAt: -1 });

export const Wishlist = mongoose.model<IWishlist>('Wishlist', wishlistSchema);
