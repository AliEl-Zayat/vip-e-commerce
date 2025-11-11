import { z } from 'zod';

export const createScraperJobSchema = z.object({
  url: z.string().url('Invalid URL'),
  productId: z.string().optional(),
  selector: z.string().optional(),
  frequency: z.number().int().min(1).max(168).optional().default(24), // Max 1 week
});

export const updateScraperJobSchema = z.object({
  selector: z.string().optional(),
  frequency: z.number().int().min(1).max(168).optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed']).optional(),
});

export type CreateScraperJobDto = z.infer<typeof createScraperJobSchema>;
export type UpdateScraperJobDto = z.infer<typeof updateScraperJobSchema>;
