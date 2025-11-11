import { Router } from 'express';
import { scraperController } from './scraper.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { createScraperJobSchema, updateScraperJobSchema } from './dto/scraper.dto';

const router: Router = Router();

/**
 * @swagger
 * /api/v1/scraper/jobs:
 *   post:
 *     summary: Create a scraper job
 *     tags: [Scraper]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *               productId:
 *                 type: string
 *               selector:
 *                 type: string
 *               frequency:
 *                 type: number
 *     responses:
 *       201:
 *         description: Scraper job created successfully
 */
router.post(
  '/jobs',
  authMiddleware,
  roleMiddleware('admin', 'seller'),
  validate(createScraperJobSchema),
  scraperController.createJob.bind(scraperController)
);

/**
 * @swagger
 * /api/v1/scraper/jobs:
 *   get:
 *     summary: Get scraper jobs
 *     tags: [Scraper]
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
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
 */
router.get(
  '/jobs',
  authMiddleware,
  roleMiddleware('admin', 'seller'),
  scraperController.getJobs.bind(scraperController)
);

/**
 * @swagger
 * /api/v1/scraper/jobs/{id}:
 *   get:
 *     summary: Get scraper job by ID
 *     tags: [Scraper]
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
 *         description: Job retrieved successfully
 */
router.get(
  '/jobs/:id',
  authMiddleware,
  roleMiddleware('admin', 'seller'),
  scraperController.getJobById.bind(scraperController)
);

/**
 * @swagger
 * /api/v1/scraper/jobs/{id}:
 *   patch:
 *     summary: Update scraper job
 *     tags: [Scraper]
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
 *               selector:
 *                 type: string
 *               frequency:
 *                 type: number
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Job updated successfully
 */
router.patch(
  '/jobs/:id',
  authMiddleware,
  roleMiddleware('admin', 'seller'),
  validate(updateScraperJobSchema),
  scraperController.updateJob.bind(scraperController)
);

/**
 * @swagger
 * /api/v1/scraper/jobs/{id}:
 *   delete:
 *     summary: Delete scraper job
 *     tags: [Scraper]
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
 *         description: Job deleted successfully
 */
router.delete(
  '/jobs/:id',
  authMiddleware,
  roleMiddleware('admin', 'seller'),
  scraperController.deleteJob.bind(scraperController)
);

/**
 * @swagger
 * /api/v1/scraper/jobs/{id}/run:
 *   post:
 *     summary: Run scraper job manually
 *     tags: [Scraper]
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
 *         description: Scraping started
 */
router.post(
  '/jobs/:id/run',
  authMiddleware,
  roleMiddleware('admin', 'seller'),
  scraperController.runScrape.bind(scraperController)
);

export default router;
