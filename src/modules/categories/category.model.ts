import mongoose, { Schema } from 'mongoose';

export interface ICategory extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  parentId?: mongoose.Types.ObjectId;
  image?: string;
  isActive: boolean;
  order: number; // For sorting categories
  productCount?: number; // Virtual field for product count
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    image: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parentId: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ order: 1 });

// Generate slug from name before saving
categorySchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Prevent circular parent references
categorySchema.pre('save', async function (next) {
  if (this.isModified('parentId') && this.parentId) {
    // Check if parentId is the same as this category's ID
    if (this.parentId.toString() === this._id.toString()) {
      return next(new Error('Category cannot be its own parent'));
    }

    // Check for circular references (parent's parent chain)
    let currentParentId = this.parentId;
    const visited = new Set<string>();
    visited.add(this._id.toString());

    while (currentParentId) {
      if (visited.has(currentParentId.toString())) {
        return next(new Error('Circular parent reference detected'));
      }
      visited.add(currentParentId.toString());

      const parent = await mongoose.model('Category').findById(currentParentId);
      if (!parent) {
        break;
      }
      currentParentId = (parent as ICategory).parentId;
    }
  }
  next();
});

// Virtual for product count
categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true,
});

// Ensure virtuals are included in JSON
categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

export const Category = mongoose.model<ICategory>('Category', categorySchema);

