import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['admin', 'seller', 'customer']).optional().default('customer'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const forgetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const requestOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
  otpCode: z.string().length(6, 'OTP code must be 6 digits'),
});

export const authenticateQRSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  qrToken: z.string().min(1, 'QR token is required'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type ForgetPasswordDto = z.infer<typeof forgetPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type RequestOTPDto = z.infer<typeof requestOTPSchema>;
export type VerifyOTPDto = z.infer<typeof verifyOTPSchema>;
export type AuthenticateQRDto = z.infer<typeof authenticateQRSchema>;
