import { Router } from 'express';
import { categoryController } from './category.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { createCategorySchema, updateCategorySchema } from './dto/category.dto';

const router: Router = Router();

/**
 * @swagger
 * /api/v1/categories/tree:
 *   get:
 *     summary: Get category tree structure
 *     tags: [Categories]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: includeProductCount
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Category tree retrieved successfully
 */
router.get('/tree', categoryController.getCategoryTree.bind(categoryController));

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: List categories
 *     tags: [Categories]
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
 *         name: parentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: includeProductCount
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/', categoryController.listCategories.bind(categoryController));

/**
 * @swagger
 * /api/v1/categories/slug/{slug}:
 *   get:
 *     summary: Get category by slug
 *     tags: [Categories]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeProductCount
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       404:
 *         description: Category not found
 */
router.get('/slug/:slug', categoryController.getCategoryBySlug.bind(categoryController));

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeProductCount
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       404:
 *         description: Category not found
 */
router.get('/:id', categoryController.getCategoryById.bind(categoryController));

/**
 * @swagger
 * /api/v1/categories/{id}/children:
 *   get:
 *     summary: Get category with children
 *     tags: [Categories]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category with children retrieved successfully
 *       404:
 *         description: Category not found
 */
router.get('/:id/children', categoryController.getCategoryWithChildren.bind(categoryController));

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Create category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryDto'
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - Admin only
 *       409:
 *         description: Category already exists
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  validate(createCategorySchema),
  categoryController.createCategory.bind(categoryController)
);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   patch:
 *     summary: Update category (Admin only)
 *     tags: [Categories]
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
 *             $ref: '#/components/schemas/UpdateCategoryDto'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Category not found
 */
router.patch(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  validate(updateCategorySchema),
  categoryController.updateCategory.bind(categoryController)
);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Delete category (Admin only)
 *     tags: [Categories]
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
 *         description: Category deleted successfully
 *       400:
 *         description: Cannot delete category with children or products
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Category not found
 */
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  categoryController.deleteCategory.bind(categoryController)
);

export default router;


