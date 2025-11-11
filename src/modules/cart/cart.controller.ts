import { Request, Response, NextFunction } from 'express';
import { cartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { success } from '../../utils/response.util';
import { offerService } from '../offers/offer.service';
import type { PopulatedCartDocument, CartItemWithProduct } from './cart.types';
import { isCartItemWithProduct } from './cart.types';
import type { OfferApplicationResult } from '../offers/offer.service';
import { ICartItem } from './cart.model';

export class CartController {
  private async calculateCartTotals(cart: PopulatedCartDocument): Promise<{
    subtotal: number;
    couponDiscount: number;
    offerDiscount: number;
    totalDiscount: number;
    total: number;
    freeShipping: boolean;
    applicableOffers: OfferApplicationResult['applicableOffers'];
  }> {
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const cartItemsForOffers = cart.items.map((item: CartItemWithProduct | ICartItem) => {
      const product = isCartItemWithProduct(item)
        ? item.productId
        : (item as unknown as ICartItem).productId;

      return {
        productId: product._id.toString(),
        quantity: item.quantity,
        price: item.price,
        category: product.category,
      };
    });

    const offerResult = await offerService.applyOffersToCart(cartItemsForOffers, subtotal);
    const couponDiscount = cart.discountAmount || 0;
    const totalDiscount = offerResult.totalDiscount + couponDiscount;
    const total = subtotal - totalDiscount;

    return {
      subtotal,
      couponDiscount,
      offerDiscount: offerResult.totalDiscount,
      totalDiscount,
      total,
      freeShipping: offerResult.freeShipping,
      applicableOffers: offerResult.applicableOffers,
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
        items: cart.items.map(item => ({
          productId: isCartItemWithProduct(item)
            ? item.productId._id.toString()
            : (item as unknown as ICartItem).productId.toString(),
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
        items: cart.items.map(item => ({
          productId: isCartItemWithProduct(item)
            ? item.productId._id.toString()
            : (item as unknown as ICartItem).productId.toString(),
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
        items: cart.items.map(item => ({
          productId: isCartItemWithProduct(item)
            ? item.productId._id.toString()
            : (item as unknown as ICartItem).productId.toString(),
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
        items: cart.items.map(item => ({
          productId: isCartItemWithProduct(item)
            ? item.productId._id.toString()
            : (item as unknown as ICartItem).productId.toString(),
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
        items: cart.items.map(item => ({
          productId: isCartItemWithProduct(item)
            ? item.productId._id.toString()
            : (item as unknown as ICartItem).productId.toString(),
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
        items: cart.items.map(item => ({
          productId: isCartItemWithProduct(item)
            ? item.productId._id.toString()
            : (item as unknown as ICartItem).productId._id.toString(),
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
}

export const cartController = new CartController();
