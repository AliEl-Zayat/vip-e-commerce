import { Request, Response, NextFunction } from 'express';
import { ratingService } from './rating.service';
import { CreateRatingDto, UpdateRatingDto } from './dto/rating.dto';
import { success } from '../../utils/response.util';
import { IRating } from './rating.model';

export const transformRating = (rating: IRating) => ({
  id: rating._id.toString(),
  productId: rating.productId.toString(),
  userId: rating.userId.toString(),
  rating: rating.rating,
  review: rating.review,
});
export class RatingController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as CreateRatingDto;
      const rating = await ratingService.create(req.user._id.toString(), data);

      success(
        res,
        {
          id: rating._id.toString(),
          productId: rating.productId.toString(),
          userId: rating.userId.toString(),
          rating: rating.rating,
          review: rating.review,
          isVerifiedPurchase: rating.isVerifiedPurchase,
          helpfulCount: rating.helpfulCount,
          createdAt: rating.createdAt,
        },
        201
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

      const data = req.body as UpdateRatingDto;
      const rating = await ratingService.update(req.params.id, req.user._id.toString(), data);

      success(res, {
        id: rating._id.toString(),
        rating: rating.rating,
        review: rating.review,
        updatedAt: rating.updatedAt,
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

      await ratingService.delete(req.params.id, req.user._id.toString(), req.user.role);
      success(res, { message: 'Rating deleted successfully' }, 200);
    } catch (err) {
      next(err);
    }
  }

  async getProductRatings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
      const minRating = req.query.minRating ? parseInt(String(req.query.minRating), 10) : undefined;

      const { ratings, meta } = await ratingService.getProductRatings(
        req.params.productId,
        page,
        limit,
        minRating
      );

      success(
        res,
        ratings.map((r: IRating) => ({
          ...transformRating(r as unknown as IRating),
        })),
        200,
        meta as unknown as Record<string, unknown>
      );
    } catch (err) {
      next(err);
    }
  }

  async getProductRatingStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await ratingService.getProductRatingStats(req.params.productId);
      success(res, stats);
    } catch (err) {
      next(err);
    }
  }

  async getUserRating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const rating = await ratingService.getUserRating(
        req.params.productId,
        req.user._id.toString()
      );

      if (!rating) {
        success(res, null, 200);
        return;
      }

      success(res, {
        id: rating._id.toString(),
        rating: rating.rating,
        review: rating.review,
        isVerifiedPurchase: rating.isVerifiedPurchase,
        helpfulCount: rating.helpfulCount,
        createdAt: rating.createdAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async markHelpful(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rating = await ratingService.markHelpful(req.params.id);
      success(res, {
        id: rating._id.toString(),
        helpfulCount: rating.helpfulCount,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const ratingController = new RatingController();
