import { Router } from 'express';
import { searchController } from './search.controller';
import { trackSearchQuery } from '../../middlewares/track-behavior.middleware';

const router: Router = Router();

/**
 * @swagger
 * /api/v1/search:
 *   get:
 *     summary: Advanced product search
 *     tags: [Search]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tags
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
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
 *         description: Search results retrieved successfully
 */
router.get('/', trackSearchQuery, searchController.search.bind(searchController));

/**
 * @swagger
 * /api/v1/search/autocomplete:
 *   get:
 *     summary: Get search autocomplete suggestions
 *     tags: [Search]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Autocomplete suggestions retrieved
 */
router.get('/autocomplete', searchController.autocomplete.bind(searchController));

/**
 * @swagger
 * /api/v1/search/suggestions:
 *   get:
 *     summary: Get search suggestions (products and categories)
 *     tags: [Search]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search suggestions retrieved
 */
router.get('/suggestions', searchController.getSuggestions.bind(searchController));

/**
 * @swagger
 * /api/v1/search/popular:
 *   get:
 *     summary: Get popular searches
 *     tags: [Search]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Popular searches retrieved
 */
router.get('/popular', searchController.getPopularSearches.bind(searchController));

export default router;

