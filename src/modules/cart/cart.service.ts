import { Cart, ICart } from './cart.model';
import { Product } from '../products/product.model';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { couponService } from '../coupons/coupon.service';
import { offerService } from '../offers/offer.service';
import { AppError } from '../../utils/error.util';

export class CartService {
  async getCart(userId: string): Promise<ICart> {
    let cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }
    return cart;
  }

  async getCartWithOffers(userId: string) {
    const cart = await this.getCart(userId);
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Prepare cart items for offer calculation
    const cartItems = cart.items.map((item: any) => {
      const product = item.productId;
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

  async addToCart(userId: string, data: AddToCartDto): Promise<ICart> {
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
      (item) => item.productId.toString() === data.productId
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
        productId: product._id,
        quantity: data.quantity,
        price: product.price,
      });
    }

    // Revalidate coupon if present
    if (cart.couponCode) {
      await this.revalidateCoupon(cart, userId);
    }

    await cart.save();
    return cart.populate('items.productId');
  }

  async updateCartItem(userId: string, productId: string, data: UpdateCartItemDto): Promise<ICart> {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw AppError.notFound('Cart not found');
    }

    const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);
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
    return cart.populate('items.productId');
  }

  async removeFromCart(userId: string, productId: string): Promise<ICart> {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw AppError.notFound('Cart not found');
    }

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);

    // Revalidate coupon if present
    if (cart.couponCode) {
      await this.revalidateCoupon(cart, userId);
    }

    await cart.save();
    return cart.populate('items.productId');
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

  async applyCoupon(userId: string, couponCode: string): Promise<ICart> {
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      throw AppError.badRequest('Cart is empty');
    }

    // Calculate total amount
    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Prepare cart items for validation
    const cartItems = cart.items.map((item) => ({
      productId: item.productId.toString(),
      quantity: item.quantity,
      price: item.price,
    }));

    // Validate coupon
    const validation = await couponService.validateCoupon(
      couponCode,
      userId,
      cartItems,
      totalAmount
    );

    if (!validation.isValid) {
      throw AppError.badRequest(validation.error || 'Invalid coupon');
    }

    // Apply coupon to cart
    cart.couponCode = couponCode.toUpperCase();
    cart.discountAmount = validation.discountAmount;

    await cart.save();
    return cart.populate('items.productId');
  }

  async removeCoupon(userId: string): Promise<ICart> {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw AppError.notFound('Cart not found');
    }

    cart.couponCode = undefined;
    cart.discountAmount = 0;
    await cart.save();
    return cart.populate('items.productId');
  }

  private async revalidateCoupon(cart: ICart, userId: string): Promise<void> {
    if (!cart.couponCode || cart.items.length === 0) {
      cart.couponCode = undefined;
      cart.discountAmount = 0;
      return;
    }

    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const cartItems = cart.items.map((item) => ({
      productId: item.productId.toString(),
      quantity: item.quantity,
      price: item.price,
    }));

    const validation = await couponService.validateCoupon(
      cart.couponCode,
      userId,
      cartItems,
      totalAmount
    );

    if (!validation.isValid) {
      // Remove invalid coupon
      cart.couponCode = undefined;
      cart.discountAmount = 0;
    } else {
      cart.discountAmount = validation.discountAmount;
    }
  }
}

export const cartService = new CartService();

