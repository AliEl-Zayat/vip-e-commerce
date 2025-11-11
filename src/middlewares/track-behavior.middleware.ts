import { Request, Response, NextFunction } from 'express';
import { userBehaviorService } from '../modules/user-behavior/user-behavior.service';
import { isAuthenticated } from '../utils/type-guards.util';

/**
 * Middleware to automatically track product views
 */
export const trackProductView = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Track asynchronously without blocking the request
  if (isAuthenticated(req) && (req.params.id || req.params.productId)) {
    const productId = req.params.id || req.params.productId;

    // Track product view in background
    userBehaviorService
      .track(req.user._id.toString(), {
        eventType: 'product_view',
        productId,
        eventData: {
          duration: 0, // Can be updated by frontend if needed
        },
      })
      .catch((err) => {
        // Log error but don't fail the request
        console.error('[TrackBehavior] Error tracking product view:', err);
      });
  }

  next();
};

/**
 * Middleware to track search queries
 */
export const trackSearchQuery = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (isAuthenticated(req) && req.query.q) {
    const query = String(req.query.q);

    // Track search query in background
    userBehaviorService
      .track(req.user._id.toString(), {
        eventType: 'search_query',
        eventData: {
          query,
          filters: {
            category: req.query.category,
            minPrice: req.query.minPrice,
            maxPrice: req.query.maxPrice,
            tags: req.query.tags,
          },
        },
      })
      .catch((err) => {
        console.error('[TrackBehavior] Error tracking search query:', err);
      });
  }

  next();
};

