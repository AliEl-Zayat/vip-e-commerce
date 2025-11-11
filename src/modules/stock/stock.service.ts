import mongoose from 'mongoose';
import { Product } from '../products/product.model';
import { StockHistory, StockAlert, IStockHistory, IStockAlert } from './stock.model';
import { UpdateStockDto, CreateStockAlertDto, UpdateStockAlertDto } from './dto/stock.dto';
import { AppError } from '../../utils/error.util';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.util';

export class StockService {
  async updateStock(
    productId: string,
    data: UpdateStockDto,
    userId?: string
  ): Promise<{ product: any; history: IStockHistory }> {
    const product = await Product.findById(productId);
    if (!product) {
      throw AppError.notFound('Product not found');
    }

    const previousStock = product.stock;
    const newStock = previousStock + data.quantity;

    if (newStock < 0) {
      throw AppError.badRequest('Insufficient stock');
    }

    // Update product stock
    product.stock = newStock;
    await product.save();

    // Create stock history record
    const history = await StockHistory.create({
      productId: new mongoose.Types.ObjectId(productId),
      changeType: data.changeType,
      quantity: data.quantity,
      previousStock,
      newStock,
      reason: data.reason,
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
    });

    // Check if stock is below threshold and trigger alert if needed
    await this.checkLowStockAlert(productId);

    return { product, history };
  }

  async getStockHistory(productId: string, page?: number, limit?: number) {
    const { skip, limit: queryLimit } = parsePagination({ page, limit });

    const [history, totalItems] = await Promise.all([
      StockHistory.find({ productId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(queryLimit)
        .populate('userId', 'name email')
        .populate('orderId', 'orderNumber'),
      StockHistory.countDocuments({ productId }),
    ]);

    const meta = buildPaginationMeta(page || 1, queryLimit, totalItems);

    return { history, meta };
  }

  async createStockAlert(data: CreateStockAlertDto, _userId: string): Promise<IStockAlert> {
    const product = await Product.findById(data.productId);
    if (!product) {
      throw AppError.notFound('Product not found');
    }

    const existingAlert = await StockAlert.findOne({ productId: data.productId });
    if (existingAlert) {
      throw AppError.conflict('Stock alert already exists for this product');
    }

    const alert = await StockAlert.create({
      productId: new mongoose.Types.ObjectId(data.productId),
      threshold: data.threshold,
    });

    // Check if stock is already below threshold
    await this.checkLowStockAlert(data.productId);

    return alert;
  }

  async updateStockAlert(alertId: string, data: UpdateStockAlertDto): Promise<IStockAlert> {
    const alert = await StockAlert.findByIdAndUpdate(
      alertId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!alert) {
      throw AppError.notFound('Stock alert not found');
    }

    // Reset notification if threshold changed
    if (data.threshold !== undefined) {
      alert.notifiedAt = undefined;
      await alert.save();
      await this.checkLowStockAlert(alert.productId.toString());
    }

    return alert;
  }

  async getStockAlerts(page?: number, limit?: number, isActive?: boolean) {
    const { skip, limit: queryLimit } = parsePagination({ page, limit });

    const filter: Record<string, unknown> = {};
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const [alerts, totalItems] = await Promise.all([
      StockAlert.find(filter)
        .populate('productId', 'title slug stock')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(queryLimit),
      StockAlert.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(page || 1, queryLimit, totalItems);

    return { alerts, meta };
  }

  async checkLowStockAlert(productId: string): Promise<boolean> {
    const product = await Product.findById(productId);
    if (!product) {
      return false;
    }

    const alert = await StockAlert.findOne({ productId, isActive: true });
    if (!alert) {
      return false;
    }

    const isLowStock = product.stock <= alert.threshold;
    const shouldNotify = isLowStock && (!alert.notifiedAt || this.shouldRenotify(alert.notifiedAt));

    if (shouldNotify) {
      alert.notifiedAt = new Date();
      await alert.save();
      // Trigger notification (will be handled by notification service)
      return true;
    }

    return false;
  }

  async getLowStockProducts(threshold?: number): Promise<any[]> {
    const filter: Record<string, unknown> = { stock: { $gt: 0 } };
    
    if (threshold !== undefined) {
      filter.stock = { $lte: threshold };
    } else {
      // Get products with active alerts below threshold
      const alerts = await StockAlert.find({ isActive: true }).populate('productId');
      const productIds = alerts
        .filter((alert: any) => alert.productId && alert.productId.stock <= alert.threshold)
        .map((alert: any) => alert.productId._id);
      
      if (productIds.length === 0) {
        return [];
      }
      
      filter._id = { $in: productIds };
    }

    const products = await Product.find(filter).select('title slug stock');
    return products;
  }

  private shouldRenotify(notifiedAt: Date): boolean {
    // Re-notify if last notification was more than 24 hours ago
    const hoursSinceNotification = (Date.now() - notifiedAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceNotification >= 24;
  }

  async deleteStockAlert(alertId: string): Promise<void> {
    const alert = await StockAlert.findByIdAndDelete(alertId);
    if (!alert) {
      throw AppError.notFound('Stock alert not found');
    }
  }
}

export const stockService = new StockService();

