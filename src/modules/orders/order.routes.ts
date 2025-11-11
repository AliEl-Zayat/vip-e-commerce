import { Router } from 'express';
import { orderController } from './order.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validation.middleware';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  updateShippingInfoSchema,
} from './dto/order.dto';

const router: Router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create order from cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderDto'
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Cart is empty or validation error
 */
router.post('/', validate(createOrderSchema), orderController.createOrder.bind(orderController));

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: List orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, processing, shipped, delivered, cancelled, refunded]
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/', orderController.listOrders.bind(orderController));

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
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
 *         description: Order retrieved successfully
 *       403:
 *         description: Forbidden - Can only view own orders
 *       404:
 *         description: Order not found
 */
router.get('/:id', orderController.getOrderById.bind(orderController));

/**
 * @swagger
 * /api/v1/orders/{id}/status:
 *   patch:
 *     summary: Update order status (Admin only)
 *     tags: [Orders]
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
 *             $ref: '#/components/schemas/UpdateOrderStatusDto'
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       403:
 *         description: Forbidden - Admin only
 */
router.patch(
  '/:id/status',
  roleMiddleware('admin'),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus.bind(orderController)
);

/**
 * @swagger
 * /api/v1/orders/{id}/shipping:
 *   patch:
 *     summary: Update shipping info (Admin only)
 *     tags: [Orders]
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
 *             $ref: '#/components/schemas/UpdateShippingInfoDto'
 *     responses:
 *       200:
 *         description: Shipping info updated successfully
 *       403:
 *         description: Forbidden - Admin only
 */
router.patch(
  '/:id/shipping',
  roleMiddleware('admin'),
  validate(updateShippingInfoSchema),
  orderController.updateShippingInfo.bind(orderController)
);

/**
 * @swagger
 * /api/v1/orders/track/{orderNumber}:
 *   get:
 *     summary: Track order by order number
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         example: ORD-ABC123-XYZ789
 *     responses:
 *       200:
 *         description: Order tracking information retrieved successfully
 *       403:
 *         description: Forbidden - Can only track own orders
 *       404:
 *         description: Order not found
 */
router.get('/track/:orderNumber', orderController.trackOrder.bind(orderController));

export default router;


