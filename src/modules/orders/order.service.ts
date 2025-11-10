import { Order, IOrder, OrderStatus } from './order.model';
import { Cart } from '../cart/cart.model';
import { Product } from '../products/product.model';
import { couponService } from '../coupons/coupon.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateShippingInfoDto } from './dto/order.dto';
import { AppError } from '../../utils/error.util';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.util';

export interface OrderListQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export class OrderService {
  async createOrder(userId: string, data: CreateOrderDto): Promise<IOrder> {
    // Get user's cart
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      throw AppError.badRequest('Cart is empty');
    }

    // Verify all products are still available and calculate totals
    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.productId);
      if (!product) {
        throw AppError.badRequest(`Product ${cartItem.productId} no longer exists`);
      }

      if (product.stock < cartItem.quantity) {
        throw AppError.badRequest(`Insufficient stock for ${product.title}`);
      }

      const itemTotal = cartItem.price * cartItem.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product._id,
        title: product.title,
        quantity: cartItem.quantity,
        price: cartItem.price,
        total: itemTotal,
      });
    }

    // Apply coupon discount if present
    let discountAmount = 0;
    let couponId: string | undefined;
    if (cart.couponCode && cart.discountAmount) {
      discountAmount = cart.discountAmount;
      const coupon = await couponService.getCouponByCode(cart.couponCode);
      couponId = coupon._id.toString();
    }

    // Calculate shipping and tax (simplified - in production, use shipping calculator)
    const shippingCost = subtotal > 50000 ? 0 : 1000; // Free shipping over $500, else $10
    const afterDiscount = subtotal - discountAmount;
    const tax = Math.round(afterDiscount * 0.1); // 10% tax on amount after discount
    const total = afterDiscount + shippingCost + tax;

    // Create order
    const order = await Order.create({
      userId,
      items: orderItems,
      subtotal,
      discountAmount,
      shippingCost,
      tax,
      total,
      currency: 'USD',
      couponCode: cart.couponCode,
      couponId: couponId,
      status: 'pending',
      shippingAddress: data.shippingAddress,
      paymentMethod: data.paymentMethod,
      paymentStatus: 'pending',
      notes: data.notes,
    });

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    // Track coupon usage if applied
    if (couponId) {
      await couponService.applyCouponToOrder(couponId, userId, order._id.toString());
    }

    // Clear cart
    cart.items = [];
    cart.couponCode = undefined;
    cart.discountAmount = 0;
    await cart.save();

    return order.populate('items.productId');
  }

  async getOrderById(orderId: string, userId: string, userRole: string): Promise<IOrder> {
    const order = await Order.findById(orderId).populate('items.productId');
    if (!order) {
      throw AppError.notFound('Order not found');
    }

    // Check ownership (users can only see their own orders, admins can see all)
    if (userRole !== 'admin' && order.userId.toString() !== userId) {
      throw AppError.forbidden('You can only view your own orders');
    }

    return order;
  }

  async listOrders(userId: string, userRole: string, query: OrderListQuery) {
    const { page, limit, skip } = parsePagination(query);

    // Build filter
    const filter: Record<string, unknown> = {};
    if (userRole !== 'admin') {
      filter.userId = userId;
    }
    if (query.status) {
      filter.status = query.status;
    }

    const [orders, totalItems] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('items.productId'),
      Order.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(page, limit, totalItems);

    return { orders, meta };
  }

  async updateOrderStatus(
    orderId: string,
    data: UpdateOrderStatusDto,
    _userId: string,
    userRole: string
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw AppError.notFound('Order not found');
    }

    // Only admin can update order status
    if (userRole !== 'admin') {
      throw AppError.forbidden('Only admins can update order status');
    }

    // Update status and set timestamps
    const oldStatus = order.status;
    order.status = data.status;

    if (data.status === 'shipped' && oldStatus !== 'shipped') {
      order.shippingInfo = order.shippingInfo || {};
      order.shippingInfo.shippedAt = new Date();
    }

    if (data.status === 'delivered' && oldStatus !== 'delivered') {
      order.shippingInfo = order.shippingInfo || {};
      order.shippingInfo.deliveredAt = new Date();
    }

    if (data.status === 'cancelled' && oldStatus !== 'cancelled') {
      // Restore stock if order is cancelled
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        });
      }
    }

    await order.save();
    return order.populate('items.productId');
  }

  async updateShippingInfo(
    orderId: string,
    data: UpdateShippingInfoDto,
    _userId: string,
    userRole: string
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw AppError.notFound('Order not found');
    }

    // Only admin can update shipping info
    if (userRole !== 'admin') {
      throw AppError.forbidden('Only admins can update shipping info');
    }

    order.shippingInfo = order.shippingInfo || {};
    if (data.carrier) {
      order.shippingInfo.carrier = data.carrier;
    }
    if (data.trackingNumber) {
      order.shippingInfo.trackingNumber = data.trackingNumber;
    }
    if (data.estimatedDelivery) {
      order.shippingInfo.estimatedDelivery = new Date(data.estimatedDelivery);
    }

    // Auto-update status to shipped if tracking number is added
    if (data.trackingNumber && order.status === 'processing') {
      order.status = 'shipped';
      order.shippingInfo.shippedAt = new Date();
    }

    await order.save();
    return order.populate('items.productId');
  }

  async getOrderTracking(orderNumber: string, userId: string, userRole: string): Promise<IOrder> {
    const order = await Order.findOne({ orderNumber }).populate('items.productId');
    if (!order) {
      throw AppError.notFound('Order not found');
    }

    // Check ownership
    if (userRole !== 'admin' && order.userId.toString() !== userId) {
      throw AppError.forbidden('You can only track your own orders');
    }

    return order;
  }
}

export const orderService = new OrderService();

