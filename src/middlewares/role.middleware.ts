import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error.util';

export type Role = 'admin' | 'seller' | 'customer';

export const roleMiddleware = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      throw AppError.forbidden('Insufficient permissions');
    }

    next();
  };
};
