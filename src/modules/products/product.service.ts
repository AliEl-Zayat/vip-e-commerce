import mongoose from 'mongoose';
import { Product, IProduct } from './product.model';
import { Category } from '../categories/category.model';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { AppError } from '../../utils/error.util';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.util';

export interface ProductListQuery {
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

// Pure function: Generate slug from title
const generateSlug = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Pure function: Build product filter
const buildProductFilter = (query: ProductListQuery): Record<string, unknown> => {
  const filter: Record<string, unknown> = {};

  if (query.q && query.q.trim()) {
    filter.$text = { $search: query.q.trim() };
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {} as Record<string, number>;
    if (query.minPrice !== undefined) {
      (filter.price as Record<string, number>).$gte = query.minPrice;
    }
    if (query.maxPrice !== undefined) {
      (filter.price as Record<string, number>).$lte = query.maxPrice;
    }
  }

  return filter;
};

// Pure function: Build sort object
const buildSort = (sortString?: string): Record<string, 1 | -1> => {
  if (!sortString) {
    return { createdAt: -1 };
  }

  const [field, order] = sortString.split(':');
  return { [field]: order === 'asc' ? 1 : -1 };
};

// Service functions (functional programming approach)
export const create = async (data: CreateProductDto, sellerId: string): Promise<IProduct> => {
  // Generate slug
  const slug = generateSlug(data.title);

  // Check if slug already exists
  const existingProduct = await Product.findOne({ slug });
  if (existingProduct) {
    throw AppError.conflict('Product with this title already exists');
  }

  // Validate categoryId if provided
  let categoryName = data.category;
  if (data.categoryId) {
    const category = await Category.findById(data.categoryId);
    if (!category) {
      throw AppError.badRequest('Category not found');
    }
    categoryName = category.name;
  }

  const product = await Product.create({
    ...data,
    category: categoryName,
    categoryId: data.categoryId ? new mongoose.Types.ObjectId(data.categoryId) : undefined,
    slug,
    sellerId,
    images: [],
  });

  return product;
};

export const getById = async (id: string): Promise<IProduct> => {
  const product = await Product.findById(id)
    .populate('sellerId', 'name email')
    .populate('categoryId', 'name slug');
  if (!product) {
    throw AppError.notFound('Product not found');
  }
  return product;
};

export const list = async (query: ProductListQuery) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = buildProductFilter(query);
  const sort = buildSort(query.sort);

  // Execute query
  const [products, totalItems] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit).populate('sellerId', 'name email'),
    Product.countDocuments(filter),
  ]);

  const meta = buildPaginationMeta(page, limit, totalItems);

  return { products, meta };
};

export const update = async (
  id: string,
  data: UpdateProductDto,
  userId: string,
  userRole: string
): Promise<IProduct> => {
  const product = await Product.findById(id);
  if (!product) {
    throw AppError.notFound('Product not found');
  }

  // Check ownership (seller can only update own products, admin can update any)
  if (userRole !== 'admin' && product.sellerId.toString() !== userId) {
    throw AppError.forbidden('You can only update your own products');
  }

  // Update slug if title changed
  const finalUpdateData: Record<string, unknown> = { ...data };
  if (data.title && data.title !== product.title) {
    const newSlug = generateSlug(data.title);

    // Check if new slug exists
    const existingProduct = await Product.findOne({ slug: newSlug, _id: { $ne: id } });
    if (existingProduct) {
      throw AppError.conflict('Product with this title already exists');
    }

    finalUpdateData.slug = newSlug;
  }

  // Validate categoryId if provided
  if (data.categoryId) {
    const category = await Category.findById(data.categoryId);
    if (!category) {
      throw AppError.badRequest('Category not found');
    }
    finalUpdateData.category = category.name;
    finalUpdateData.categoryId = new mongoose.Types.ObjectId(data.categoryId);
  } else if (data.category) {
    finalUpdateData.category = data.category;
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    id,
    { $set: finalUpdateData },
    { new: true, runValidators: true }
  );

  if (!updatedProduct) {
    throw AppError.notFound('Product not found');
  }

  return updatedProduct;
};

export const remove = async (id: string, userId: string, userRole: string): Promise<void> => {
  const product = await Product.findById(id);
  if (!product) {
    throw AppError.notFound('Product not found');
  }

  // Check ownership
  if (userRole !== 'admin' && product.sellerId.toString() !== userId) {
    throw AppError.forbidden('You can only delete your own products');
  }

  await Product.findByIdAndDelete(id);
};

export const updateStock = async (id: string, quantity: number): Promise<IProduct> => {
  const product = await Product.findByIdAndUpdate(id, { $inc: { stock: quantity } }, { new: true });

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  return product;
};
