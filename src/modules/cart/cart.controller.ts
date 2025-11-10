import { Request, Response, NextFunction } from 'express';
import { cartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { success } from '../../utils/response.util';
import { offerService } from '../offers/offer.service';

export class CartController {
  private async calculateCartTotals(cart: any) {
    const subtotal = cart.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

    // Prepare cart items for offer calculation
    const cartItems = cart.items.map((item: any) => {
      const product = item.productId;
      return {
        productId: product._id?.toString() || product.toString(),
        quantity: item.quantity,
        price: item.price,
        category: product.category || undefined,
      };
    });

    // Apply offers automatically
    const offerResult = await offerService.applyOffersToCart(cartItems, subtotal);

    // Calculate coupon discount
    const couponDiscount = cart.discountAmount || 0;

    // Total discount is sum of offer discounts and coupon discount
    const totalDiscount = offerResult.totalDiscount + couponDiscount;
    const total = subtotal - totalDiscount;

    return {
      subtotal,
      couponDiscount,
      offerDiscount: offerResult.totalDiscount,
      totalDiscount,
      total,
      freeShipping: offerResult.freeShipping,
      applicableOffers: offerResult.applicableOffers.map((ao) => ({
        offerId: ao.offer._id.toString(),
        title: ao.offer.title,
        description: ao.description,
        discountAmount: ao.discountAmount,
      })),
    };
  }

  async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const cart = await cartService.getCart(req.user._id.toString());
      const totals = await this.calculateCartTotals(cart);

      success(res, {
        id: cart._id.toString(),
        userId: cart.userId.toString(),
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        couponCode: cart.couponCode,
        couponDiscount: totals.couponDiscount,
        offerDiscount: totals.offerDiscount,
        applicableOffers: totals.applicableOffers,
        discountAmount: totals.totalDiscount,
        subtotal: totals.subtotal,
        total: totals.total,
        freeShipping: totals.freeShipping,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async addToCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as AddToCartDto;
      const cart = await cartService.addToCart(req.user._id.toString(), data);
      const totals = await this.calculateCartTotals(cart);

      success(res, {
        id: cart._id.toString(),
        userId: cart.userId.toString(),
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        couponCode: cart.couponCode,
        couponDiscount: totals.couponDiscount,
        offerDiscount: totals.offerDiscount,
        applicableOffers: totals.applicableOffers,
        discountAmount: totals.totalDiscount,
        subtotal: totals.subtotal,
        total: totals.total,
        freeShipping: totals.freeShipping,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      });
    } catch (err) {
      next(err);
    }
  }

  async updateCartItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as UpdateCartItemDto;
      const cart = await cartService.updateCartItem(
        req.user._id.toString(),
        req.params.productId,
        data
      );
      const totals = await this.calculateCartTotals(cart);

      success(res, {
        id: cart._id.toString(),
        userId: cart.userId.toString(),
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        couponCode: cart.couponCode,
        couponDiscount: totals.couponDiscount,
        offerDiscount: totals.offerDiscount,
        applicableOffers: totals.applicableOffers,
        discountAmount: totals.totalDiscount,
        subtotal: totals.subtotal,
        total: totals.total,
        freeShipping: totals.freeShipping,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      });
    } catch (err) {
      next(err);
    }
  }

  async removeFromCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const cart = await cartService.removeFromCart(req.user._id.toString(), req.params.productId);
      const totals = await this.calculateCartTotals(cart);

      success(res, {
        id: cart._id.toString(),
        userId: cart.userId.toString(),
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        couponCode: cart.couponCode,
        couponDiscount: totals.couponDiscount,
        offerDiscount: totals.offerDiscount,
        applicableOffers: totals.applicableOffers,
        discountAmount: totals.totalDiscount,
        subtotal: totals.subtotal,
        total: totals.total,
        freeShipping: totals.freeShipping,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      });
    } catch (err) {
      next(err);
    }
  }

  async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      await cartService.clearCart(req.user._id.toString());

      success(res, { message: 'Cart cleared successfully' });
    } catch (err) {
      next(err);
    }
  }

  async applyCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { code } = req.body;
      const cart = await cartService.applyCoupon(req.user._id.toString(), code);
      const totals = await this.calculateCartTotals(cart);

      success(res, {
        id: cart._id.toString(),
        userId: cart.userId.toString(),
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        couponCode: cart.couponCode,
        couponDiscount: totals.couponDiscount,
        offerDiscount: totals.offerDiscount,
        applicableOffers: totals.applicableOffers,
        discountAmount: totals.totalDiscount,
        subtotal: totals.subtotal,
        total: totals.total,
        freeShipping: totals.freeShipping,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      });
    } catch (err) {
      next(err);
    }
  }

  async removeCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const cart = await cartService.removeCoupon(req.user._id.toString());
      const totals = await this.calculateCartTotals(cart);

      success(res, {
        id: cart._id.toString(),
        userId: cart.userId.toString(),
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        couponCode: undefined,
        couponDiscount: 0,
        offerDiscount: totals.offerDiscount,
        applicableOffers: totals.applicableOffers,
        discountAmount: totals.totalDiscount,
        subtotal: totals.subtotal,
        total: totals.total,
        freeShipping: totals.freeShipping,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      });
    } catch (err) {
      next(err);
    }
  }
}

export const cartController = new CartController();

