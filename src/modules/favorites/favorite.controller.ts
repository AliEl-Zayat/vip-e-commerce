import { Request, Response, NextFunction } from 'express';
import { favoriteService } from './favorite.service';
import { CreateFavoriteDto } from './dto/favorite.dto';
import { success } from '../../utils/response.util';
import type { FavoriteDto } from './favorite.types';

export class FavoriteController {
  async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as CreateFavoriteDto;
      const favorite = await favoriteService.add(req.user._id.toString(), data);

      success(
        res,
        {
          id: favorite._id.toString(),
          productId: favorite.productId.toString(),
          createdAt: favorite.createdAt,
        },
        201
      );
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      await favoriteService.remove(req.user._id.toString(), req.params.productId);
      success(res, { message: 'Favorite removed successfully' }, 200);
    } catch (err) {
      next(err);
    }
  }

  async getUserFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

      const { favorites, meta } = await favoriteService.getUserFavorites(
        req.user._id.toString(),
        page,
        limit
      );

      success(res, favorites as FavoriteDto[], 200, meta as unknown as Record<string, unknown>);
    } catch (err) {
      next(err);
    }
  }

  async checkFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const isFavorite = await favoriteService.isFavorite(
        req.user._id.toString(),
        req.params.productId
      );
      success(res, { isFavorite });
    } catch (err) {
      next(err);
    }
  }
}

export const favoriteController = new FavoriteController();
