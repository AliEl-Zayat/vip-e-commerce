import { z } from 'zod';

export const createRatingSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  review: z.string().max(2000).optional(),
});

export const updateRatingSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  review: z.string().max(2000).optional(),
});

export type CreateRatingDto = z.infer<typeof createRatingSchema>;
export type UpdateRatingDto = z.infer<typeof updateRatingSchema>;
