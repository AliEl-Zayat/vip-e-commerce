import { Request, Response } from 'express';
import * as productService from './product.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { success } from '../../utils/response.util';
import { uploadToCloudinary } from '../../utils/cloudinary.util';
import { AppError } from '../../utils/error.util';
import { asyncHandler } from '../../utils/async-handler.util';

import { IProduct } from './product.model';

// Pure function: Transform product to response format
const transformProduct = (product: IProduct) => ({
  id: product._id.toString(),
  title: product.title,
  slug: product.slug,
  description: product.description,
  price: product.price,
  currency: product.currency,
  images: product.images,
  stock: product.stock,
  category: product.category,
  categoryId: product.categoryId?.toString(),
  tags: product.tags,
  sellerId: product.sellerId?.toString ? product.sellerId.toString() : product.sellerId,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

// Controller handlers (functional programming approach)
export const create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new Error('User not authenticated');
  }

  const data = req.body as CreateProductDto;
  const product = await productService.create(data, req.user._id.toString());

  success(res, transformProduct(product), 201);
});

export const getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const product = await productService.getById(req.params.id);
  success(res, transformProduct(product));
});

export const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const qParam = req.query.q as string | undefined;
  const query = {
    page: req.query.page ? parseInt(String(req.query.page), 10) : undefined,
    limit: req.query.limit ? parseInt(String(req.query.limit), 10) : undefined,
    sort: req.query.sort as string | undefined,
    q: qParam && qParam.trim() ? qParam.trim() : undefined,
    category: req.query.category as string | undefined,
    minPrice: req.query.minPrice ? parseFloat(String(req.query.minPrice)) : undefined,
    maxPrice: req.query.maxPrice ? parseFloat(String(req.query.maxPrice)) : undefined,
  };

  const { products, meta } = await productService.list(query);

  success(
    res,
    products.map(transformProduct),
    200,
    meta as unknown as Record<string, unknown>
  );
});

export const update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new Error('User not authenticated');
  }

  const data = req.body as UpdateProductDto;
  const product = await productService.update(
    req.params.id,
    data,
    req.user._id.toString(),
    req.user.role
  );

  success(res, transformProduct(product));
});

export const remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new Error('User not authenticated');
  }

  await productService.remove(req.params.id, req.user._id.toString(), req.user.role);
  success(res, { message: 'Product deleted successfully' }, 200);
});

export const uploadImages = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new Error('User not authenticated');
  }

  if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
    throw AppError.badRequest('No files uploaded');
  }

  const files = Array.isArray(req.files) ? req.files : [req.files];
  const product = await productService.getById(req.params.id);

  // Check ownership
  if (req.user.role !== 'admin' && product.sellerId.toString() !== req.user._id.toString()) {
    throw AppError.forbidden('You can only upload images to your own products');
  }

  // Upload images to Cloudinary
  const uploadPromises = files.map(file =>
    uploadToCloudinary(file as Express.Multer.File, `products/${product._id}`)
  );

  const uploadedImages = await Promise.all(uploadPromises);

  // Update product with new images
  const updatedProduct = await productService.update(
    req.params.id,
    {
      images: [...product.images, ...uploadedImages],
    } as UpdateProductDto,
    req.user._id.toString(),
    req.user.role
  );

  success(res, {
    id: updatedProduct._id.toString(),
    images: updatedProduct.images,
  });
});
