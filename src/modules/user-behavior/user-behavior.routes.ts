import { Router } from 'express';
import { userBehaviorController } from './user-behavior.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { trackBehaviorSchema } from './dto/user-behavior.dto';

const router: Router = Router();

/**
 * @swagger
 * /api/v1/user-behavior/track:
 *   post:
 *     summary: Track user behavior event
 *     tags: [User Behavior]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventType
 *             properties:
 *               eventType:
 *                 type: string
 *                 enum: [product_view, search_query, add_to_cart, remove_from_cart, purchase, wishlist_add, favorite_add, category_view, product_click]
 *               productId:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               eventData:
 *                 type: object
 *     responses:
 *       201:
 *         description: Behavior tracked successfully
 */
router.post('/track', authMiddleware, validate(trackBehaviorSchema), userBehaviorController.track);

/**
 * @swagger
 * /api/v1/user-behavior/stats:
 *   get:
 *     summary: Get user behavior statistics
 *     tags: [User Behavior]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User behavior stats retrieved successfully
 */
router.get('/stats', authMiddleware, userBehaviorController.getStats);

/**
 * @swagger
 * /api/v1/user-behavior:
 *   get:
 *     summary: Get user behavior history
 *     tags: [User Behavior]
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
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User behavior history retrieved successfully
 */
router.get('/', authMiddleware, userBehaviorController.getUserBehavior);

export default router;
