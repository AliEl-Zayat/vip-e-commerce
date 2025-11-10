export enum ErrorCode {
  BadRequest = 'BadRequest',
  Unauthorized = 'Unauthorized',
  Forbidden = 'Forbidden',
  NotFound = 'NotFound',
  Conflict = 'Conflict',
  InternalServerError = 'InternalServerError',
  ValidationError = 'ValidationError',
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.InternalServerError,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, ErrorCode.BadRequest, 400, details);
  }

  static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError(message, ErrorCode.Unauthorized, 401);
  }

  static forbidden(message: string = 'Forbidden'): AppError {
    return new AppError(message, ErrorCode.Forbidden, 403);
  }

  static notFound(message: string = 'Resource not found'): AppError {
    return new AppError(message, ErrorCode.NotFound, 404);
  }

  static conflict(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, ErrorCode.Conflict, 409, details);
  }

  static validationError(
    message: string,
    details?: Record<string, unknown>
  ): AppError {
    return new AppError(message, ErrorCode.ValidationError, 400, details);
  }
}

