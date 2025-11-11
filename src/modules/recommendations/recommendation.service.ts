import mongoose from 'mongoose';
import { Product, IProduct } from '../products/product.model';
import { RecommendationCache, IRecommendationCache, RecommendationType } from './recommendation.model';
import { UserBehavior } from '../user-behavior/user-behavior.model';
import { userBehaviorService } from '../user-behavior/user-behavior.service';
import { Order } from '../orders/order.model';
import { Favorite } from '../favorites/favorite.model';
import { Wishlist } from '../wishlist/wishlist.model';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.util';
import { AppError } from '../../utils/error.util';

export interface RecommendationResult {
  products: IProduct[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export class RecommendationService {
  private readonly CACHE_TTL_HOURS = 1;
  private readonly DEFAULT_LIMIT = 20;
  private readonly COLLABORATIVE_WEIGHT = 0.4;
  private readonly CONTENT_BASED_WEIGHT = 0.6;

  /**
   * Get personalized recommendations for a user
   * Uses hybrid approach: collaborative + content-based filtering
   */
  async getPersonalizedRecommendations(
    userId: string,
    page?: number,
    limit?: number
  ): Promise<RecommendationResult> {
    const { limit: queryLimit } = parsePagination({ page, limit });
    const cacheKey = `personalized:${userId}`;

    // Check cache
    const cached = await this.getCachedRecommendations(userId, 'personalized');
    if (cached && cached.productIds.length > 0) {
      const products = await Product.find({ _id: { $in: cached.productIds } })
        .populate('sellerId', 'name email')
        .populate('categoryId', 'name slug')
        .limit(queryLimit);

      return {
        products,
        meta: buildPaginationMeta(page || 1, queryLimit, cached.productIds.length),
      };
    }

    // Generate recommendations
    const recommendations = await this.generatePersonalizedRecommendations(userId);

    // Cache results
    await this.cacheRecommendations(userId, 'personalized', recommendations);

    // Return paginated results
    const paginatedProducts = recommendations.slice(0, queryLimit);
    const products = await Product.find({ _id: { $in: paginatedProducts.map((r) => r.productId) } })
      .populate('sellerId', 'name email')
      .populate('categoryId', 'name slug');

    return {
      products,
      meta: buildPaginationMeta(page || 1, queryLimit, recommendations.length),
    };
  }

  /**
   * Get products similar to a given product (content-based)
   */
  async getSimilarProducts(
    productId: string,
    page?: number,
    limit?: number
  ): Promise<RecommendationResult> {
    const { limit: queryLimit } = parsePagination({ page, limit });

    // Check cache
    const cached = await this.getCachedRecommendations(undefined, 'similar', productId);
    if (cached && cached.productIds.length > 0) {
      const products = await Product.find({ _id: { $in: cached.productIds } })
        .populate('sellerId', 'name email')
        .populate('categoryId', 'name slug')
        .limit(queryLimit);

      return {
        products,
        meta: buildPaginationMeta(page || 1, queryLimit, cached.productIds.length),
      };
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      throw AppError.notFound('Product not found');
    }

    // Find similar products
    const similarProducts = await this.findSimilarProducts(product);

    // Cache results
    await this.cacheRecommendations(undefined, 'similar', similarProducts, productId);

    // Return paginated results
    const paginatedProducts = similarProducts.slice(0, queryLimit);
    const products = await Product.find({ _id: { $in: paginatedProducts.map((r) => r.productId) } })
      .populate('sellerId', 'name email')
      .populate('categoryId', 'name slug');

    return {
      products,
      meta: buildPaginationMeta(page || 1, queryLimit, similarProducts.length),
    };
  }

  /**
   * Get trending products (most viewed/purchased recently)
   */
  async getTrendingProducts(page?: number, limit?: number): Promise<RecommendationResult> {
    const { limit: queryLimit } = parsePagination({ page, limit });

    // Check cache
    const cached = await this.getCachedRecommendations(undefined, 'trending');
    if (cached && cached.productIds.length > 0) {
      const products = await Product.find({ _id: { $in: cached.productIds } })
        .populate('sellerId', 'name email')
        .populate('categoryId', 'name slug')
        .limit(queryLimit);

      return {
        products,
        meta: buildPaginationMeta(page || 1, queryLimit, cached.productIds.length),
      };
    }

    // Get trending products
    const trendingProducts = await this.findTrendingProducts();

    // Cache results
    await this.cacheRecommendations(undefined, 'trending', trendingProducts);

    // Return paginated results
    const paginatedProducts = trendingProducts.slice(0, queryLimit);
    const products = await Product.find({ _id: { $in: paginatedProducts.map((r) => r.productId) } })
      .populate('sellerId', 'name email')
      .populate('categoryId', 'name slug');

    return {
      products,
      meta: buildPaginationMeta(page || 1, queryLimit, trendingProducts.length),
    };
  }

  /**
   * Get "For You" recommendations (similar to personalized but more curated)
   */
  async getRecommendedForYou(userId: string, page?: number, limit?: number): Promise<RecommendationResult> {
    // Similar to personalized but with additional filtering
    const personalized = await this.getPersonalizedRecommendations(userId, page, limit);

    // Filter out products user already purchased
    const purchasedProductIds = await this.getUserPurchasedProducts(userId);
    const filteredProducts = personalized.products.filter(
      (p) => !purchasedProductIds.includes(p._id.toString())
    );

    return {
      products: filteredProducts,
      meta: personalized.meta,
    };
  }

  /**
   * Generate personalized recommendations using hybrid approach
   */
  private async generatePersonalizedRecommendations(
    userId: string
  ): Promise<Array<{ productId: mongoose.Types.ObjectId; score: number }>> {
    const [collaborativeRecs, contentBasedRecs] = await Promise.all([
      this.getCollaborativeRecommendations(userId),
      this.getContentBasedRecommendations(userId),
    ]);

    // Combine recommendations with weighted scores
    const combinedMap = new Map<string, number>();

    // Add collaborative recommendations (40% weight)
    collaborativeRecs.forEach((rec) => {
      const key = rec.productId.toString();
      const existingScore = combinedMap.get(key) || 0;
      combinedMap.set(key, existingScore + rec.score * this.COLLABORATIVE_WEIGHT);
    });

    // Add content-based recommendations (60% weight)
    contentBasedRecs.forEach((rec) => {
      const key = rec.productId.toString();
      const existingScore = combinedMap.get(key) || 0;
      combinedMap.set(key, existingScore + rec.score * this.CONTENT_BASED_WEIGHT);
    });

    // Convert to array and sort by score
    const recommendations = Array.from(combinedMap.entries())
      .map(([productId, score]) => ({
        productId: new mongoose.Types.ObjectId(productId),
        score,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 100); // Top 100 recommendations

    return recommendations;
  }

  /**
   * Collaborative filtering: Find products liked by similar users
   */
  private async getCollaborativeRecommendations(
    userId: string
  ): Promise<Array<{ productId: mongoose.Types.ObjectId; score: number }>> {
    // Get similar users
    const similarUserIds = await userBehaviorService.getSimilarUsers(userId, 50);

    if (similarUserIds.length === 0) {
      return [];
    }

    // Get products interacted by similar users
    const similarUserProducts = await UserBehavior.aggregate([
      {
        $match: {
          userId: { $in: similarUserIds.map((id) => new mongoose.Types.ObjectId(id)) },
          productId: { $exists: true },
          eventType: { $in: ['product_view', 'purchase', 'add_to_cart', 'favorite_add'] },
        },
      },
      {
        $group: {
          _id: '$productId',
          interactionCount: { $sum: 1 },
          userCount: { $addToSet: '$userId' },
        },
      },
      {
        $project: {
          productId: '$_id',
          score: {
            $multiply: [
              { $size: '$userCount' },
              { $divide: ['$interactionCount', { $size: '$userCount' }] },
            ],
          },
        },
      },
      { $sort: { score: -1 } },
      { $limit: 50 },
    ]);

    // Exclude products user already interacted with
    const userInteractions = await userBehaviorService.getUserProductInteractions(userId);
    const filteredProducts = similarUserProducts.filter(
      (p) => !userInteractions.has(p.productId.toString())
    );

    return filteredProducts.map((p) => ({
      productId: p.productId,
      score: p.score,
    }));
  }

  /**
   * Content-based filtering: Find products similar to user's preferences
   */
  private async getContentBasedRecommendations(
    userId: string
  ): Promise<Array<{ productId: mongoose.Types.ObjectId; score: number }>> {
    // Get user's preferred categories, tags, and price range
    const stats = await userBehaviorService.getUserStats(userId);
    const userInteractions = await userBehaviorService.getUserProductInteractions(userId);

    // Get products user has interacted with
    const userProductIds = Array.from(userInteractions.keys());
    if (userProductIds.length === 0) {
      return [];
    }

    const userProducts = await Product.find({
      _id: { $in: userProductIds.map((id) => new mongoose.Types.ObjectId(id)) },
    });

    if (userProducts.length === 0) {
      return [];
    }

    // Extract user preferences
    const preferredCategories = new Set<string>();
    const preferredTags = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = 0;

    userProducts.forEach((product) => {
      if (product.category) preferredCategories.add(product.category);
      product.tags.forEach((tag) => preferredTags.add(tag));
      if (product.price < minPrice) minPrice = product.price;
      if (product.price > maxPrice) maxPrice = product.price;
    });

    // Find similar products
    const query: Record<string, unknown> = {
      _id: { $nin: userProductIds.map((id) => new mongoose.Types.ObjectId(id)) },
      stock: { $gt: 0 }, // Only in-stock products
    };

    if (preferredCategories.size > 0) {
      query.category = { $in: Array.from(preferredCategories) };
    }

    if (preferredTags.size > 0) {
      query.tags = { $in: Array.from(preferredTags) };
    }

    if (minPrice !== Infinity && maxPrice > 0) {
      const priceRange = maxPrice - minPrice;
      query.price = {
        $gte: Math.max(0, minPrice - priceRange * 0.5),
        $lte: maxPrice + priceRange * 0.5,
      };
    }

    const similarProducts = await Product.find(query)
      .select('_id category tags price')
      .limit(100);

    // Score products based on similarity
    const scoredProducts = similarProducts.map((product) => {
      let score = 0;

      // Category match
      if (product.category && preferredCategories.has(product.category)) {
        score += 3;
      }

      // Tag matches
      const matchingTags = product.tags.filter((tag) => preferredTags.has(tag)).length;
      score += matchingTags * 2;

      // Price similarity
      if (minPrice !== Infinity && maxPrice > 0) {
        const priceDiff = Math.abs(product.price - (minPrice + maxPrice) / 2);
        const priceRange = maxPrice - minPrice;
        if (priceRange > 0) {
          score += Math.max(0, 3 - (priceDiff / priceRange) * 3);
        }
      }

      return {
        productId: product._id,
        score,
      };
    });

    return scoredProducts.sort((a, b) => b.score - a.score).slice(0, 50);
  }

  /**
   * Find products similar to a given product
   */
  private async findSimilarProducts(
    product: IProduct
  ): Promise<Array<{ productId: mongoose.Types.ObjectId; score: number }>> {
    const query: Record<string, unknown> = {
      _id: { $ne: product._id },
      stock: { $gt: 0 },
    };

    // Build query based on product attributes
    const conditions: Record<string, unknown>[] = [];

    if (product.category) {
      conditions.push({ category: product.category });
    }

    if (product.categoryId) {
      conditions.push({ categoryId: product.categoryId });
    }

    if (product.tags && product.tags.length > 0) {
      conditions.push({ tags: { $in: product.tags } });
    }

    if (conditions.length > 0) {
      query.$or = conditions;
    }

    // Price range (within 30% of product price)
    const priceRange = product.price * 0.3;
    query.price = {
      $gte: product.price - priceRange,
      $lte: product.price + priceRange,
    };

    const similarProducts = await Product.find(query)
      .select('_id category categoryId tags price')
      .limit(100);

    // Score products based on similarity
    const scoredProducts = similarProducts.map((p) => {
      let score = 0;

      // Category match
      if (p.category === product.category || p.categoryId?.toString() === product.categoryId?.toString()) {
        score += 5;
      }

      // Tag matches
      const matchingTags = p.tags.filter((tag) => product.tags.includes(tag)).length;
      score += matchingTags * 3;

      // Price similarity
      const priceDiff = Math.abs(p.price - product.price);
      const priceSimilarity = Math.max(0, 5 - (priceDiff / product.price) * 5);
      score += priceSimilarity;

      return {
        productId: p._id,
        score,
      };
    });

    return scoredProducts.sort((a, b) => b.score - a.score).slice(0, 20);
  }

  /**
   * Find trending products (most viewed/purchased in last 7 days)
   */
  private async findTrendingProducts(): Promise<Array<{ productId: mongoose.Types.ObjectId; score: number }>> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trending = await UserBehavior.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          productId: { $exists: true },
          eventType: { $in: ['product_view', 'purchase', 'add_to_cart'] },
        },
      },
      {
        $group: {
          _id: '$productId',
          viewCount: {
            $sum: { $cond: [{ $eq: ['$eventType', 'product_view'] }, 1, 0] },
          },
          purchaseCount: {
            $sum: { $cond: [{ $eq: ['$eventType', 'purchase'] }, 1, 0] },
          },
          cartCount: {
            $sum: { $cond: [{ $eq: ['$eventType', 'add_to_cart'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          productId: '$_id',
          score: {
            $add: [
              { $multiply: ['$viewCount', 1] },
              { $multiply: ['$purchaseCount', 5] },
              { $multiply: ['$cartCount', 3] },
            ],
          },
        },
      },
      { $sort: { score: -1 } },
      { $limit: 50 },
    ]);

    return trending.map((t) => ({
      productId: t.productId,
      score: t.score,
    }));
  }

  /**
   * Get products user has purchased
   */
  private async getUserPurchasedProducts(userId: string): Promise<string[]> {
    const orders = await Order.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] },
    }).select('items.productId');

    const productIds = new Set<string>();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        productIds.add(item.productId.toString());
      });
    });

    return Array.from(productIds);
  }

  /**
   * Cache recommendations
   */
  private async cacheRecommendations(
    userId: string | undefined,
    type: RecommendationType,
    recommendations: Array<{ productId: mongoose.Types.ObjectId; score: number }>,
    productId?: string
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.CACHE_TTL_HOURS);

    const scoresMap = new Map<string, number>();
    recommendations.forEach((rec) => {
      scoresMap.set(rec.productId.toString(), rec.score);
    });

    await RecommendationCache.create({
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      productId: productId ? new mongoose.Types.ObjectId(productId) : undefined,
      recommendationType: type,
      productIds: recommendations.map((r) => r.productId),
      scores: scoresMap,
      expiresAt,
    });
  }

  /**
   * Get cached recommendations
   */
  private async getCachedRecommendations(
    userId: string | undefined,
    type: RecommendationType,
    productId?: string
  ): Promise<IRecommendationCache | null> {
    const query: Record<string, unknown> = {
      recommendationType: type,
      expiresAt: { $gt: new Date() },
    };

    if (userId) {
      query.userId = new mongoose.Types.ObjectId(userId);
    }

    if (productId) {
      query.productId = new mongoose.Types.ObjectId(productId);
    }

    return RecommendationCache.findOne(query).sort({ createdAt: -1 });
  }
}

export const recommendationService = new RecommendationService();

