import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import { swaggerSpec } from './config/swagger';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import productRoutes from './modules/products/product.routes';
import cartRoutes from './modules/cart/cart.routes';
import orderRoutes from './modules/orders/order.routes';
import couponRoutes from './modules/coupons/coupon.routes';
import offerRoutes from './modules/offers/offer.routes';
import categoryRoutes from './modules/categories/category.routes';
import stockRoutes from './modules/stock/stock.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import pushNotificationRoutes from './modules/push-notifications/push-notification.routes';
import ratingRoutes from './modules/ratings/rating.routes';
import commentRoutes from './modules/comments/comment.routes';
import favoriteRoutes from './modules/favorites/favorite.routes';
import wishlistRoutes from './modules/wishlist/wishlist.routes';
import scraperRoutes from './modules/scraper/scraper.routes';
import searchRoutes from './modules/search/search.routes';
import userBehaviorRoutes from './modules/user-behavior/user-behavior.routes';
import recommendationRoutes from './modules/recommendations/recommendation.routes';

export const createApp = (): Express => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api', limiter);

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  /**
   * @swagger
   * /healthz:
   *   get:
   *     summary: Health check endpoint
   *     tags: [Health]
   *     security: []
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: ok
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                   example: 2024-01-01T00:00:00.000Z
   */
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Ecommerce API Documentation',
  }));

  // API routes
  app.get('/api/v1', (_req, res) => {
    res.json({ message: 'Ecommerce API v1' });
  });

  // Auth routes
  app.use('/api/v1/auth', authRoutes);

  // Product routes (mount before user routes to avoid route conflicts)
  app.use('/api/v1/products', productRoutes);

  // Cart routes
  app.use('/api/v1/cart', cartRoutes);

  // Coupon routes
  app.use('/api/v1/coupons', couponRoutes);

  // Offer routes
  app.use('/api/v1/offers', offerRoutes);

  // Category routes
  app.use('/api/v1/categories', categoryRoutes);

  // Order routes
  app.use('/api/v1/orders', orderRoutes);

  // User routes
  app.use('/api/v1', userRoutes);

  // Stock routes
  app.use('/api/v1/stock', stockRoutes);

  // Notification routes
  app.use('/api/v1/notifications', notificationRoutes);

  // Push notification routes
  app.use('/api/v1/push-notifications', pushNotificationRoutes);

  // Rating routes
  app.use('/api/v1/ratings', ratingRoutes);

  // Comment routes
  app.use('/api/v1/comments', commentRoutes);

  // Favorite routes
  app.use('/api/v1/favorites', favoriteRoutes);

  // Wishlist routes
  app.use('/api/v1/wishlists', wishlistRoutes);

  // Scraper routes
  app.use('/api/v1/scraper', scraperRoutes);

  // Search routes
  app.use('/api/v1/search', searchRoutes);

  // User behavior routes
  app.use('/api/v1/user-behavior', userBehaviorRoutes);

  // Recommendation routes
  app.use('/api/v1/recommendations', recommendationRoutes);

  // 404 handler for undefined routes (must be before error middleware)
  app.use(notFoundMiddleware);

  // Error handling middleware (must be last)
  app.use(errorMiddleware);

  return app;
};

