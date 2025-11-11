import { z } from 'zod';

export const createNotificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  type: z.enum([
    'order_placed',
    'order_shipped',
    'order_delivered',
    'order_cancelled',
    'low_stock',
    'price_drop',
    'new_product',
    'review_added',
    'wishlist_price_drop',
    'system',
  ]),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  channels: z.array(z.enum(['email', 'push', 'in_app'])).optional().default(['in_app']),
  data: z.record(z.unknown()).optional(),
});

export const updateNotificationSchema = z.object({
  read: z.boolean().optional(),
});

export const markAllReadSchema = z.object({
  type: z
    .enum([
      'order_placed',
      'order_shipped',
      'order_delivered',
      'order_cancelled',
      'low_stock',
      'price_drop',
      'new_product',
      'review_added',
      'wishlist_price_drop',
      'system',
    ])
    .optional(),
});

export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationDto = z.infer<typeof updateNotificationSchema>;
export type MarkAllReadDto = z.infer<typeof markAllReadSchema>;

