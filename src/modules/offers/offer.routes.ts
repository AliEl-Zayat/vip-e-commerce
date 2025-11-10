import { Router } from 'express';
import { offerController } from './offer.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { createOfferSchema, updateOfferSchema, applyOfferSchema } from './dto/offer.dto';

const router: Router = Router();

/**
 * @swagger
 * /api/v1/offers/active:
 *   get:
 *     summary: Get all active offers
 *     tags: [Offers]
 *     security: []
 *     responses:
 *       200:
 *         description: Active offers retrieved successfully
 */
router.get('/active', offerController.getActiveOffers.bind(offerController));

/**
 * @swagger
 * /api/v1/offers/apply:
 *   post:
 *     summary: Apply offers to cart
 *     tags: [Offers]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - totalAmount
 *             properties:
 *               cartItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     price:
 *                       type: number
 *               totalAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Offers applied successfully
 */
router.post('/apply', validate(applyOfferSchema), offerController.applyOffers.bind(offerController));

/**
 * @swagger
 * /api/v1/offers:
 *   get:
 *     summary: List offers
 *     tags: [Offers]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offerType
 *         schema:
 *           type: string
 *           enum: [flash_sale, bogo, category_discount, product_discount, bundle, free_shipping]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Offers retrieved successfully
 */
router.get('/', offerController.listOffers.bind(offerController));

/**
 * @swagger
 * /api/v1/offers/{id}:
 *   get:
 *     summary: Get offer by ID
 *     tags: [Offers]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Offer retrieved successfully
 *       404:
 *         description: Offer not found
 */
router.get('/:id', offerController.getOfferById.bind(offerController));

/**
 * @swagger
 * /api/v1/offers:
 *   post:
 *     summary: Create offer (Admin only)
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOfferDto'
 *     responses:
 *       201:
 *         description: Offer created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - Admin only
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  validate(createOfferSchema),
  offerController.createOffer.bind(offerController)
);

/**
 * @swagger
 * /api/v1/offers/{id}:
 *   patch:
 *     summary: Update offer (Admin only)
 *     tags: [Offers]
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
 *             $ref: '#/components/schemas/UpdateOfferDto'
 *     responses:
 *       200:
 *         description: Offer updated successfully
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Offer not found
 */
router.patch(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  validate(updateOfferSchema),
  offerController.updateOffer.bind(offerController)
);

/**
 * @swagger
 * /api/v1/offers/{id}:
 *   delete:
 *     summary: Delete offer (Admin only)
 *     tags: [Offers]
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
 *         description: Offer deleted successfully
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Offer not found
 */
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  offerController.deleteOffer.bind(offerController)
);

export default router;

