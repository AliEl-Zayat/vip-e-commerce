import { Request, Response } from 'express';
import * as authService from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ForgetPasswordDto,
  ResetPasswordDto,
  RequestOTPDto,
  VerifyOTPDto,
  AuthenticateQRDto,
} from './dto/auth.dto';
import { success } from '../../utils/response.util';
import { AppError } from '../../utils/error.util';
import { asyncHandler } from '../../utils/async-handler.util';
import { isAuthenticated } from '../../utils/type-guards.util';

// Pure function: Set refresh token cookie
const setRefreshTokenCookie = (res: Response, refreshToken: string): void => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Controller handlers (functional programming approach)
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data = req.body as RegisterDto;
  const result = await authService.register(data);

  setRefreshTokenCookie(res, result.refreshToken);
  success(res, result, 201);
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data = req.body as LoginDto;
  const result = await authService.login(data);

  setRefreshTokenCookie(res, result.refreshToken);
  success(res, result, 200);
});

export const refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw AppError.unauthorized('Refresh token not provided');
  }

  const result = await authService.refresh(refreshToken);
  success(res, result, 200);
});

export const logout = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  await authService.logout();
  res.clearCookie('refreshToken');
  success(res, { message: 'Logged out successfully' }, 200);
});

export const forgetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data = req.body as ForgetPasswordDto;
  await authService.forgetPassword(data);

  // Always return success to prevent email enumeration
  success(res, { message: 'If the email exists, a password reset link has been sent' }, 200);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data = req.body as ResetPasswordDto;
  await authService.resetPassword(data);

  success(res, { message: 'Password has been reset successfully' }, 200);
});

export const requestOTP = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data = req.body as RequestOTPDto;
  await authService.requestOTP(data);

  // Always return success to prevent email enumeration
  success(res, { message: 'If the email exists, an OTP code has been sent' }, 200);
});

export const verifyOTP = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data = req.body as VerifyOTPDto;
  const result = await authService.verifyOTP(data);

  setRefreshTokenCookie(res, result.refreshToken);
  success(res, result, 200);
});

export const generateQR = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const result = await authService.generateQRSession();

  success(
    res,
    {
      sessionId: result.sessionId,
      qrCodeUrl: result.qrCodeUrl,
      expiresIn: 300, // 5 minutes in seconds
    },
    200
  );
});

export const getQRStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const sessionId = req.params.sessionId;
  const result = await authService.getQRSessionStatus(sessionId);

  success(res, result, 200);
});

export const authenticateQR = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!isAuthenticated(req)) {
    throw AppError.unauthorized('User not authenticated');
  }

  const data = req.body as AuthenticateQRDto;
  await authService.authenticateQR(data, req.user._id.toString());

  success(res, { message: 'QR code authenticated successfully' }, 200);
});

export const scanQR = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { sessionId, qrToken } = req.body;

  if (!sessionId || !qrToken) {
    throw AppError.badRequest('Session ID and QR token are required');
  }

  await authService.scanQR(sessionId, qrToken);

  success(res, { message: 'QR code scanned successfully' }, 200);
});
