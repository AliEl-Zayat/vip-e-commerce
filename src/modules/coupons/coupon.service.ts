import mongoose from 'mongoose';
import { Coupon, ICoupon } from './coupon.model';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';
import { AppError } from '../../utils/error.util';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.util';
import { Product } from '../products/product.model';

export interface CouponListQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: ICoupon;
  discountAmount: number;
  error?: string;
}

export class CouponService {
  async createCoupon(data: CreateCouponDto): Promise<ICoupon> {
    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code: data.code.toUpperCase() });
    if (existingCoupon) {
      throw AppError.conflict('Coupon code already exists');
    }

    // Validate discount value
    if (data.discountType === 'percentage' && data.discountValue > 100) {
      throw AppError.badRequest('Percentage discount cannot exceed 100%');
    }

    // Validate applicable products exist if specified
    if (data.applicableTo === 'product' && data.applicableProducts) {
      const products = await Product.find({
        _id: { $in: data.applicableProducts },
      });
      if (products.length !== data.applicableProducts.length) {
        throw AppError.badRequest('Some products do not exist');
      }
    }

    const coupon = await Coupon.create({
      ...data,
      code: data.code.toUpperCase(),
      validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
      validUntil: new Date(data.validUntil),
    });

    return coupon;
  }

  async getCouponById(id: string): Promise<ICoupon> {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw AppError.notFound('Coupon not found');
    }
    return coupon;
  }

  async getCouponByCode(code: string): Promise<ICoupon> {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      throw AppError.notFound('Coupon not found');
    }
    return coupon;
  }

  async listCoupons(query: CouponListQuery) {
    const { page, limit, skip } = parsePagination(query);

    const filter: Record<string, unknown> = {};
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    const [coupons, totalItems] = await Promise.all([
      Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Coupon.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(page, limit, totalItems);

    return { coupons, meta };
  }

  async updateCoupon(id: string, data: UpdateCouponDto): Promise<ICoupon> {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw AppError.notFound('Coupon not found');
    }

    // Validate discount value if updating
    if (data.discountValue !== undefined) {
      if (coupon.discountType === 'percentage' && data.discountValue > 100) {
        throw AppError.badRequest('Percentage discount cannot exceed 100%');
      }
    }

    // Validate applicable products if updating
    if (data.applicableProducts) {
      const products = await Product.find({
        _id: { $in: data.applicableProducts },
      });
      if (products.length !== data.applicableProducts.length) {
        throw AppError.badRequest('Some products do not exist');
      }
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.validUntil) {
      updateData.validUntil = new Date(data.validUntil);
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(id, { $set: updateData }, { new: true });

    if (!updatedCoupon) {
      throw AppError.notFound('Coupon not found');
    }

    return updatedCoupon;
  }

  async deleteCoupon(id: string): Promise<void> {
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      throw AppError.notFound('Coupon not found');
    }
  }

  async validateCoupon(
    code: string,
    userId: string,
    cartItems: Array<{ productId: string; quantity: number; price: number }>,
    totalAmount: number
  ): Promise<CouponValidationResult> {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return {
        isValid: false,
        discountAmount: 0,
        error: 'Coupon not found',
      };
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return {
        isValid: false,
        discountAmount: 0,
        error: 'Coupon is not active',
      };
    }

    // Check validity dates
    const now = new Date();
    if (now < coupon.validFrom) {
      return {
        isValid: false,
        discountAmount: 0,
        error: 'Coupon is not yet valid',
      };
    }

    if (now > coupon.validUntil) {
      return {
        isValid: false,
        discountAmount: 0,
        error: 'Coupon has expired',
      };
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return {
        isValid: false,
        discountAmount: 0,
        error: 'Coupon usage limit reached',
      };
    }

    // Check per-user usage limit
    if (coupon.usageLimitPerUser) {
      const userUsageCount = coupon.usageHistory.filter(
        (usage) => usage.userId.toString() === userId
      ).length;
      if (userUsageCount >= coupon.usageLimitPerUser) {
        return {
          isValid: false,
          discountAmount: 0,
          error: 'You have reached the usage limit for this coupon',
        };
      }
    }

    // Check minimum purchase amount
    if (coupon.minPurchaseAmount && totalAmount < coupon.minPurchaseAmount) {
      return {
        isValid: false,
        discountAmount: 0,
        error: `Minimum purchase amount of $${(coupon.minPurchaseAmount / 100).toFixed(2)} required`,
      };
    }

    // Check applicability
    if (coupon.applicableTo === 'category') {
      const applicableCategories = coupon.applicableCategories || [];
      const productIds = cartItems.map((item) => item.productId);
      const products = await Product.find({ _id: { $in: productIds } });
      const hasApplicableProduct = products.some((product) =>
        applicableCategories.includes(product.category)
      );

      if (!hasApplicableProduct) {
        return {
          isValid: false,
          discountAmount: 0,
          error: 'Coupon is not applicable to items in your cart',
        };
      }
    } else if (coupon.applicableTo === 'product') {
      const applicableProductIds = (coupon.applicableProducts || []).map((id) => id.toString());
      const hasApplicableProduct = cartItems.some((item) =>
        applicableProductIds.includes(item.productId)
      );

      if (!hasApplicableProduct) {
        return {
          isValid: false,
          discountAmount: 0,
          error: 'Coupon is not applicable to items in your cart',
        };
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((totalAmount * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed total
    discountAmount = Math.min(discountAmount, totalAmount);

    return {
      isValid: true,
      coupon,
      discountAmount,
    };
  }

  async applyCouponToOrder(
    couponId: string,
    userId: string,
    orderId: string
  ): Promise<ICoupon> {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      throw AppError.notFound('Coupon not found');
    }

    coupon.usageCount += 1;
    coupon.usageHistory.push({
      userId: new mongoose.Types.ObjectId(userId),
      orderId: new mongoose.Types.ObjectId(orderId),
      usedAt: new Date(),
    });

    await coupon.save();
    return coupon;
  }
}

export const couponService = new CouponService();

