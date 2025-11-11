import { Router } from 'express';
import { recommendationController } from './recommendation.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router: Router = Router();

/**
 * @swagger
 * /api/v1/recommendations/personalized:
 *   get:
 *     summary: Get personalized product recommendations
 *     tags: [Recommendations]
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
 *         description: Personalized recommendations retrieved successfully
 */
router.get('/personalized', authMiddleware, recommendationController.getPersonalized);

/**
 * @swagger
 * /api/v1/recommendations/similar/{productId}:
 *   get:
 *     summary: Get products similar to a given product
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Similar products retrieved successfully
 */
router.get('/similar/:productId', recommendationController.getSimilar);

/**
 * @swagger
 * /api/v1/recommendations/trending:
 *   get:
 *     summary: Get trending products
 *     tags: [Recommendations]
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
 *         description: Trending products retrieved successfully
 */
router.get('/trending', recommendationController.getTrending);

/**
 * @swagger
 * /api/v1/recommendations/for-you:
 *   get:
 *     summary: Get "For You" personalized recommendations
 *     tags: [Recommendations]
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
 *         description: "For You" recommendations retrieved successfully
 */
router.get('/for-you', authMiddleware, recommendationController.getForYou);

export default router;

