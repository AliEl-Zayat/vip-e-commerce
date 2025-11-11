import { Request, Response, NextFunction } from 'express';
import { Product } from '../modules/products/product.model';
import { AppError } from '../utils/error.util';

export const ownershipMiddleware = (resourceModel: 'product') => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    if (req.user.role === 'admin') {
      // Admins can access any resource
      return next();
    }

    const resourceId = req.params.id;

    if (resourceModel === 'product') {
      const product = await Product.findById(resourceId);
      if (!product) {
        throw AppError.notFound('Product not found');
      }

      if (product.sellerId.toString() !== req.user._id.toString()) {
        throw AppError.forbidden('You can only access your own resources');
      }
    }

    next();
  };
};
