import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error.util';
import { error } from '../utils/response.util';
import { config } from '../config';
import logger from '../logger';

export const errorMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    error(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  logger.error('Unhandled error:', {
    error: err.message,
    stack: config.nodeEnv === 'production' ? undefined : err.stack,
    path: req.path,
    method: req.method,
  });

  error(
    res,
    'InternalServerError',
    config.nodeEnv === 'production'
      ? 'Internal server error'
      : err.message,
    500
  );
};

