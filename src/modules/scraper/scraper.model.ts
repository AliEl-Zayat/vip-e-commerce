import mongoose, { Schema } from 'mongoose';

export type ScraperStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface IScraperJob extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  url: string;
  productId?: mongoose.Types.ObjectId; // If scraping for existing product
  status: ScraperStatus;
  selector?: string; // CSS selector for price
  frequency?: number; // Scrape frequency in hours
  lastScrapedAt?: Date;
  scrapedData?: {
    price?: number;
    title?: string;
    description?: string;
    images?: string[];
    availability?: boolean;
    [key: string]: unknown;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const scraperJobSchema = new Schema<IScraperJob>(
  {
    url: {
      type: String,
      required: true,
      // No explicit index needed - queries use productId and status indexes
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      // Index defined at schema level: scraperJobSchema.index({ productId: 1 })
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
      // Index defined at schema level: scraperJobSchema.index({ status: 1, createdAt: -1 })
    },
    selector: {
      type: String,
    },
    frequency: {
      type: Number,
      default: 24, // Default: once per day
    },
    lastScrapedAt: {
      type: Date,
    },
    scrapedData: {
      type: Schema.Types.Mixed,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

scraperJobSchema.index({ status: 1, createdAt: -1 });
scraperJobSchema.index({ productId: 1 });
scraperJobSchema.index({ lastScrapedAt: 1 });

export const ScraperJob = mongoose.model<IScraperJob>('ScraperJob', scraperJobSchema);

