import { Router } from 'express';
import { ratingController } from './rating.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { createRatingSchema, updateRatingSchema } from './dto/rating.dto';

const router: Router = Router();

/**
 * @swagger
 * /api/v1/ratings:
 *   post:
 *     summary: Create a product rating
 *     tags: [Ratings]
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
 *               - rating
 *             properties:
 *               productId:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               review:
 *                 type: string
 *                 maxLength: 2000
 *     responses:
 *       201:
 *         description: Rating created successfully
 */
router.post('/', authMiddleware, validate(createRatingSchema), ratingController.create.bind(ratingController));

/**
 * @swagger
 * /api/v1/ratings/{id}:
 *   patch:
 *     summary: Update a rating
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *               review:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rating updated successfully
 */
router.patch('/:id', authMiddleware, validate(updateRatingSchema), ratingController.update.bind(ratingController));

/**
 * @swagger
 * /api/v1/ratings/{id}:
 *   delete:
 *     summary: Delete a rating
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rating deleted successfully
 */
router.delete('/:id', authMiddleware, ratingController.delete.bind(ratingController));

/**
 * @swagger
 * /api/v1/ratings/products/{productId}:
 *   get:
 *     summary: Get ratings for a product
 *     tags: [Ratings]
 *     security: []
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
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ratings retrieved successfully
 */
router.get('/products/:productId', ratingController.getProductRatings.bind(ratingController));

/**
 * @swagger
 * /api/v1/ratings/products/{productId}/stats:
 *   get:
 *     summary: Get rating statistics for a product
 *     tags: [Ratings]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rating statistics retrieved successfully
 */
router.get('/products/:productId/stats', ratingController.getProductRatingStats.bind(ratingController));

/**
 * @swagger
 * /api/v1/ratings/products/{productId}/my-rating:
 *   get:
 *     summary: Get user's rating for a product
 *     tags: [Ratings]
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
 *         description: User rating retrieved successfully
 */
router.get('/products/:productId/my-rating', authMiddleware, ratingController.getUserRating.bind(ratingController));

/**
 * @swagger
 * /api/v1/ratings/{id}/helpful:
 *   post:
 *     summary: Mark a rating as helpful
 *     tags: [Ratings]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rating marked as helpful
 */
router.post('/:id/helpful', ratingController.markHelpful.bind(ratingController));

export default router;

