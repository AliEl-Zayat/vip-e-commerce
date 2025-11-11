import { z } from 'zod';

export const getRecommendationsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : undefined)),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : undefined)),
});

export type GetRecommendationsQueryDto = z.infer<typeof getRecommendationsQuerySchema>;
