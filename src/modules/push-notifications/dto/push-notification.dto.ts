import { z } from 'zod';

export const registerPushTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  platform: z.enum(['ios', 'android', 'web']),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
});

export const sendPushNotificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  data: z.record(z.unknown()).optional(),
});

export type RegisterPushTokenDto = z.infer<typeof registerPushTokenSchema>;
export type SendPushNotificationDto = z.infer<typeof sendPushNotificationSchema>;

