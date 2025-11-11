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
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      // Index defined at schema level: categorySchema.index({ parentId: 1, isActive: 1 })
    },
    image: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      // Index defined at schema level: categorySchema.index({ isActive: 1, order: 1 })
    },
    order: {
      type: Number,
      default: 0,
      min: [0, 'Order must be non-negative'],
    },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
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
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parentId: 1, isActive: 1 });
categorySchema.index({ isActive: 1, order: 1 });
categorySchema.index({ name: 1 }, { unique: true });

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
      const parentCategory = parent as ICategory;
      if (!parentCategory.parentId) {
        break;
      }
      currentParentId = parentCategory.parentId;
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

// Virtuals are already configured in schema options above

export const Category = mongoose.model<ICategory>('Category', categorySchema);


