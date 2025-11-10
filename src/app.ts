import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { errorMiddleware } from './middlewares/error.middleware';
import { swaggerSpec } from './config/swagger';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import productRoutes from './modules/products/product.routes';
import cartRoutes from './modules/cart/cart.routes';
import orderRoutes from './modules/orders/order.routes';
import couponRoutes from './modules/coupons/coupon.routes';
import offerRoutes from './modules/offers/offer.routes';
import categoryRoutes from './modules/categories/category.routes';

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

  // Error handling middleware (must be last)
  app.use(errorMiddleware);

  return app;
};

