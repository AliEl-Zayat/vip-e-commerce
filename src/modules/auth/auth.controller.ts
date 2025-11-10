import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { RegisterDto, LoginDto, ForgetPasswordDto, ResetPasswordDto, RequestOTPDto, VerifyOTPDto, AuthenticateQRDto } from './dto/auth.dto';
import { success } from '../../utils/response.util';
import { AppError } from '../../utils/error.util';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as RegisterDto;
      const result = await authService.register(data);

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      success(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as LoginDto;
      const result = await authService.login(data);

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      success(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        throw AppError.unauthorized('Refresh token not provided');
      }

      const result = await authService.refresh(refreshToken);
      success(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logout();
      res.clearCookie('refreshToken');
      success(res, { message: 'Logged out successfully' }, 200);
    } catch (err) {
      next(err);
    }
  }

  async forgetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as ForgetPasswordDto;
      await authService.forgetPassword(data);
      
      // Always return success to prevent email enumeration
      success(res, { message: 'If the email exists, a password reset link has been sent' }, 200);
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as ResetPasswordDto;
      await authService.resetPassword(data);
      
      success(res, { message: 'Password has been reset successfully' }, 200);
    } catch (err) {
      next(err);
    }
  }

  async requestOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as RequestOTPDto;
      await authService.requestOTP(data);
      
      // Always return success to prevent email enumeration
      success(res, { message: 'If the email exists, an OTP code has been sent' }, 200);
    } catch (err) {
      next(err);
    }
  }

  async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as VerifyOTPDto;
      const result = await authService.verifyOTP(data);

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      success(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  async generateQR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.generateQRSession();
      
      success(res, {
        sessionId: result.sessionId,
        qrCodeUrl: result.qrCodeUrl,
        expiresIn: 300, // 5 minutes in seconds
      }, 200);
    } catch (err) {
      next(err);
    }
  }

  async getQRStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.params.sessionId;
      const result = await authService.getQRSessionStatus(sessionId);
      
      success(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  async authenticateQR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as AuthenticateQRDto;
      await authService.authenticateQR(data, req.user._id.toString());
      
      success(res, { message: 'QR code authenticated successfully' }, 200);
    } catch (err) {
      next(err);
    }
  }

  async scanQR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId, qrToken } = req.body;
      
      if (!sessionId || !qrToken) {
        throw AppError.badRequest('Session ID and QR token are required');
      }

      await authService.scanQR(sessionId, qrToken);
      
      success(res, { message: 'QR code scanned successfully' }, 200);
    } catch (err) {
      next(err);
    }
  }

}

export const authController = new AuthController();

