import { Router } from 'express';
import { wishlistController } from './wishlist.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import {
  createWishlistSchema,
  updateWishlistSchema,
  addItemToWishlistSchema,
  updateWishlistItemSchema,
} from './dto/wishlist.dto';

const router: Router = Router();

/**
 * @swagger
 * /api/v1/wishlists:
 *   post:
 *     summary: Create a wishlist
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Wishlist created successfully
 */
router.post(
  '/',
  authMiddleware,
  validate(createWishlistSchema),
  wishlistController.create.bind(wishlistController)
);

/**
 * @swagger
 * /api/v1/wishlists:
 *   get:
 *     summary: Get user's wishlists
 *     tags: [Wishlists]
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
 *         description: Wishlists retrieved successfully
 */
router.get('/', authMiddleware, wishlistController.getUserWishlists.bind(wishlistController));

/**
 * @swagger
 * /api/v1/wishlists/public:
 *   get:
 *     summary: Get public wishlists
 *     tags: [Wishlists]
 *     security: []
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
 *         description: Public wishlists retrieved successfully
 */
router.get('/public', wishlistController.getPublicWishlists.bind(wishlistController));

/**
 * @swagger
 * /api/v1/wishlists/{id}:
 *   get:
 *     summary: Get wishlist by ID
 *     tags: [Wishlists]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 */
router.get('/:id', wishlistController.getWishlistById.bind(wishlistController));

/**
 * @swagger
 * /api/v1/wishlists/{id}:
 *   patch:
 *     summary: Update a wishlist
 *     tags: [Wishlists]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Wishlist updated successfully
 */
router.patch(
  '/:id',
  authMiddleware,
  validate(updateWishlistSchema),
  wishlistController.update.bind(wishlistController)
);

/**
 * @swagger
 * /api/v1/wishlists/{id}:
 *   delete:
 *     summary: Delete a wishlist
 *     tags: [Wishlists]
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
 *         description: Wishlist deleted successfully
 */
router.delete('/:id', authMiddleware, wishlistController.delete.bind(wishlistController));

/**
 * @swagger
 * /api/v1/wishlists/{id}/items:
 *   post:
 *     summary: Add item to wishlist
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item added to wishlist
 */
router.post(
  '/:id/items',
  authMiddleware,
  validate(addItemToWishlistSchema),
  wishlistController.addItem.bind(wishlistController)
);

/**
 * @swagger
 * /api/v1/wishlists/{id}/items/{productId}:
 *   delete:
 *     summary: Remove item from wishlist
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed from wishlist
 */
router.delete(
  '/:id/items/:productId',
  authMiddleware,
  wishlistController.removeItem.bind(wishlistController)
);

/**
 * @swagger
 * /api/v1/wishlists/{id}/items/{productId}:
 *   patch:
 *     summary: Update wishlist item
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated successfully
 */
router.patch(
  '/:id/items/:productId',
  authMiddleware,
  validate(updateWishlistItemSchema),
  wishlistController.updateItem.bind(wishlistController)
);

export default router;
