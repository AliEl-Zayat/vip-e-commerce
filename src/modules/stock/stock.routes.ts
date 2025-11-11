import { Router } from 'express';
import { stockController } from './stock.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { updateStockSchema, createStockAlertSchema, updateStockAlertSchema } from './dto/stock.dto';

const router: Router = Router();

/**
 * @swagger
 * /api/v1/stock/products/{productId}:
 *   patch:
 *     summary: Update product stock
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
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
 *               - quantity
 *               - changeType
 *             properties:
 *               quantity:
 *                 type: number
 *                 example: -5
 *               changeType:
 *                 type: string
 *                 enum: [purchase, sale, adjustment, return, restock, damaged, expired]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock updated successfully
 */
router.patch(
  '/products/:productId',
  authMiddleware,
  roleMiddleware('admin', 'seller'),
  validate(updateStockSchema),
  stockController.updateStock.bind(stockController)
);

/**
 * @swagger
 * /api/v1/stock/products/{productId}/history:
 *   get:
 *     summary: Get stock history for a product
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
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
 *         description: Stock history retrieved successfully
 */
router.get(
  '/products/:productId/history',
  authMiddleware,
  roleMiddleware('admin', 'seller'),
  stockController.getStockHistory.bind(stockController)
);

/**
 * @swagger
 * /api/v1/stock/alerts:
 *   post:
 *     summary: Create a stock alert
 *     tags: [Stock]
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
 *               threshold:
 *                 type: number
 *                 default: 10
 *     responses:
 *       201:
 *         description: Stock alert created successfully
 */
router.post(
  '/alerts',
  authMiddleware,
  roleMiddleware('admin', 'seller'),
  validate(createStockAlertSchema),
  stockController.createStockAlert.bind(stockController)
);

/**
 * @swagger
 * /api/v1/stock/alerts:
 *   get:
 *     summary: Get stock alerts
 *     tags: [Stock]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Stock alerts retrieved successfully
 */
router.get(
  '/alerts',
  authMiddleware,
  roleMiddleware('admin', 'seller'),
  stockController.getStockAlerts.bind(stockController)
);

/**
 * @swagger
 * /api/v1/stock/alerts/{id}:
 *   patch:
 *     summary: Update a stock alert
 *     tags: [Stock]
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
 *               threshold:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Stock alert updated successfully
 */
router.patch(
  '/alerts/:id',
  authMiddleware,
  roleMiddleware('admin', 'seller'),
  validate(updateStockAlertSchema),
  stockController.updateStockAlert.bind(stockController)
);

/**
 * @swagger
 * /api/v1/stock/alerts/{id}:
 *   delete:
 *     summary: Delete a stock alert
 *     tags: [Stock]
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
 *         description: Stock alert deleted successfully
 */
router.delete(
  '/alerts/:id',
  authMiddleware,
  roleMiddleware('admin', 'seller'),
  stockController.deleteStockAlert.bind(stockController)
);

/**
 * @swagger
 * /api/v1/stock/low-stock:
 *   get:
 *     summary: Get low stock products
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Low stock products retrieved successfully
 */
router.get(
  '/low-stock',
  authMiddleware,
  roleMiddleware('admin', 'seller'),
  stockController.getLowStockProducts.bind(stockController)
);

export default router;

