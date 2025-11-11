import mongoose from 'mongoose';
import { ScraperJob, IScraperJob, ScraperStatus } from './scraper.model';
import { CreateScraperJobDto, UpdateScraperJobDto } from './dto/scraper.dto';
import { AppError } from '../../utils/error.util';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.util';
import { Product } from '../products/product.model';
import { notificationService } from '../notifications/notification.service';

export class ScraperService {
  async createJob(_userId: string, data: CreateScraperJobDto): Promise<IScraperJob> {
    // Verify product exists if productId provided
    if (data.productId) {
      const product = await Product.findById(data.productId);
      if (!product) {
        throw AppError.notFound('Product not found');
      }
    }

    const job = await ScraperJob.create({
      url: data.url,
      productId: data.productId ? new mongoose.Types.ObjectId(data.productId) : undefined,
      selector: data.selector,
      frequency: data.frequency || 24,
      status: 'pending',
    });

    // Start scraping immediately
    this.scrape(job._id.toString()).catch(console.error);

    return job;
  }

  async updateJob(jobId: string, data: UpdateScraperJobDto): Promise<IScraperJob> {
    const job = await ScraperJob.findByIdAndUpdate(
      jobId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!job) {
      throw AppError.notFound('Scraper job not found');
    }

    return job;
  }

  async deleteJob(jobId: string): Promise<void> {
    const result = await ScraperJob.findByIdAndDelete(jobId);
    if (!result) {
      throw AppError.notFound('Scraper job not found');
    }
  }

  async getJobs(page?: number, limit?: number, status?: ScraperStatus) {
    const { skip, limit: queryLimit } = parsePagination({ page, limit });

    const filter: Record<string, unknown> = {};
    if (status) {
      filter.status = status;
    }

    const [jobs, totalItems] = await Promise.all([
      ScraperJob.find(filter)
        .populate('productId', 'title slug price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(queryLimit),
      ScraperJob.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(page || 1, queryLimit, totalItems);

    return { jobs, meta };
  }

  async getJobById(jobId: string): Promise<IScraperJob> {
    const job = await ScraperJob.findById(jobId).populate('productId');
    if (!job) {
      throw AppError.notFound('Scraper job not found');
    }
    return job;
  }

  async scrape(jobId: string): Promise<void> {
    const job = await ScraperJob.findById(jobId);
    if (!job) {
      throw AppError.notFound('Scraper job not found');
    }

    job.status = 'running';
    await job.save();

    try {
      // In a real implementation, you would use libraries like:
      // - puppeteer for browser automation
      // - cheerio for HTML parsing
      // - axios for HTTP requests

      // Placeholder implementation
      const scrapedData = await this.performScraping(job.url, job.selector);

      job.scrapedData = scrapedData;
      job.status = 'completed';
      job.lastScrapedAt = new Date();
      job.error = undefined;

      await job.save();

      // If productId exists, update product price and notify if price dropped
      if (job.productId && scrapedData.price && typeof scrapedData.price === 'number') {
        await this.handlePriceUpdate(job.productId.toString(), scrapedData.price);
      }
    } catch (error: unknown) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Scraping failed';
      await job.save();
    }
  }

  private async performScraping(url: string, selector?: string): Promise<Record<string, unknown>> {
    // TODO: Implement actual web scraping
    // Example with axios + cheerio:
    // const response = await axios.get(url);
    // const $ = cheerio.load(response.data);
    // const price = $(selector || '.price').text();
    // return { price: parseFloat(price.replace(/[^0-9.]/g, '')) * 100 };

    // Placeholder
    console.log(`[Scraper] Scraping ${url} with selector: ${selector || 'default'}`);
    return {
      price: Math.floor(Math.random() * 100000), // Random price in cents
      title: 'Scraped Product',
      availability: true,
    };
  }

  private async handlePriceUpdate(productId: string, newPrice: number): Promise<void> {
    const product = await Product.findById(productId);
    if (!product) {
      return;
    }

    const oldPrice = product.price;
    if (newPrice < oldPrice) {
      // Price dropped - notify users who have this in wishlist
      const Wishlist = mongoose.model('Wishlist');
      const wishlists = await Wishlist.find({
        'items.productId': new mongoose.Types.ObjectId(productId),
      });

      for (const wishlist of wishlists) {
        await notificationService.notifyPriceDrop(
          wishlist.userId.toString(),
          productId,
          product.title,
          oldPrice,
          newPrice
        );
      }

      // Update product price
      product.price = newPrice;
      await product.save();
    }
  }

  async runScheduledScrapes(): Promise<void> {
    const now = new Date();
    const jobs = await ScraperJob.find({
      status: { $in: ['pending', 'completed'] },
      $or: [
        { lastScrapedAt: { $exists: false } },
        {
          $expr: {
            $gte: [
              {
                $divide: [
                  { $subtract: [now, '$lastScrapedAt'] },
                  1000 * 60 * 60, // Convert to hours
                ],
              },
              { $ifNull: ['$frequency', 24] },
            ],
          },
        },
      ],
    });

    for (const job of jobs) {
      this.scrape(job._id.toString()).catch(console.error);
    }
  }
}

export const scraperService = new ScraperService();
