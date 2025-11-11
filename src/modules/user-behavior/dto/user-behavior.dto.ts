import { z } from 'zod';

export const trackBehaviorSchema = z.object({
  eventType: z.enum([
    'product_view',
    'search_query',
    'add_to_cart',
    'remove_from_cart',
    'purchase',
    'wishlist_add',
    'favorite_add',
    'category_view',
    'product_click',
  ]),
  productId: z.string().optional(),
  categoryId: z.string().optional(),
  eventData: z
    .object({
      query: z.string().optional(),
      filters: z.record(z.unknown()).optional(),
      duration: z.number().positive().optional(),
      price: z.number().nonnegative().optional(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .passthrough()
    .optional()
    .default({}),
});

export type TrackBehaviorDto = z.infer<typeof trackBehaviorSchema>;
