import { Request, Response, NextFunction } from 'express';

/**
 * Async handler utility - wraps async route handlers to catch errors
 * Follows DRY principle by eliminating try-catch boilerplate
 * 
 * Based on Express.js best practices for async error handling
 * 
 * @param fn - Async function that handles the request
 * @returns Express middleware function that catches and forwards errors
 * 
 * @example
 * ```typescript
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.getAll();
 *   success(res, users);
 * }));
 * ```
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next?: NextFunction) => Promise<void>
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

