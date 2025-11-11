import { Request, Response, NextFunction } from 'express';
import { recommendationService } from './recommendation.service';
import { success } from '../../utils/response.util';
import { asyncHandler } from '../../utils/async-handler.util';
import { isAuthenticated } from '../../utils/type-guards.util';
import { AppError } from '../../utils/error.util';

export class RecommendationController {
  getPersonalized = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!isAuthenticated(req)) {
      throw AppError.unauthorized('User not authenticated');
    }

    const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

    const result = await recommendationService.getPersonalizedRecommendations(
      req.user._id.toString(),
      page,
      limit
    );

    success(
      res,
      result.products.map((p: any) => ({
        id: p._id.toString(),
        title: p.title,
        slug: p.slug,
        description: p.description,
        price: p.price,
        currency: p.currency,
        images: p.images,
        stock: p.stock,
        category: p.category,
        categoryId: p.categoryId?._id?.toString(),
        tags: p.tags,
        seller: p.sellerId
          ? {
              id: p.sellerId._id.toString(),
              name: p.sellerId.name,
              email: p.sellerId.email,
            }
          : null,
        createdAt: p.createdAt,
      })),
      200,
      result.meta as unknown as Record<string, unknown>
    );
  });

  getSimilar = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const productId = req.params.productId;
    const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

    const result = await recommendationService.getSimilarProducts(productId, page, limit);

    success(
      res,
      result.products.map((p: any) => ({
        id: p._id.toString(),
        title: p.title,
        slug: p.slug,
        description: p.description,
        price: p.price,
        currency: p.currency,
        images: p.images,
        stock: p.stock,
        category: p.category,
        categoryId: p.categoryId?._id?.toString(),
        tags: p.tags,
        seller: p.sellerId
          ? {
              id: p.sellerId._id.toString(),
              name: p.sellerId.name,
              email: p.sellerId.email,
            }
          : null,
        createdAt: p.createdAt,
      })),
      200,
      result.meta as unknown as Record<string, unknown>
    );
  });

  getTrending = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

    const result = await recommendationService.getTrendingProducts(page, limit);

    success(
      res,
      result.products.map((p: any) => ({
        id: p._id.toString(),
        title: p.title,
        slug: p.slug,
        description: p.description,
        price: p.price,
        currency: p.currency,
        images: p.images,
        stock: p.stock,
        category: p.category,
        categoryId: p.categoryId?._id?.toString(),
        tags: p.tags,
        seller: p.sellerId
          ? {
              id: p.sellerId._id.toString(),
              name: p.sellerId.name,
              email: p.sellerId.email,
            }
          : null,
        createdAt: p.createdAt,
      })),
      200,
      result.meta as unknown as Record<string, unknown>
    );
  });

  getForYou = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!isAuthenticated(req)) {
      throw AppError.unauthorized('User not authenticated');
    }

    const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

    const result = await recommendationService.getRecommendedForYou(req.user._id.toString(), page, limit);

    success(
      res,
      result.products.map((p: any) => ({
        id: p._id.toString(),
        title: p.title,
        slug: p.slug,
        description: p.description,
        price: p.price,
        currency: p.currency,
        images: p.images,
        stock: p.stock,
        category: p.category,
        categoryId: p.categoryId?._id?.toString(),
        tags: p.tags,
        seller: p.sellerId
          ? {
              id: p.sellerId._id.toString(),
              name: p.sellerId.name,
              email: p.sellerId.email,
            }
          : null,
        createdAt: p.createdAt,
      })),
      200,
      result.meta as unknown as Record<string, unknown>
    );
  });
}

export const recommendationController = new RecommendationController();

