import { z } from 'zod';

export const createCommentSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(5000, 'Content must be less than 5000 characters'),
  parentId: z.string().optional(), // For replies
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
});

export const moderateCommentSchema = z.object({
  isModerated: z.boolean(),
  moderationReason: z.string().optional(),
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>;
export type UpdateCommentDto = z.infer<typeof updateCommentSchema>;
export type ModerateCommentDto = z.infer<typeof moderateCommentSchema>;
