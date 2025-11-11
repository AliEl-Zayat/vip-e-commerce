import { Cart, ICart, ICartItem } from './cart.model';
import { IProduct, Product } from '../products/product.model';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { couponService } from '../coupons/coupon.service';
import { offerService, OfferApplicationResult } from '../offers/offer.service';
import { userBehaviorService } from '../user-behavior/user-behavior.service';
import { AppError } from '../../utils/error.util';
import type { CartItemWithProduct, PopulatedCartDocument } from './cart.types';
import { isCartItemWithProduct } from './cart.types';

export class CartService {
  async getCart(userId: string): Promise<PopulatedCartDocument> {
    const existingCart = await Cart.findOne({ userId });

    if (existingCart) {
      await existingCart.populate('items.productId');
      return existingCart as PopulatedCartDocument;
    }

    const createdCart = await Cart.create({ userId, items: [] });
    await createdCart.populate('items.productId');
    return createdCart as PopulatedCartDocument;
  }

  async getCartWithOffers(userId: string): Promise<{
    cart: PopulatedCartDocument;
    subtotal: number;
    offerDiscount: number;
    couponDiscount: number;
    totalDiscount: number;
    freeShipping: boolean;
    applicableOffers: OfferApplicationResult['applicableOffers'];
  }> {
    const cart = await this.getCart(userId);
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Prepare cart items for offer calculation
    const cartItems = cart.items.map((item: CartItemWithProduct | ICartItem) => {
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

    // Apply offers automatically
    const offerResult = await offerService.applyOffersToCart(cartItems, subtotal);

    // Calculate coupon discount
    const couponDiscount = cart.discountAmount || 0;

    // Total discount is sum of offer discounts and coupon discount
    const totalDiscount = offerResult.totalDiscount + couponDiscount;

    return {
      cart,
      subtotal,
      offerDiscount: offerResult.totalDiscount,
      couponDiscount,
      totalDiscount,
      freeShipping: offerResult.freeShipping,
      applicableOffers: offerResult.applicableOffers,
    };
  }

  async addToCart(userId: string, data: AddToCartDto): Promise<PopulatedCartDocument> {
    // Get or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    // Verify product exists and has stock
    const product = await Product.findById(data.productId);
    if (!product) {
      throw AppError.notFound('Product not found');
    }

    if (product.stock < data.quantity) {
      throw AppError.badRequest('Insufficient stock');
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === data.productId
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + data.quantity;
      if (product.stock < newQuantity) {
        throw AppError.badRequest('Insufficient stock');
      }
      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = product.price;
    } else {
      // Add new item
      cart.items.push({
        productId: product as unknown as IProduct,
        quantity: data.quantity,
        price: product.price,
      });
    }

    // Revalidate coupon if present
    if (cart.couponCode) {
      await this.revalidateCoupon(cart, userId);
    }

    await cart.save();

    // Track add to cart event (async, don't block)
    userBehaviorService
      .track(userId, {
        eventType: 'add_to_cart',
        productId: data.productId,
        eventData: {
          quantity: existingItemIndex >= 0 ? cart.items[existingItemIndex].quantity : data.quantity,
          price: product.price,
          category: product.category,
          tags: product.tags,
        },
      })
      .catch(err => {
        console.error('[CartService] Error tracking add to cart:', err);
      });

    const populatedCart = (await cart.populate('items.productId')) as PopulatedCartDocument;
    return populatedCart;
  }

  async updateCartItem(
    userId: string,
    productId: string,
    data: UpdateCartItemDto
  ): Promise<PopulatedCartDocument> {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw AppError.notFound('Cart not found');
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex === -1) {
      throw AppError.notFound('Item not found in cart');
    }

    // Verify product has enough stock
    const product = await Product.findById(productId);
    if (!product) {
      throw AppError.notFound('Product not found');
    }

    if (product.stock < data.quantity) {
      throw AppError.badRequest('Insufficient stock');
    }

    cart.items[itemIndex].quantity = data.quantity;
    cart.items[itemIndex].price = product.price;

    // Revalidate coupon if present
    if (cart.couponCode) {
      await this.revalidateCoupon(cart, userId);
    }

    await cart.save();
    return (await cart.populate('items.productId')) as PopulatedCartDocument;
  }

  async removeFromCart(userId: string, productId: string): Promise<PopulatedCartDocument> {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw AppError.notFound('Cart not found');
    }

    cart.items = cart.items.filter(item => item.productId.toString() !== productId);

    // Revalidate coupon if present
    if (cart.couponCode) {
      await this.revalidateCoupon(cart, userId);
    }

    await cart.save();

    // Track remove from cart event (async, don't block)
    userBehaviorService
      .track(userId, {
        eventType: 'remove_from_cart',
        productId,
        eventData: {
          quantity: cart.items.find(item => item.productId.toString() === productId)?.quantity,
          price: cart.items.find(item => item.productId.toString() === productId)?.price,
          category: cart.items.find(item => item.productId.toString() === productId)?.productId
            .category,
          tags: cart.items.find(item => item.productId.toString() === productId)?.productId.tags,
        },
      })
      .catch(err => {
        console.error('[CartService] Error tracking remove from cart:', err);
      });

    return (await cart.populate('items.productId')) as PopulatedCartDocument;
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = [];
      cart.couponCode = undefined;
      cart.discountAmount = 0;
      await cart.save();
    }
  }

  async applyCoupon(userId: string, couponCode: string): Promise<PopulatedCartDocument> {
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      throw AppError.badRequest('Cart is empty');
    }

    await cart.populate('items.productId');
    const populatedCart = cart as PopulatedCartDocument;

    // Calculate total amount
    const totalAmount = populatedCart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Prepare cart items for validation
    const cartItems = populatedCart.items.map((item: CartItemWithProduct | ICartItem) => {
      const productId = isCartItemWithProduct(item)
        ? item.productId.toString()
        : (item as unknown as ICartItem).productId.toString();

      return {
        productId: productId as unknown as IProduct,
        quantity: item.quantity,
        price: item.price,
      };
    });

    const coupon = await couponService.validateCoupon(
      couponCode,
      userId,
      cartItems.map(item => ({
        productId: (item.productId as unknown as IProduct)._id.toString(),
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount
    );

    if (!coupon) {
      throw AppError.badRequest('Invalid or expired coupon');
    }

    populatedCart.couponCode = coupon.coupon?.code || undefined;
    populatedCart.discountAmount = coupon.discountAmount;

    await populatedCart.save();
    await populatedCart.populate('items.productId');
    return populatedCart;
  }

  async removeCoupon(userId: string): Promise<PopulatedCartDocument> {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw AppError.notFound('Cart not found');
    }

    cart.couponCode = undefined;
    cart.discountAmount = 0;

    await cart.save();
    await cart.populate('items.productId');
    return cart as PopulatedCartDocument;
  }

  private async revalidateCoupon(cart: ICart, userId: string): Promise<void> {
    if (!cart.couponCode) {
      return;
    }

    try {
      const totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const cartItems = cart.items.map(item => ({
        productId: (item.productId as unknown as IProduct)._id.toString(),
        quantity: item.quantity,
        price: item.price,
      }));

      await couponService.validateCoupon(cart.couponCode, userId, cartItems, totalAmount);
    } catch (error) {
      console.warn('[CartService] Coupon became invalid, removing from cart:', error);
      cart.couponCode = undefined;
      cart.discountAmount = 0;
    }
  }
}

export const cartService = new CartService();
