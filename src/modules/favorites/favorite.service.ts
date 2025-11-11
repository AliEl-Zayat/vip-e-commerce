import mongoose from 'mongoose';
import { Favorite, IFavorite } from './favorite.model';
import { CreateFavoriteDto } from './dto/favorite.dto';
import { Product } from '../products/product.model';
import { userBehaviorService } from '../user-behavior/user-behavior.service';
import { AppError } from '../../utils/error.util';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.util';

export class FavoriteService {
  async add(userId: string, data: CreateFavoriteDto): Promise<IFavorite> {
    const product = await Product.findById(data.productId);
    if (!product) {
      throw AppError.notFound('Product not found');
    }

    // Check if already favorited
    const existing = await Favorite.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(data.productId),
    });

    if (existing) {
      throw AppError.conflict('Product already in favorites');
    }

    const favorite = await Favorite.create({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(data.productId),
    });

    // Track favorite add event (async, don't block)
    userBehaviorService
      .track(userId, {
        eventType: 'favorite_add',
        productId: data.productId,
        eventData: {
          price: product.price,
          category: product.category,
          tags: product.tags,
        },
      })
      .catch((err) => {
        console.error('[FavoriteService] Error tracking favorite add:', err);
      });

    return favorite;
  }

  async remove(userId: string, productId: string): Promise<void> {
    const result = await Favorite.deleteOne({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
    });

    if (result.deletedCount === 0) {
      throw AppError.notFound('Favorite not found');
    }
  }

  async getUserFavorites(userId: string, page?: number, limit?: number) {
    const { skip, limit: queryLimit } = parsePagination({ page, limit });

    const [favorites, totalItems] = await Promise.all([
      Favorite.find({ userId: new mongoose.Types.ObjectId(userId) })
        .populate('productId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(queryLimit),
      Favorite.countDocuments({ userId: new mongoose.Types.ObjectId(userId) }),
    ]);

    const meta = buildPaginationMeta(page || 1, queryLimit, totalItems);

    return { favorites, meta };
  }

  async isFavorite(userId: string, productId: string): Promise<boolean> {
    const favorite = await Favorite.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
    });

    return !!favorite;
  }

  async getFavoriteCount(productId: string): Promise<number> {
    return Favorite.countDocuments({ productId: new mongoose.Types.ObjectId(productId) });
  }
}

export const favoriteService = new FavoriteService();

