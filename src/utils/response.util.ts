import { Response } from 'express';

export interface SuccessResponse<T = unknown> {
  success: true;
  status: number;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  status: number;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export const success = <T>(
  res: Response,
  data: T,
  status: number = 200,
  meta?: Record<string, unknown>
): Response<SuccessResponse<T>> => {
  return res.status(status).json({
    success: true,
    status,
    data,
    ...(meta && { meta }),
  });
};

export const error = (
  res: Response,
  code: string,
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
): Response<ErrorResponse> => {
  return res.status(status).json({
    success: false,
    status,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  });
};

