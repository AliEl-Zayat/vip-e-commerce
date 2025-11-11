import { Request, Response, NextFunction } from 'express';
import { stockService } from './stock.service';
import { UpdateStockDto, CreateStockAlertDto, UpdateStockAlertDto } from './dto/stock.dto';
import { success } from '../../utils/response.util';

export class StockController {
  async updateStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as UpdateStockDto;
      const { product, history } = await stockService.updateStock(
        req.params.productId,
        data,
        req.user._id.toString()
      );

      success(res, {
        product: {
          id: product._id.toString(),
          title: product.title,
          stock: product.stock,
        },
        history: {
          id: history._id.toString(),
          changeType: history.changeType,
          quantity: history.quantity,
          previousStock: history.previousStock,
          newStock: history.newStock,
          reason: history.reason,
          createdAt: history.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getStockHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

      const { history, meta } = await stockService.getStockHistory(req.params.productId, page, limit);

      success(
        res,
        history.map((h) => ({
          id: h._id.toString(),
          changeType: h.changeType,
          quantity: h.quantity,
          previousStock: h.previousStock,
          newStock: h.newStock,
          reason: h.reason,
          orderId: h.orderId?.toString(),
          userId: h.userId ? (h.userId as any).name : undefined,
          createdAt: h.createdAt,
        })),
        200,
        meta as unknown as Record<string, unknown>
      );
    } catch (err) {
      next(err);
    }
  }

  async createStockAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as CreateStockAlertDto;
      const alert = await stockService.createStockAlert(data, req.user._id.toString());

      success(
        res,
        {
          id: alert._id.toString(),
          productId: alert.productId.toString(),
          threshold: alert.threshold,
          isActive: alert.isActive,
          createdAt: alert.createdAt,
        },
        201
      );
    } catch (err) {
      next(err);
    }
  }

  async updateStockAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as UpdateStockAlertDto;
      const alert = await stockService.updateStockAlert(req.params.id, data);

      success(res, {
        id: alert._id.toString(),
        productId: alert.productId.toString(),
        threshold: alert.threshold,
        isActive: alert.isActive,
        notifiedAt: alert.notifiedAt,
        updatedAt: alert.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStockAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

      const { alerts, meta } = await stockService.getStockAlerts(page, limit, isActive);

      success(
        res,
        alerts.map((alert: any) => ({
          id: alert._id.toString(),
          product: alert.productId
            ? {
                id: alert.productId._id.toString(),
                title: alert.productId.title,
                slug: alert.productId.slug,
                stock: alert.productId.stock,
              }
            : null,
          threshold: alert.threshold,
          isActive: alert.isActive,
          notifiedAt: alert.notifiedAt,
          createdAt: alert.createdAt,
        })),
        200,
        meta as unknown as Record<string, unknown>
      );
    } catch (err) {
      next(err);
    }
  }

  async getLowStockProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const threshold = req.query.threshold ? parseInt(String(req.query.threshold), 10) : undefined;
      const products = await stockService.getLowStockProducts(threshold);

      success(
        res,
        products.map((product: any) => ({
          id: product._id.toString(),
          title: product.title,
          slug: product.slug,
          stock: product.stock,
        }))
      );
    } catch (err) {
      next(err);
    }
  }

  async deleteStockAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await stockService.deleteStockAlert(req.params.id);
      success(res, { message: 'Stock alert deleted successfully' }, 200);
    } catch (err) {
      next(err);
    }
  }
}

export const stockController = new StockController();

