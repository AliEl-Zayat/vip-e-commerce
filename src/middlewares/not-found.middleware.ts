import { Request, Response } from 'express';
import { AppError } from '../utils/error.util';

/**
 * 404 Not Found middleware
 * Handles requests to undefined routes
 * Must be placed after all route definitions but before error middleware
 *
 * Based on Express.js best practices for handling undefined routes
 *
 * @param req - Express request object
 * @param _res - Express response object (unused, required by Express signature)
 * @param next - Express next function to pass error to error middleware
 */
export const notFoundMiddleware = (
  req: Request,
  _res: Response,
  next: (err: AppError) => void
): void => {
  const error = AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`);
  next(error);
};
