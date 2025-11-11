import { z } from 'zod';

export const updateStockSchema = z.object({
  quantity: z.number().int('Quantity must be an integer'),
  changeType: z.enum(['purchase', 'sale', 'adjustment', 'return', 'restock', 'damaged', 'expired']),
  reason: z.string().optional(),
});

export const createStockAlertSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  threshold: z.number().int().min(0, 'Threshold must be non-negative').default(10),
});

export const updateStockAlertSchema = z.object({
  threshold: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateStockDto = z.infer<typeof updateStockSchema>;
export type CreateStockAlertDto = z.infer<typeof createStockAlertSchema>;
export type UpdateStockAlertDto = z.infer<typeof updateStockAlertSchema>;
