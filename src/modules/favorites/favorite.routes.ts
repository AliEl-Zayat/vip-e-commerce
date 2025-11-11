import { Router } from 'express';
import { favoriteController } from './favorite.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { createFavoriteSchema } from './dto/favorite.dto';

const router: Router = Router();

/**
 * @swagger
 * /api/v1/favorites:
 *   post:
 *     summary: Add product to favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product added to favorites
 */
router.post(
  '/',
  authMiddleware,
  validate(createFavoriteSchema),
  favoriteController.add.bind(favoriteController)
);

/**
 * @swagger
 * /api/v1/favorites:
 *   get:
 *     summary: Get user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Favorites retrieved successfully
 */
router.get('/', authMiddleware, favoriteController.getUserFavorites.bind(favoriteController));

/**
 * @swagger
 * /api/v1/favorites/products/{productId}:
 *   delete:
 *     summary: Remove product from favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product removed from favorites
 */
router.delete(
  '/products/:productId',
  authMiddleware,
  favoriteController.remove.bind(favoriteController)
);

/**
 * @swagger
 * /api/v1/favorites/products/{productId}/check:
 *   get:
 *     summary: Check if product is in favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Favorite status retrieved
 */
router.get(
  '/products/:productId/check',
  authMiddleware,
  favoriteController.checkFavorite.bind(favoriteController)
);

export default router;
