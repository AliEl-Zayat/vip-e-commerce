import { Router } from 'express';
import { couponController } from './coupon.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validation.middleware';
import {
  createCouponSchema,
  updateCouponSchema,
  applyCouponSchema,
} from './dto/coupon.dto';

const router: Router = Router();

/**
 * @swagger
 * /api/v1/coupons/validate:
 *   post:
 *     summary: Validate coupon code
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: SAVE20
 *               cartItems:
 *                 type: array
 *                 items:
 *                   type: object
 *               totalAmount:
 *                 type: number
 *                 example: 10000
 *     responses:
 *       200:
 *         description: Coupon validation result
 */
router.post(
  '/validate',
  authMiddleware,
  validate(applyCouponSchema),
  couponController.validateCoupon.bind(couponController)
);

/**
 * @swagger
 * /api/v1/coupons:
 *   get:
 *     summary: List coupons
 *     tags: [Coupons]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Coupons retrieved successfully
 */
router.get('/', couponController.listCoupons.bind(couponController));

/**
 * @swagger
 * /api/v1/coupons/code/{code}:
 *   get:
 *     summary: Get coupon by code
 *     tags: [Coupons]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon retrieved successfully
 *       404:
 *         description: Coupon not found
 */
router.get('/code/:code', couponController.getCouponByCode.bind(couponController));

/**
 * @swagger
 * /api/v1/coupons/{id}:
 *   get:
 *     summary: Get coupon by ID
 *     tags: [Coupons]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon retrieved successfully
 *       404:
 *         description: Coupon not found
 */
router.get('/:id', couponController.getCouponById.bind(couponController));

/**
 * @swagger
 * /api/v1/coupons:
 *   post:
 *     summary: Create coupon (Admin only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCouponDto'
 *     responses:
 *       201:
 *         description: Coupon created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - Admin only
 *       409:
 *         description: Coupon code already exists
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  validate(createCouponSchema),
  couponController.createCoupon.bind(couponController)
);

/**
 * @swagger
 * /api/v1/coupons/{id}:
 *   patch:
 *     summary: Update coupon (Admin only)
 *     tags: [Coupons]
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
 *             $ref: '#/components/schemas/UpdateCouponDto'
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Coupon not found
 */
router.patch(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  validate(updateCouponSchema),
  couponController.updateCoupon.bind(couponController)
);

/**
 * @swagger
 * /api/v1/coupons/{id}:
 *   delete:
 *     summary: Delete coupon (Admin only)
 *     tags: [Coupons]
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
 *         description: Coupon deleted successfully
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Coupon not found
 */
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  couponController.deleteCoupon.bind(couponController)
);

export default router;

