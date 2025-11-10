import mongoose from 'mongoose';
import { Category, ICategory } from './category.model';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { AppError } from '../../utils/error.util';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.util';
import { Product } from '../products/product.model';

export interface CategoryListQuery {
  page?: number;
  limit?: number;
  parentId?: string;
  isActive?: boolean;
  includeProductCount?: boolean;
}

export class CategoryService {
  async createCategory(data: CreateCategoryDto): Promise<ICategory> {
    // Generate slug if not provided
    let slug = data.slug;
    if (!slug) {
      slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Check if slug already exists
    const existingCategory = await Category.findOne({
      $or: [{ slug }, { name: data.name }],
    });
    if (existingCategory) {
      throw AppError.conflict('Category with this name or slug already exists');
    }

    // Validate parent exists if provided
    if (data.parentId) {
      const parent = await Category.findById(data.parentId);
      if (!parent) {
        throw AppError.badRequest('Parent category does not exist');
      }
    }

    const category = await Category.create({
      ...data,
      slug,
      parentId: data.parentId ? new mongoose.Types.ObjectId(data.parentId) : undefined,
    });

    return category;
  }

  async getCategoryById(id: string, includeProductCount = false): Promise<ICategory> {
    const category = await Category.findById(id).populate('parentId', 'name slug');
    if (!category) {
      throw AppError.notFound('Category not found');
    }

    if (includeProductCount) {
      const productCount = await Product.countDocuments({ category: category.name });
      (category as any).productCount = productCount;
    }

    return category;
  }

  async getCategoryBySlug(slug: string, includeProductCount = false): Promise<ICategory> {
    const category = await Category.findOne({ slug }).populate('parentId', 'name slug');
    if (!category) {
      throw AppError.notFound('Category not found');
    }

    if (includeProductCount) {
      const productCount = await Product.countDocuments({ category: category.name });
      (category as any).productCount = productCount;
    }

    return category;
  }

  async listCategories(query: CategoryListQuery) {
    const { page, limit, skip } = parsePagination(query);

    const filter: Record<string, unknown> = {};

    if (query.parentId !== undefined) {
      if (query.parentId === null || query.parentId === 'null') {
        filter.parentId = null;
      } else {
        filter.parentId = new mongoose.Types.ObjectId(query.parentId);
      }
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    const [categories, totalItems] = await Promise.all([
      Category.find(filter)
        .populate('parentId', 'name slug')
        .sort({ order: 1, name: 1 })
        .skip(skip)
        .limit(limit),
      Category.countDocuments(filter),
    ]);

    // Add product counts if requested
    if (query.includeProductCount) {
      for (const category of categories) {
        const productCount = await Product.countDocuments({ category: category.name });
        (category as any).productCount = productCount;
      }
    }

    const meta = buildPaginationMeta(page, limit, totalItems);

    return { categories, meta };
  }

  async getCategoryTree(includeProductCount = false): Promise<ICategory[]> {
    // Get all categories
    const allCategories = await Category.find({ isActive: true })
      .populate('parentId', 'name slug')
      .sort({ order: 1, name: 1 });

    // Add product counts if requested
    if (includeProductCount) {
      for (const category of allCategories) {
        const productCount = await Product.countDocuments({ category: category.name });
        (category as any).productCount = productCount;
      }
    }

    // Build tree structure
    const categoryMap = new Map<string, ICategory & { children?: ICategory[] }>();
    const rootCategories: (ICategory & { children?: ICategory[] })[] = [];

    // First pass: create map of all categories
    allCategories.forEach((category) => {
      categoryMap.set(category._id.toString(), { ...category.toObject(), children: [] });
    });

    // Second pass: build tree
    allCategories.forEach((category) => {
      const categoryObj = categoryMap.get(category._id.toString())!;
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId.toString());
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(categoryObj);
        } else {
          // Parent not found or inactive, treat as root
          rootCategories.push(categoryObj);
        }
      } else {
        rootCategories.push(categoryObj);
      }
    });

    return rootCategories;
  }

  async updateCategory(id: string, data: UpdateCategoryDto): Promise<ICategory> {
    const category = await Category.findById(id);
    if (!category) {
      throw AppError.notFound('Category not found');
    }

    // Generate slug if name changed and slug not provided
    let slug = data.slug;
    if (data.name && !slug) {
      slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Check if slug/name conflicts with another category
    if (slug || data.name) {
      const existingCategory = await Category.findOne({
        $or: [{ slug: slug || category.slug }, { name: data.name || category.name }],
        _id: { $ne: id },
      });
      if (existingCategory) {
        throw AppError.conflict('Category with this name or slug already exists');
      }
    }

    // Validate parent exists if provided
    if (data.parentId !== undefined) {
      if (data.parentId === null || data.parentId === 'null') {
        // Removing parent is allowed
      } else {
        const parent = await Category.findById(data.parentId);
        if (!parent) {
          throw AppError.badRequest('Parent category does not exist');
        }
        // Prevent setting parent to itself
        if (data.parentId === id) {
          throw AppError.badRequest('Category cannot be its own parent');
        }
      }
    }

    const updateData: Record<string, unknown> = { ...data };
    if (slug) {
      updateData.slug = slug;
    }
    if (data.parentId !== undefined) {
      updateData.parentId =
        data.parentId === null || data.parentId === 'null'
          ? null
          : new mongoose.Types.ObjectId(data.parentId);
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, { $set: updateData }, { new: true });

    if (!updatedCategory) {
      throw AppError.notFound('Category not found');
    }

    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await Category.findById(id);
    if (!category) {
      throw AppError.notFound('Category not found');
    }

    // Check if category has children
    const childrenCount = await Category.countDocuments({ parentId: id });
    if (childrenCount > 0) {
      throw AppError.badRequest('Cannot delete category with child categories');
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ category: category.name });
    if (productCount > 0) {
      throw AppError.badRequest('Cannot delete category with associated products');
    }

    await Category.findByIdAndDelete(id);
  }

  async getCategoryWithChildren(id: string): Promise<ICategory & { children?: ICategory[] }> {
    const category = await Category.findById(id).populate('parentId', 'name slug');
    if (!category) {
      throw AppError.notFound('Category not found');
    }

    const children = await Category.find({ parentId: id, isActive: true })
      .populate('parentId', 'name slug')
      .sort({ order: 1, name: 1 });

    return { ...category.toObject(), children };
  }
}

export const categoryService = new CategoryService();

