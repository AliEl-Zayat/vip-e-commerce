import { Request, Response, NextFunction } from 'express';
import { scraperService } from './scraper.service';
import { CreateScraperJobDto, UpdateScraperJobDto } from './dto/scraper.dto';
import { success } from '../../utils/response.util';
import { IScraperJob, ScraperStatus } from './scraper.model';
import { transformProduct } from '../products/product.controller';
import { IProduct } from '../products/product.model';

export class ScraperController {
  async createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as CreateScraperJobDto;
      const job = await scraperService.createJob(req.user._id.toString(), data);

      success(
        res,
        {
          id: job._id.toString(),
          url: job.url,
          productId: job.productId?.toString(),
          status: job.status,
          frequency: job.frequency,
          createdAt: job.createdAt,
        },
        201
      );
    } catch (err) {
      next(err);
    }
  }

  async updateJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as UpdateScraperJobDto;
      const job = await scraperService.updateJob(req.params.id, data);

      success(res, {
        id: job._id.toString(),
        status: job.status,
        frequency: job.frequency,
        updatedAt: job.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await scraperService.deleteJob(req.params.id);
      success(res, { message: 'Scraper job deleted successfully' }, 200);
    } catch (err) {
      next(err);
    }
  }

  async getJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
      const status = req.query.status as string | undefined;

      const { jobs, meta } = await scraperService.getJobs(
        page,
        limit,
        status as unknown as ScraperStatus
      );

      success(
        res,
        jobs.map((j: IScraperJob) => ({
          id: j._id.toString(),
          url: j.url,
          product: j.productId ? transformProduct(j.productId as unknown as IProduct) : null,
          status: j.status,
          frequency: j.frequency,
          lastScrapedAt: j.lastScrapedAt,
          scrapedData: j.scrapedData,
          error: j.error,
          createdAt: j.createdAt,
        })),
        200,
        meta as unknown as Record<string, unknown>
      );
    } catch (err) {
      next(err);
    }
  }

  async getJobById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await scraperService.getJobById(req.params.id);
      success(res, {
        id: job._id.toString(),
        url: job.url,
        productId: job.productId?.toString(),
        status: job.status,
        selector: job.selector,
        frequency: job.frequency,
        lastScrapedAt: job.lastScrapedAt,
        scrapedData: job.scrapedData,
        error: job.error,
        createdAt: job.createdAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async runScrape(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await scraperService.scrape(req.params.id);
      success(res, { message: 'Scraping started' }, 200);
    } catch (err) {
      next(err);
    }
  }
}

export const scraperController = new ScraperController();
