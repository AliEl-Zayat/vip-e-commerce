import mongoose, { Schema } from 'mongoose';

export interface IFavorite extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // Index defined at schema level: favoriteSchema.index({ userId: 1, productId: 1 }, { unique: true })
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      // Index defined at schema level: favoriteSchema.index({ userId: 1, productId: 1 }, { unique: true })
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one favorite per user per product
favoriteSchema.index({ userId: 1, productId: 1 }, { unique: true });
favoriteSchema.index({ userId: 1, createdAt: -1 });

export const Favorite = mongoose.model<IFavorite>('Favorite', favoriteSchema);

