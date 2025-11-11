import { Router } from 'express';
import { commentController } from './comment.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { createCommentSchema, updateCommentSchema, moderateCommentSchema } from './dto/comment.dto';

const router: Router = Router();

/**
 * @swagger
 * /api/v1/comments:
 *   post:
 *     summary: Create a comment
 *     tags: [Comments]
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
 *               - content
 *             properties:
 *               productId:
 *                 type: string
 *               content:
 *                 type: string
 *               parentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created successfully
 */
router.post('/', authMiddleware, validate(createCommentSchema), commentController.create.bind(commentController));

/**
 * @swagger
 * /api/v1/comments/{id}:
 *   patch:
 *     summary: Update a comment
 *     tags: [Comments]
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
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated successfully
 */
router.patch('/:id', authMiddleware, validate(updateCommentSchema), commentController.update.bind(commentController));

/**
 * @swagger
 * /api/v1/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
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
 *         description: Comment deleted successfully
 */
router.delete('/:id', authMiddleware, commentController.delete.bind(commentController));

/**
 * @swagger
 * /api/v1/comments/products/{productId}:
 *   get:
 *     summary: Get comments for a product
 *     tags: [Comments]
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
 *         name: includeReplies
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 */
router.get('/products/:productId', commentController.getProductComments.bind(commentController));

/**
 * @swagger
 * /api/v1/comments/{id}/replies:
 *   get:
 *     summary: Get replies to a comment
 *     tags: [Comments]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *         description: Replies retrieved successfully
 */
router.get('/:id/replies', commentController.getReplies.bind(commentController));

/**
 * @swagger
 * /api/v1/comments/{id}/upvote:
 *   post:
 *     summary: Upvote a comment
 *     tags: [Comments]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment upvoted successfully
 */
router.post('/:id/upvote', commentController.upvote.bind(commentController));

/**
 * @swagger
 * /api/v1/comments/{id}/downvote:
 *   post:
 *     summary: Downvote a comment
 *     tags: [Comments]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment downvoted successfully
 */
router.post('/:id/downvote', commentController.downvote.bind(commentController));

/**
 * @swagger
 * /api/v1/comments/{id}/moderate:
 *   patch:
 *     summary: Moderate a comment (admin only)
 *     tags: [Comments]
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
 *               isModerated:
 *                 type: boolean
 *               moderationReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment moderated successfully
 */
router.patch(
  '/:id/moderate',
  authMiddleware,
  roleMiddleware('admin'),
  validate(moderateCommentSchema),
  commentController.moderate.bind(commentController)
);

export default router;

