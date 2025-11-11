import { z } from 'zod';

export const createWishlistSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
});

export const updateWishlistSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

export const addItemToWishlistSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  notes: z.string().max(500).optional(),
});

export const updateWishlistItemSchema = z.object({
  notes: z.string().max(500).optional(),
});

export type CreateWishlistDto = z.infer<typeof createWishlistSchema>;
export type UpdateWishlistDto = z.infer<typeof updateWishlistSchema>;
export type AddItemToWishlistDto = z.infer<typeof addItemToWishlistSchema>;
export type UpdateWishlistItemDto = z.infer<typeof updateWishlistItemSchema>;
