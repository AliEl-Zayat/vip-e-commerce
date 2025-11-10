import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../modules/auth/token.util';
import { User } from '../modules/users/user.model';
import { AppError } from '../utils/error.util';

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('No token provided');
    }

    const token = authHeader.substring(7);

    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.userId);
    if (!user) {
      throw AppError.unauthorized('User not found');
    }

    req.user = user as unknown as typeof req.user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(AppError.unauthorized('Invalid token'));
    }
  }
};

