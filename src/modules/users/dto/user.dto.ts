import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  avatarUrl: z.string().url('Invalid URL format').optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
