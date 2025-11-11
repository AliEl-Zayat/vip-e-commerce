import { Request } from 'express';
import { IUser } from '../modules/users/user.model';

/**
 * Type guard to check if user is authenticated
 * Provides type safety for req.user checks
 * 
 * @param req - Express request object
 * @returns true if user is authenticated, false otherwise
 */
export const isAuthenticated = (req: Request): req is Request & { user: IUser } => {
  return req.user !== undefined && req.user !== null;
};

/**
 * Type guard to check if user has specific role
 * 
 * @param req - Express request object
 * @param role - Role to check for
 * @returns true if user has the specified role
 */
export const hasRole = (req: Request, role: 'admin' | 'seller' | 'customer'): req is Request & { user: IUser } => {
  return isAuthenticated(req) && req.user.role === role;
};

/**
 * Type guard to check if user is admin
 * 
 * @param req - Express request object
 * @returns true if user is admin
 */
export const isAdmin = (req: Request): req is Request & { user: IUser } => {
  return hasRole(req, 'admin');
};

/**
 * Type guard to check if user is seller or admin
 * 
 * @param req - Express request object
 * @returns true if user is seller or admin
 */
export const isSellerOrAdmin = (req: Request): req is Request & { user: IUser } => {
  return isAuthenticated(req) && (req.user.role === 'seller' || req.user.role === 'admin');
};

