import { Product, IProduct } from './product.model';
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

export class ProductService {
  async create(data: CreateProductDto, sellerId: string): Promise<IProduct> {
    // Generate slug
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

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
      // Use category name from Category model if categoryId is provided
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
  }

  async getById(id: string): Promise<IProduct> {
    const product = await Product.findById(id)
      .populate('sellerId', 'name email')
      .populate('categoryId', 'name slug');
    if (!product) {
      throw AppError.notFound('Product not found');
    }
    return product;
  }

  async list(query: ProductListQuery) {
    const { page, limit, skip } = parsePagination(query);

    // Build filter
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

    // Build sort
    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    if (query.sort) {
      const [field, order] = query.sort.split(':');
      sort = { [field]: order === 'asc' ? 1 : -1 };
    }

    // Execute query
    const [products, totalItems] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('sellerId', 'name email'),
      Product.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(page, limit, totalItems);

    return { products, meta };
  }

  async update(id: string, data: UpdateProductDto, userId: string, userRole: string): Promise<IProduct> {
    const product = await Product.findById(id);
    if (!product) {
      throw AppError.notFound('Product not found');
    }

    // Check ownership (seller can only update own products, admin can update any)
    if (userRole !== 'admin' && product.sellerId.toString() !== userId) {
      throw AppError.forbidden('You can only update your own products');
    }

    // Update slug if title changed
    if (data.title && data.title !== product.title) {
      const newSlug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if new slug exists
      const existingProduct = await Product.findOne({ slug: newSlug, _id: { $ne: id } });
      if (existingProduct) {
        throw AppError.conflict('Product with this title already exists');
      }

      data = { ...data, slug: newSlug } as UpdateProductDto;
    }

    // Validate categoryId if provided
    const updateData: Record<string, unknown> = { ...data };
    if (data.categoryId) {
      const category = await Category.findById(data.categoryId);
      if (!category) {
        throw AppError.badRequest('Category not found');
      }
      // Update category name from Category model
      updateData.category = category.name;
      updateData.categoryId = new mongoose.Types.ObjectId(data.categoryId);
    } else if (data.category) {
      // If category string is provided, keep it
      updateData.category = data.category;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      throw AppError.notFound('Product not found');
    }

    return updatedProduct;
  }

  async delete(id: string, userId: string, userRole: string): Promise<void> {
    const product = await Product.findById(id);
    if (!product) {
      throw AppError.notFound('Product not found');
    }

    // Check ownership
    if (userRole !== 'admin' && product.sellerId.toString() !== userId) {
      throw AppError.forbidden('You can only delete your own products');
    }

    await Product.findByIdAndDelete(id);
  }

  async updateStock(id: string, quantity: number): Promise<IProduct> {
    const product = await Product.findByIdAndUpdate(
      id,
      { $inc: { stock: quantity } },
      { new: true }
    );

    if (!product) {
      throw AppError.notFound('Product not found');
    }

    return product;
  }
}

export const productService = new ProductService();

