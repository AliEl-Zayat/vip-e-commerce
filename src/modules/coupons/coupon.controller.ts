import { Request, Response, NextFunction } from 'express';
import { couponService } from './coupon.service';
import { CreateCouponDto, UpdateCouponDto, ApplyCouponDto } from './dto/coupon.dto';
import { success } from '../../utils/response.util';

export class CouponController {
  async createCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as CreateCouponDto;
      const coupon = await couponService.createCoupon(data);

      success(
        res,
        {
          id: coupon._id.toString(),
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minPurchaseAmount: coupon.minPurchaseAmount,
          maxDiscountAmount: coupon.maxDiscountAmount,
          validFrom: coupon.validFrom,
          validUntil: coupon.validUntil,
          usageLimit: coupon.usageLimit,
          usageLimitPerUser: coupon.usageLimitPerUser,
          applicableTo: coupon.applicableTo,
          applicableCategories: coupon.applicableCategories,
          applicableProducts: coupon.applicableProducts,
          isActive: coupon.isActive,
          usageCount: coupon.usageCount,
          createdAt: coupon.createdAt,
          updatedAt: coupon.updatedAt,
        },
        201
      );
    } catch (err) {
      next(err);
    }
  }

  async getCouponById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupon = await couponService.getCouponById(req.params.id);

      success(res, {
        id: coupon._id.toString(),
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minPurchaseAmount: coupon.minPurchaseAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        usageLimit: coupon.usageLimit,
        usageLimitPerUser: coupon.usageLimitPerUser,
        applicableTo: coupon.applicableTo,
        applicableCategories: coupon.applicableCategories,
        applicableProducts: coupon.applicableProducts,
        isActive: coupon.isActive,
        usageCount: coupon.usageCount,
        createdAt: coupon.createdAt,
        updatedAt: coupon.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCouponByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupon = await couponService.getCouponByCode(req.params.code);

      success(res, {
        id: coupon._id.toString(),
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minPurchaseAmount: coupon.minPurchaseAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        usageLimit: coupon.usageLimit,
        usageLimitPerUser: coupon.usageLimitPerUser,
        applicableTo: coupon.applicableTo,
        applicableCategories: coupon.applicableCategories,
        applicableProducts: coupon.applicableProducts,
        isActive: coupon.isActive,
        usageCount: coupon.usageCount,
      });
    } catch (err) {
      next(err);
    }
  }

  async listCoupons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = {
        page: req.query.page ? parseInt(String(req.query.page), 10) : undefined,
        limit: req.query.limit ? parseInt(String(req.query.limit), 10) : undefined,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      };

      const { coupons, meta } = await couponService.listCoupons(query);

      success(
        res,
        coupons.map((coupon) => ({
          id: coupon._id.toString(),
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minPurchaseAmount: coupon.minPurchaseAmount,
          maxDiscountAmount: coupon.maxDiscountAmount,
          validFrom: coupon.validFrom,
          validUntil: coupon.validUntil,
          usageLimit: coupon.usageLimit,
          usageLimitPerUser: coupon.usageLimitPerUser,
          applicableTo: coupon.applicableTo,
          applicableCategories: coupon.applicableCategories,
          applicableProducts: coupon.applicableProducts,
          isActive: coupon.isActive,
          usageCount: coupon.usageCount,
          createdAt: coupon.createdAt,
          updatedAt: coupon.updatedAt,
        })),
        200,
        meta as unknown as Record<string, unknown>
      );
    } catch (err) {
      next(err);
    }
  }

  async updateCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as UpdateCouponDto;
      const coupon = await couponService.updateCoupon(req.params.id, data);

      success(res, {
        id: coupon._id.toString(),
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minPurchaseAmount: coupon.minPurchaseAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        usageLimit: coupon.usageLimit,
        usageLimitPerUser: coupon.usageLimitPerUser,
        applicableTo: coupon.applicableTo,
        applicableCategories: coupon.applicableCategories,
        applicableProducts: coupon.applicableProducts,
        isActive: coupon.isActive,
        usageCount: coupon.usageCount,
        createdAt: coupon.createdAt,
        updatedAt: coupon.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await couponService.deleteCoupon(req.params.id);

      success(res, { message: 'Coupon deleted successfully' }, 200);
    } catch (err) {
      next(err);
    }
  }

  async validateCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as ApplyCouponDto;
      const cartItems = req.body.cartItems || [];
      const totalAmount = req.body.totalAmount || 0;

      const result = await couponService.validateCoupon(
        data.code,
        req.user._id.toString(),
        cartItems,
        totalAmount
      );

      if (!result.isValid) {
        success(
          res,
          {
            isValid: false,
            error: result.error,
            discountAmount: 0,
          },
          200
        );
        return;
      }

      success(res, {
        isValid: true,
        coupon: {
          id: result.coupon!._id.toString(),
          code: result.coupon!.code,
          discountType: result.coupon!.discountType,
          discountValue: result.coupon!.discountValue,
        },
        discountAmount: result.discountAmount,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const couponController = new CouponController();


