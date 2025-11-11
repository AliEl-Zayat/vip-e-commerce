import { Router } from 'express';
import { pushNotificationController } from './push-notification.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { registerPushTokenSchema } from './dto/push-notification.dto';

const router: Router = Router();

/**
 * @swagger
 * /api/v1/push-notifications/tokens:
 *   post:
 *     summary: Register a push notification token
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - platform
 *             properties:
 *               token:
 *                 type: string
 *               platform:
 *                 type: string
 *                 enum: [ios, android, web]
 *               deviceId:
 *                 type: string
 *               deviceName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Token registered successfully
 */
router.post(
  '/tokens',
  authMiddleware,
  validate(registerPushTokenSchema),
  pushNotificationController.registerToken.bind(pushNotificationController)
);

/**
 * @swagger
 * /api/v1/push-notifications/tokens:
 *   get:
 *     summary: Get user's push notification tokens
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tokens retrieved successfully
 */
router.get(
  '/tokens',
  authMiddleware,
  pushNotificationController.getUserTokens.bind(pushNotificationController)
);

/**
 * @swagger
 * /api/v1/push-notifications/tokens/{id}:
 *   delete:
 *     summary: Delete a push notification token
 *     tags: [Push Notifications]
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
 *         description: Token deleted successfully
 */
router.delete(
  '/tokens/:id',
  authMiddleware,
  pushNotificationController.deleteToken.bind(pushNotificationController)
);

/**
 * @swagger
 * /api/v1/push-notifications/tokens/unregister:
 *   post:
 *     summary: Unregister a push notification token
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token unregistered successfully
 */
router.post(
  '/tokens/unregister',
  authMiddleware,
  pushNotificationController.unregisterToken.bind(pushNotificationController)
);

export default router;
