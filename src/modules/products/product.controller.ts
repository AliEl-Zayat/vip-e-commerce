import { Request, Response, NextFunction } from 'express';
import { productService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { success } from '../../utils/response.util';
import { uploadToCloudinary } from '../../utils/cloudinary.util';
import { AppError } from '../../utils/error.util';

export class ProductController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as CreateProductDto;
      const product = await productService.create(data, req.user._id.toString());

      success(
        res,
        {
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
          sellerId: product.sellerId.toString(),
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
        201
      );
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.getById(req.params.id);

      success(res, {
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
        sellerId: product.sellerId,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
        products.map(product => ({
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
          sellerId: product.sellerId,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        })),
        200,
        meta as unknown as Record<string, unknown>
      );
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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

      success(res, {
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
        sellerId: product.sellerId.toString(),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      await productService.delete(req.params.id, req.user._id.toString(), req.user.role);

      success(res, { message: 'Product deleted successfully' }, 200);
    } catch (err) {
      next(err);
    }
  }

  async uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
    } catch (err) {
      next(err);
    }
  }
}

export const productController = new ProductController();
