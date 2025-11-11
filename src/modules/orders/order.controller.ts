import { Request, Response, NextFunction } from 'express';
import { orderService } from './order.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateShippingInfoDto } from './dto/order.dto';
import { OrderStatus } from './order.model';
import { success } from '../../utils/response.util';

export class OrderController {
  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as CreateOrderDto;
      const order = await orderService.createOrder(req.user._id.toString(), data);

      success(
        res,
        {
          id: order._id.toString(),
          orderNumber: order.orderNumber,
          userId: order.userId.toString(),
          items: order.items,
          subtotal: order.subtotal,
          discountAmount: order.discountAmount,
          shippingCost: order.shippingCost,
          tax: order.tax,
          total: order.total,
          currency: order.currency,
          couponCode: order.couponCode,
          status: order.status,
          shippingAddress: order.shippingAddress,
          shippingInfo: order.shippingInfo,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          notes: order.notes,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
        201
      );
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const order = await orderService.getOrderById(
        req.params.id,
        req.user._id.toString(),
        req.user.role
      );

      success(res, {
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: order.userId.toString(),
        items: order.items,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        tax: order.tax,
        total: order.total,
        currency: order.currency,
        status: order.status,
        shippingAddress: order.shippingAddress,
        shippingInfo: order.shippingInfo,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const query = {
        page: req.query.page ? parseInt(String(req.query.page), 10) : undefined,
        limit: req.query.limit ? parseInt(String(req.query.limit), 10) : undefined,
        status: req.query.status as OrderStatus | undefined,
      };

      const { orders, meta } = await orderService.listOrders(
        req.user._id.toString(),
        req.user.role,
        query
      );

      success(
        res,
        orders.map(order => ({
          id: order._id.toString(),
          orderNumber: order.orderNumber,
          userId: order.userId.toString(),
          items: order.items,
          subtotal: order.subtotal,
          discountAmount: order.discountAmount,
          shippingCost: order.shippingCost,
          tax: order.tax,
          total: order.total,
          currency: order.currency,
          couponCode: order.couponCode,
          status: order.status,
          shippingAddress: order.shippingAddress,
          shippingInfo: order.shippingInfo,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        })),
        200,
        meta as unknown as Record<string, unknown>
      );
    } catch (err) {
      next(err);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as UpdateOrderStatusDto;
      const order = await orderService.updateOrderStatus(
        req.params.id,
        data,
        req.user._id.toString(),
        req.user.role
      );

      success(res, {
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
        shippingInfo: order.shippingInfo,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateShippingInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as UpdateShippingInfoDto;
      const order = await orderService.updateShippingInfo(
        req.params.id,
        data,
        req.user._id.toString(),
        req.user.role
      );

      success(res, {
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
        shippingInfo: order.shippingInfo,
      });
    } catch (err) {
      next(err);
    }
  }

  async trackOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const order = await orderService.getOrderTracking(
        req.params.orderNumber,
        req.user._id.toString(),
        req.user.role
      );

      success(res, {
        orderNumber: order.orderNumber,
        status: order.status,
        shippingAddress: order.shippingAddress,
        shippingInfo: order.shippingInfo,
        estimatedDelivery: order.shippingInfo?.estimatedDelivery,
        shippedAt: order.shippingInfo?.shippedAt,
        deliveredAt: order.shippingInfo?.deliveredAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const orderController = new OrderController();
