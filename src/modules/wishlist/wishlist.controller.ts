import { Request, Response, NextFunction } from 'express';
import { wishlistService } from './wishlist.service';
import { CreateWishlistDto, UpdateWishlistDto, AddItemToWishlistDto, UpdateWishlistItemDto } from './dto/wishlist.dto';
import { success } from '../../utils/response.util';

export class WishlistController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as CreateWishlistDto;
      const wishlist = await wishlistService.create(req.user._id.toString(), data);

      success(
        res,
        {
          id: wishlist._id.toString(),
          name: wishlist.name,
          description: wishlist.description,
          isPublic: wishlist.isPublic,
          itemsCount: wishlist.items.length,
          createdAt: wishlist.createdAt,
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

      const data = req.body as UpdateWishlistDto;
      const wishlist = await wishlistService.update(req.params.id, req.user._id.toString(), data);

      success(res, {
        id: wishlist._id.toString(),
        name: wishlist.name,
        description: wishlist.description,
        isPublic: wishlist.isPublic,
        updatedAt: wishlist.updatedAt,
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

      await wishlistService.delete(req.params.id, req.user._id.toString());
      success(res, { message: 'Wishlist deleted successfully' }, 200);
    } catch (err) {
      next(err);
    }
  }

  async getUserWishlists(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

      const { wishlists, meta } = await wishlistService.getUserWishlists(req.user._id.toString(), page, limit);

      success(
        res,
        wishlists.map((w: any) => ({
          id: w._id.toString(),
          name: w.name,
          description: w.description,
          isPublic: w.isPublic,
          itemsCount: w.items.length,
          createdAt: w.createdAt,
        })),
        200,
        meta as unknown as Record<string, unknown>
      );
    } catch (err) {
      next(err);
    }
  }

  async getPublicWishlists(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

      const { wishlists, meta } = await wishlistService.getPublicWishlists(page, limit);

      success(
        res,
        wishlists.map((w: any) => ({
          id: w._id.toString(),
          name: w.name,
          description: w.description,
          user: w.userId
            ? {
                id: w.userId._id.toString(),
                name: w.userId.name,
              }
            : null,
          itemsCount: w.items.length,
          createdAt: w.createdAt,
        })),
        200,
        meta as unknown as Record<string, unknown>
      );
    } catch (err) {
      next(err);
    }
  }

  async getWishlistById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      const wishlist = await wishlistService.getWishlistById(req.params.id, userId);

      success(res, {
        id: wishlist._id.toString(),
        name: wishlist.name,
        description: wishlist.description,
        isPublic: wishlist.isPublic,
        user: (wishlist.userId as any)
          ? {
              id: (wishlist.userId as any)._id.toString(),
              name: (wishlist.userId as any).name,
            }
          : null,
        items: wishlist.items.map((item: any) => ({
          product: item.productId
            ? {
                id: item.productId._id.toString(),
                title: item.productId.title,
                slug: item.productId.slug,
                price: item.productId.price,
                images: item.productId.images,
              }
            : null,
          notes: item.notes,
          addedAt: item.addedAt,
        })),
        createdAt: wishlist.createdAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as AddItemToWishlistDto;
      const wishlist = await wishlistService.addItem(req.params.id, req.user._id.toString(), data);

      success(res, {
        id: wishlist._id.toString(),
        itemsCount: wishlist.items.length,
      });
    } catch (err) {
      next(err);
    }
  }

  async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const wishlist = await wishlistService.removeItem(
        req.params.id,
        req.user._id.toString(),
        req.params.productId
      );

      success(res, {
        id: wishlist._id.toString(),
        itemsCount: wishlist.items.length,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as UpdateWishlistItemDto;
      const wishlist = await wishlistService.updateItem(
        req.params.id,
        req.user._id.toString(),
        req.params.productId,
        data
      );

      success(res, {
        id: wishlist._id.toString(),
      });
    } catch (err) {
      next(err);
    }
  }
}

export const wishlistController = new WishlistController();

