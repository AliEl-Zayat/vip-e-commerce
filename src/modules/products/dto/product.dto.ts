import { z } from 'zod';

export const createProductSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  stock: z.number().int().min(0, 'Stock must be non-negative').default(0),
  category: z.string().min(1, 'Category is required'),
  categoryId: z.string().optional(), // Optional reference to Category model
  tags: z.array(z.string()).optional().default([]),
});

export const updateProductSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  stock: z.number().int().min(0).optional(),
  category: z.string().min(1).optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;

