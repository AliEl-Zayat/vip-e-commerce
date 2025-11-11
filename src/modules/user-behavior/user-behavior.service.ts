import mongoose from 'mongoose';
import { UserBehavior, IUserBehavior, BehaviorEventType } from './user-behavior.model';
import { TrackBehaviorDto } from './dto/user-behavior.dto';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.util';

export interface UserBehaviorStats {
  totalEvents: number;
  productViews: number;
  searches: number;
  cartAdditions: number;
  purchases: number;
  mostViewedCategories: Array<{ category: string; count: number }>;
  mostSearchedTerms: Array<{ term: string; count: number }>;
  preferredPriceRange: { min: number; max: number } | null;
  preferredTags: Array<{ tag: string; count: number }>;
}

export class UserBehaviorService {
  async track(userId: string, data: TrackBehaviorDto): Promise<IUserBehavior> {
    const behavior = await UserBehavior.create({
      userId: new mongoose.Types.ObjectId(userId),
      eventType: data.eventType,
      productId: data.productId ? new mongoose.Types.ObjectId(data.productId) : undefined,
      categoryId: data.categoryId ? new mongoose.Types.ObjectId(data.categoryId) : undefined,
      eventData: data.eventData || {},
    });

    return behavior;
  }

  async getUserBehavior(
    userId: string,
    eventType?: BehaviorEventType,
    page?: number,
    limit?: number
  ) {
    const { skip, limit: queryLimit } = parsePagination({ page, limit });

    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (eventType) {
      filter.eventType = eventType;
    }

    const [behaviors, totalItems] = await Promise.all([
      UserBehavior.find(filter)
        .populate('productId', 'title slug price images category')
        .populate('categoryId', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(queryLimit),
      UserBehavior.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(page || 1, queryLimit, totalItems);

    return { behaviors, meta };
  }

  async getUserStats(userId: string): Promise<UserBehaviorStats> {
    const userIdObj = new mongoose.Types.ObjectId(userId);

    const [
      totalEvents,
      productViews,
      searches,
      cartAdditions,
      purchases,
      categoryViews,
      searchQueries,
      priceData,
      tagData,
    ] = await Promise.all([
      UserBehavior.countDocuments({ userId: userIdObj }),
      UserBehavior.countDocuments({ userId: userIdObj, eventType: 'product_view' }),
      UserBehavior.countDocuments({ userId: userIdObj, eventType: 'search_query' }),
      UserBehavior.countDocuments({ userId: userIdObj, eventType: 'add_to_cart' }),
      UserBehavior.countDocuments({ userId: userIdObj, eventType: 'purchase' }),
      UserBehavior.aggregate([
        { $match: { userId: userIdObj, eventType: 'category_view' } },
        { $group: { _id: '$eventData.category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { category: '$_id', count: 1, _id: 0 } },
      ]),
      UserBehavior.aggregate([
        { $match: { userId: userIdObj, eventType: 'search_query', 'eventData.query': { $exists: true } } },
        { $group: { _id: '$eventData.query', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { term: '$_id', count: 1, _id: 0 } },
      ]),
      UserBehavior.aggregate([
        {
          $match: {
            userId: userIdObj,
            eventType: { $in: ['product_view', 'purchase'] },
            'eventData.price': { $exists: true, $type: 'number' },
          },
        },
        {
          $group: {
            _id: null,
            minPrice: { $min: '$eventData.price' },
            maxPrice: { $max: '$eventData.price' },
          },
        },
      ]),
      UserBehavior.aggregate([
        {
          $match: {
            userId: userIdObj,
            eventType: { $in: ['product_view', 'purchase'] },
            'eventData.tags': { $exists: true, $type: 'array' },
          },
        },
        { $unwind: '$eventData.tags' },
        { $group: { _id: '$eventData.tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { tag: '$_id', count: 1, _id: 0 } },
      ]),
    ]);

    const preferredPriceRange =
      priceData.length > 0 && priceData[0].min !== null && priceData[0].max !== null
        ? { min: priceData[0].min, max: priceData[0].max }
        : null;

    return {
      totalEvents,
      productViews,
      searches,
      cartAdditions,
      purchases,
      mostViewedCategories: categoryViews,
      mostSearchedTerms: searchQueries,
      preferredPriceRange,
      preferredTags: tagData,
    };
  }

  async getProductViews(productId: string, limit = 100): Promise<number> {
    return UserBehavior.countDocuments({
      productId: new mongoose.Types.ObjectId(productId),
      eventType: 'product_view',
    });
  }

  async getUsersWhoViewedProduct(productId: string, limit = 100): Promise<string[]> {
    const behaviors = await UserBehavior.find({
      productId: new mongoose.Types.ObjectId(productId),
      eventType: 'product_view',
    })
      .select('userId')
      .limit(limit)
      .distinct('userId');

    return behaviors.map((id) => id.toString());
  }

  async getSimilarUsers(userId: string, limit = 50): Promise<string[]> {
    // Get products viewed/purchased by this user
    const userProducts = await UserBehavior.distinct('productId', {
      userId: new mongoose.Types.ObjectId(userId),
      eventType: { $in: ['product_view', 'purchase'] },
      productId: { $exists: true },
    });

    if (userProducts.length === 0) {
      return [];
    }

    // Find users who viewed/purchased the same products
    const similarUsers = await UserBehavior.aggregate([
      {
        $match: {
          userId: { $ne: new mongoose.Types.ObjectId(userId) },
          productId: { $in: userProducts },
          eventType: { $in: ['product_view', 'purchase'] },
        },
      },
      {
        $group: {
          _id: '$userId',
          commonProducts: { $addToSet: '$productId' },
          interactionCount: { $sum: 1 },
        },
      },
      {
        $project: {
          userId: '$_id',
          similarityScore: {
            $divide: [
              { $size: '$commonProducts' },
              { $add: [userProducts.length, { $size: '$commonProducts' }] },
            ],
          },
        },
      },
      { $sort: { similarityScore: -1 } },
      { $limit: limit },
    ]);

    return similarUsers.map((u) => u.userId.toString());
  }

  async getUserProductInteractions(userId: string): Promise<Map<string, number>> {
    const interactions = await UserBehavior.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          productId: { $exists: true },
          eventType: { $in: ['product_view', 'purchase', 'add_to_cart', 'favorite_add', 'wishlist_add'] },
        },
      },
      {
        $group: {
          _id: '$productId',
          score: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ['$eventType', 'purchase'] }, then: 5 },
                  { case: { $eq: ['$eventType', 'add_to_cart'] }, then: 3 },
                  { case: { $eq: ['$eventType', 'favorite_add'] }, then: 2 },
                  { case: { $eq: ['$eventType', 'wishlist_add'] }, then: 2 },
                  { case: { $eq: ['$eventType', 'product_view'] }, then: 1 },
                ],
                default: 0,
              },
            },
          },
        },
      },
    ]);

    const interactionMap = new Map<string, number>();
    interactions.forEach((interaction) => {
      interactionMap.set(interaction._id.toString(), interaction.score);
    });

    return interactionMap;
  }
}

export const userBehaviorService = new UserBehaviorService();

