import mongoose from 'mongoose';
import { Wishlist, IWishlist } from './wishlist.model';
import {
  CreateWishlistDto,
  UpdateWishlistDto,
  AddItemToWishlistDto,
  UpdateWishlistItemDto,
} from './dto/wishlist.dto';
import { Product } from '../products/product.model';
import { userBehaviorService } from '../user-behavior/user-behavior.service';
import { AppError } from '../../utils/error.util';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.util';
// import { notificationService } from '../notifications/notification.service'; // For future price drop notifications

export class WishlistService {
  async create(userId: string, data: CreateWishlistDto): Promise<IWishlist> {
    const wishlist = await Wishlist.create({
      userId: new mongoose.Types.ObjectId(userId),
      name: data.name,
      description: data.description,
      isPublic: data.isPublic || false,
      items: [],
    });

    return wishlist;
  }

  async update(wishlistId: string, userId: string, data: UpdateWishlistDto): Promise<IWishlist> {
    const wishlist = await Wishlist.findOne({
      _id: wishlistId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!wishlist) {
      throw AppError.notFound('Wishlist not found');
    }

    if (data.name !== undefined) {
      wishlist.name = data.name;
    }
    if (data.description !== undefined) {
      wishlist.description = data.description;
    }
    if (data.isPublic !== undefined) {
      wishlist.isPublic = data.isPublic;
    }

    await wishlist.save();
    return wishlist;
  }

  async delete(wishlistId: string, userId: string): Promise<void> {
    const result = await Wishlist.deleteOne({
      _id: wishlistId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw AppError.notFound('Wishlist not found');
    }
  }

  async getUserWishlists(userId: string, page?: number, limit?: number) {
    const { skip, limit: queryLimit } = parsePagination({ page, limit });

    const [wishlists, totalItems] = await Promise.all([
      Wishlist.find({ userId: new mongoose.Types.ObjectId(userId) })
        .populate('items.productId', 'title slug price images stock')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(queryLimit),
      Wishlist.countDocuments({ userId: new mongoose.Types.ObjectId(userId) }),
    ]);

    const meta = buildPaginationMeta(page || 1, queryLimit, totalItems);

    return { wishlists, meta };
  }

  async getPublicWishlists(page?: number, limit?: number) {
    const { skip, limit: queryLimit } = parsePagination({ page, limit });

    const [wishlists, totalItems] = await Promise.all([
      Wishlist.find({ isPublic: true })
        .populate('userId', 'name')
        .populate('items.productId', 'title slug price images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(queryLimit),
      Wishlist.countDocuments({ isPublic: true }),
    ]);

    const meta = buildPaginationMeta(page || 1, queryLimit, totalItems);

    return { wishlists, meta };
  }

  async getWishlistById(wishlistId: string, userId?: string): Promise<IWishlist> {
    const wishlist = await Wishlist.findById(wishlistId)
      .populate('items.productId')
      .populate('userId', 'name email');

    if (!wishlist) {
      throw AppError.notFound('Wishlist not found');
    }

    // Check if user has access (owner or public)
    if (!wishlist.isPublic && (!userId || wishlist.userId.toString() !== userId)) {
      throw AppError.forbidden('You do not have access to this wishlist');
    }

    return wishlist;
  }

  async addItem(
    wishlistId: string,
    userId: string,
    data: AddItemToWishlistDto
  ): Promise<IWishlist> {
    const wishlist = await Wishlist.findOne({
      _id: wishlistId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!wishlist) {
      throw AppError.notFound('Wishlist not found');
    }

    const product = await Product.findById(data.productId);
    if (!product) {
      throw AppError.notFound('Product not found');
    }

    // Check if product already in wishlist
    const existingItem = wishlist.items.find(item => item.productId.toString() === data.productId);
    if (existingItem) {
      throw AppError.conflict('Product already in wishlist');
    }

    wishlist.items.push({
      productId: new mongoose.Types.ObjectId(data.productId),
      addedAt: new Date(),
      notes: data.notes,
    });

    await wishlist.save();

    // Track wishlist add event (async, don't block)
    userBehaviorService
      .track(userId, {
        eventType: 'wishlist_add',
        productId: data.productId,
        eventData: {
          price: product.price,
          category: product.category,
          tags: product.tags,
          wishlistId: wishlist._id.toString(),
        },
      })
      .catch(err => {
        console.error('[WishlistService] Error tracking wishlist add:', err);
      });

    return wishlist.populate('items.productId');
  }

  async removeItem(wishlistId: string, userId: string, productId: string): Promise<IWishlist> {
    const wishlist = await Wishlist.findOne({
      _id: wishlistId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!wishlist) {
      throw AppError.notFound('Wishlist not found');
    }

    wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId);

    await wishlist.save();
    return wishlist.populate('items.productId');
  }

  async updateItem(
    wishlistId: string,
    userId: string,
    productId: string,
    data: UpdateWishlistItemDto
  ): Promise<IWishlist> {
    const wishlist = await Wishlist.findOne({
      _id: wishlistId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!wishlist) {
      throw AppError.notFound('Wishlist not found');
    }

    const item = wishlist.items.find(item => item.productId.toString() === productId);
    if (!item) {
      throw AppError.notFound('Item not found in wishlist');
    }

    if (data.notes !== undefined) {
      item.notes = data.notes;
    }

    await wishlist.save();
    return wishlist.populate('items.productId');
  }

  async checkPriceDrops(userId: string): Promise<void> {
    const wishlists = await Wishlist.find({ userId: new mongoose.Types.ObjectId(userId) });

    for (const wishlist of wishlists) {
      for (const item of wishlist.items) {
        const product = await Product.findById(item.productId);
        if (!product) continue;

        // Check if price has dropped (you would need to store previous price)
        // For now, this is a placeholder - you'd need to track price history
        // This would typically be done via the scraper system
      }
    }
  }
}

export const wishlistService = new WishlistService();
