import { Request, Response, NextFunction } from 'express';
import { searchService, SearchFilters } from './search.service';
import { success } from '../../utils/response.util';

export class SearchController {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: SearchFilters = {
        q: req.query.q as string | undefined,
        category: req.query.category as string | undefined,
        categoryId: req.query.categoryId as string | undefined,
        minPrice: req.query.minPrice ? parseFloat(String(req.query.minPrice)) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(String(req.query.maxPrice)) : undefined,
        minRating: req.query.minRating ? parseFloat(String(req.query.minRating)) : undefined,
        inStock: req.query.inStock === 'true' ? true : req.query.inStock === 'false' ? false : undefined,
        tags: req.query.tags ? String(req.query.tags).split(',') : undefined,
        sellerId: req.query.sellerId as string | undefined,
        sort: req.query.sort as string | undefined,
        page: req.query.page ? parseInt(String(req.query.page), 10) : undefined,
        limit: req.query.limit ? parseInt(String(req.query.limit), 10) : undefined,
      };

      const { products, meta } = await searchService.search(filters);

      success(
        res,
        products.map((product: any) => ({
          id: product._id.toString(),
          title: product.title,
          slug: product.slug,
          description: product.description,
          price: product.price,
          currency: product.currency,
          images: product.images,
          stock: product.stock,
          category: product.category,
          categoryId: product.categoryId?.toString(),
          tags: product.tags,
          seller: product.sellerId
            ? {
                id: product.sellerId._id.toString(),
                name: product.sellerId.name,
              }
            : null,
          createdAt: product.createdAt,
        })),
        200,
        meta as unknown as Record<string, unknown>
      );
    } catch (err) {
      next(err);
    }
  }

  async autocomplete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query.q as string;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;

      const suggestions = await searchService.autocomplete(query, limit);
      success(res, { suggestions });
    } catch (err) {
      next(err);
    }
  }

  async getSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query.q as string;
      const suggestions = await searchService.getSearchSuggestions(query);

      success(res, suggestions);
    } catch (err) {
      next(err);
    }
  }

  async getPopularSearches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
      const searches = await searchService.getPopularSearches(limit);
      success(res, { searches });
    } catch (err) {
      next(err);
    }
  }
}

export const searchController = new SearchController();

