import mongoose from 'mongoose';
import { Rating, IRating } from './rating.model';
import { CreateRatingDto, UpdateRatingDto } from './dto/rating.dto';
import { Product } from '../products/product.model';
import { AppError } from '../../utils/error.util';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.util';

interface RatingStats {
  average: number;
  total: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export class RatingService {
  async create(userId: string, data: CreateRatingDto): Promise<IRating> {
    const product = await Product.findById(data.productId);
    if (!product) {
      throw AppError.notFound('Product not found');
    }

    // Check if user already rated this product
    const existingRating = await Rating.findOne({
      productId: data.productId,
      userId,
    });

    if (existingRating) {
      throw AppError.conflict('You have already rated this product');
    }

    // Check if user has purchased this product (for verified purchase badge)
    const hasPurchased = await this.checkVerifiedPurchase(userId, data.productId);

    const rating = await Rating.create({
      productId: new mongoose.Types.ObjectId(data.productId),
      userId: new mongoose.Types.ObjectId(userId),
      rating: data.rating,
      review: data.review,
      isVerifiedPurchase: hasPurchased,
    });

    // Update product rating stats
    await this.updateProductRatingStats(data.productId);

    return rating;
  }

  async update(ratingId: string, userId: string, data: UpdateRatingDto): Promise<IRating> {
    const rating = await Rating.findOne({
      _id: ratingId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!rating) {
      throw AppError.notFound('Rating not found');
    }

    if (data.rating !== undefined) {
      rating.rating = data.rating;
    }
    if (data.review !== undefined) {
      rating.review = data.review;
    }

    await rating.save();

    // Update product rating stats
    await this.updateProductRatingStats(rating.productId.toString());

    return rating;
  }

  async delete(ratingId: string, userId: string, userRole: string): Promise<void> {
    const rating = await Rating.findById(ratingId);
    if (!rating) {
      throw AppError.notFound('Rating not found');
    }

    // Users can only delete their own ratings, admins can delete any
    if (userRole !== 'admin' && rating.userId.toString() !== userId) {
      throw AppError.forbidden('You can only delete your own ratings');
    }

    const productId = rating.productId.toString();
    await Rating.findByIdAndDelete(ratingId);

    // Update product rating stats
    await this.updateProductRatingStats(productId);
  }

  async getProductRatings(productId: string, page?: number, limit?: number, minRating?: number) {
    const { skip, limit: queryLimit } = parsePagination({ page, limit });

    const filter: Record<string, unknown> = { productId: new mongoose.Types.ObjectId(productId) };
    if (minRating !== undefined) {
      filter.rating = { $gte: minRating };
    }

    const [ratings, totalItems] = await Promise.all([
      Rating.find(filter)
        .populate('userId', 'name email avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(queryLimit),
      Rating.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(page || 1, queryLimit, totalItems);

    return { ratings, meta };
  }

  async getProductRatingStats(productId: string): Promise<RatingStats> {
    const ratings = await Rating.find({ productId: new mongoose.Types.ObjectId(productId) });

    if (ratings.length === 0) {
      return {
        average: 0,
        total: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const total = ratings.length;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / total;

    const distribution = {
      1: ratings.filter((r) => r.rating === 1).length,
      2: ratings.filter((r) => r.rating === 2).length,
      3: ratings.filter((r) => r.rating === 3).length,
      4: ratings.filter((r) => r.rating === 4).length,
      5: ratings.filter((r) => r.rating === 5).length,
    };

    return { average: Math.round(average * 10) / 10, total, distribution };
  }

  async getUserRating(productId: string, userId: string): Promise<IRating | null> {
    return Rating.findOne({
      productId: new mongoose.Types.ObjectId(productId),
      userId: new mongoose.Types.ObjectId(userId),
    }).populate('userId', 'name email');
  }

  async markHelpful(ratingId: string): Promise<IRating> {
    const rating = await Rating.findByIdAndUpdate(
      ratingId,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );

    if (!rating) {
      throw AppError.notFound('Rating not found');
    }

    return rating;
  }

  private async checkVerifiedPurchase(userId: string, productId: string): Promise<boolean> {
    // Check if user has any completed orders containing this product
    const Order = mongoose.model('Order');
    const order = await Order.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'delivered',
      'items.productId': new mongoose.Types.ObjectId(productId),
    });

    return !!order;
  }

  private async updateProductRatingStats(productId: string): Promise<void> {
    await this.getProductRatingStats(productId);
    
    // Store stats in product model (you may want to add ratingStats field to Product model)
    // For now, we'll just ensure the stats are calculated when needed
    // In a production system, you might want to cache this in the Product model
  }
}

export const ratingService = new RatingService();

