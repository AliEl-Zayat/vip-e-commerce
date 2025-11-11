import mongoose from 'mongoose';
import { Product } from '../products/product.model';
import { Rating } from '../ratings/rating.model';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.util';

export interface SearchFilters {
  q?: string;
  category?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  tags?: string[];
  sellerId?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export class SearchService {
  async search(filters: SearchFilters) {
    const { page, limit, skip } = parsePagination(filters);

    // Build MongoDB query
    const query: Record<string, unknown> = {};

    // Text search
    if (filters.q && filters.q.trim()) {
      query.$text = { $search: filters.q.trim() };
    }

    // Category filter
    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.categoryId) {
      query.categoryId = new mongoose.Types.ObjectId(filters.categoryId);
    }

    // Price range
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {} as Record<string, number>;
      if (filters.minPrice !== undefined) {
        (query.price as Record<string, number>).$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        (query.price as Record<string, number>).$lte = filters.maxPrice;
      }
    }

    // Stock filter
    if (filters.inStock !== undefined) {
      if (filters.inStock) {
        query.stock = { $gt: 0 };
      } else {
        query.stock = { $lte: 0 };
      }
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    // Seller filter
    if (filters.sellerId) {
      query.sellerId = new mongoose.Types.ObjectId(filters.sellerId);
    }

    // Build sort
    let sort: Record<string, 1 | -1 | { $meta: string }> = { createdAt: -1 };
    if (filters.sort) {
      const [field, order] = filters.sort.split(':');
      sort = { [field]: order === 'asc' ? 1 : -1 };
    } else if (filters.q) {
      // If text search, sort by relevance
      sort = { score: { $meta: 'textScore' } as any };
    }

    // Execute query
    let queryBuilder = Product.find(query);

    // Add text score if searching
    if (filters.q) {
      queryBuilder = queryBuilder.select({ score: { $meta: 'textScore' } });
    }

    const [products, totalItems] = await Promise.all([
      queryBuilder
        .populate('sellerId', 'name email')
        .populate('categoryId', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    // Enhance products with rating data if minRating filter is applied
    let enhancedProducts = products;
    if (filters.minRating !== undefined) {
      const productIds = products.map((p) => p._id);
      const ratings = await Rating.aggregate([
        { $match: { productId: { $in: productIds } } },
        {
          $group: {
            _id: '$productId',
            averageRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 },
          },
        },
      ]);

      const ratingMap = new Map(ratings.map((r) => [r._id.toString(), r.averageRating]));

      enhancedProducts = products.filter((p) => {
        const avgRating = ratingMap.get(p._id.toString()) || 0;
        return avgRating >= filters.minRating!;
      });
    }

    const meta = buildPaginationMeta(page, limit, totalItems);

    return { products: enhancedProducts, meta };
  }

  async autocomplete(query: string, limit = 10): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim();
    const products = await Product.find(
      {
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } },
        ],
      },
      { title: 1, slug: 1 }
    )
      .limit(limit)
      .sort({ createdAt: -1 });

    // Extract unique suggestions
    const suggestions = new Set<string>();
    products.forEach((product) => {
      // Add title words that match
      const words = product.title.toLowerCase().split(/\s+/);
      words.forEach((word) => {
        if (word.startsWith(searchTerm.toLowerCase()) && word.length > searchTerm.length) {
          suggestions.add(word);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }

  async getSearchSuggestions(query: string): Promise<{ products: any[]; categories: any[] }> {
    if (!query || query.trim().length < 2) {
      return { products: [], categories: [] };
    }

    const searchTerm = query.trim();
    const Category = mongoose.model('Category');

    const [products, categories] = await Promise.all([
      Product.find(
        {
          $or: [
            { title: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
          ],
        },
        { title: 1, slug: 1, images: 1, price: 1 }
      )
        .limit(5)
        .sort({ createdAt: -1 }),
      Category.find(
        {
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
          ],
        },
        { name: 1, slug: 1 }
      ).limit(5),
    ]);

    return {
      products: products.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        slug: p.slug,
        image: p.images[0]?.url,
        price: p.price,
      })),
      categories: categories.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
      })),
    };
  }

  async getPopularSearches(limit = 10): Promise<string[]> {
    // In a real implementation, you would track search queries
    // For now, return popular product titles
    const products = await Product.find({}, { title: 1 })
      .sort({ createdAt: -1 })
      .limit(limit);

    return products.map((p) => p.title).slice(0, limit);
  }
}

export const searchService = new SearchService();

