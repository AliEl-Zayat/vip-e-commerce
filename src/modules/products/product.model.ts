import mongoose, { Schema } from 'mongoose';
import { MongooseTransformReturn, MongooseTransformFn } from '../../types/mongoose.types';

export interface IProduct extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  price: number; // in cents
  currency: string;
  images: Array<{ url: string; id: string }>;
  stock: number;
  category: string; // Keep for backward compatibility
  categoryId?: mongoose.Types.ObjectId; // Reference to Category model
  tags: string[];
  sellerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be non-negative'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      default: 'USD',
      uppercase: true,
      length: [3, 'Currency must be 3 characters'],
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        id: {
          type: String,
          required: true,
        },
      },
    ],
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      default: 0,
      min: [0, 'Stock must be non-negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      // Index defined at schema level: productSchema.index({ category: 1, price: 1 })
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      // Index defined at schema level: productSchema.index({ categoryId: 1, stock: 1 })
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller ID is required'],
      // Index defined at schema level: productSchema.index({ sellerId: 1, createdAt: -1 })
    },
  },
  {
    timestamps: true,
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

// Compound indexes for better query performance
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ sellerId: 1, createdAt: -1 });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ categoryId: 1, stock: 1 });
productSchema.index({ price: 1, stock: 1 });
productSchema.index({ tags: 1 });
// Text search index
productSchema.index(
  { title: 'text', description: 'text' },
  { weights: { title: 10, description: 5 } }
);

// Generate slug from title before saving
productSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Validation: Ensure slug is unique
productSchema.pre('save', async function (next) {
  if (this.isModified('slug')) {
    const existingProduct = await mongoose
      .model('Product')
      .findOne({ slug: this.slug, _id: { $ne: this._id } });
    if (existingProduct) {
      return next(new Error('Product with this slug already exists'));
    }
  }
  next();
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
