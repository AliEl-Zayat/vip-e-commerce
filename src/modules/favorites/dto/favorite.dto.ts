import { z } from 'zod';

export const createFavoriteSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

export type CreateFavoriteDto = z.infer<typeof createFavoriteSchema>;
