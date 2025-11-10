import { Request, Response, NextFunction } from 'express';
import { offerService } from './offer.service';
import { CreateOfferDto, UpdateOfferDto, ApplyOfferDto } from './dto/offer.dto';
import { success } from '../../utils/response.util';

export class OfferController {
  async createOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as CreateOfferDto;
      const offer = await offerService.createOffer(data);

      success(
        res,
        {
          id: offer._id.toString(),
          title: offer.title,
          description: offer.description,
          offerType: offer.offerType,
          discountType: offer.discountType,
          discountValue: offer.discountValue,
          minPurchaseAmount: offer.minPurchaseAmount,
          maxDiscountAmount: offer.maxDiscountAmount,
          flashSaleStart: offer.flashSaleStart,
          flashSaleEnd: offer.flashSaleEnd,
          flashSaleStockLimit: offer.flashSaleStockLimit,
          bogoBuyQuantity: offer.bogoBuyQuantity,
          bogoGetQuantity: offer.bogoGetQuantity,
          bogoProductId: offer.bogoProductId?.toString(),
          applicableCategories: offer.applicableCategories,
          applicableProducts: offer.applicableProducts?.map((p) => p.toString()),
          bundleProducts: offer.bundleProducts?.map((bp) => ({
            productId: bp.productId.toString(),
            quantity: bp.quantity,
          })),
          bundlePrice: offer.bundlePrice,
          freeShippingMinAmount: offer.freeShippingMinAmount,
          validFrom: offer.validFrom,
          validUntil: offer.validUntil,
          isActive: offer.isActive,
          priority: offer.priority,
          usageCount: offer.usageCount,
          createdAt: offer.createdAt,
          updatedAt: offer.updatedAt,
        },
        201
      );
    } catch (err) {
      next(err);
    }
  }

  async getOfferById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const offer = await offerService.getOfferById(req.params.id);

      success(res, {
        id: offer._id.toString(),
        title: offer.title,
        description: offer.description,
        offerType: offer.offerType,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        minPurchaseAmount: offer.minPurchaseAmount,
        maxDiscountAmount: offer.maxDiscountAmount,
        flashSaleStart: offer.flashSaleStart,
        flashSaleEnd: offer.flashSaleEnd,
        flashSaleStockLimit: offer.flashSaleStockLimit,
        bogoBuyQuantity: offer.bogoBuyQuantity,
        bogoGetQuantity: offer.bogoGetQuantity,
        bogoProductId: offer.bogoProductId?.toString(),
        applicableCategories: offer.applicableCategories,
        applicableProducts: offer.applicableProducts?.map((p: any) => ({
          id: p._id?.toString() || p.toString(),
          title: p.title,
          price: p.price,
        })),
        bundleProducts: offer.bundleProducts?.map((bp: any) => ({
          productId: bp.productId._id?.toString() || bp.productId.toString(),
          product: bp.productId.title ? { title: bp.productId.title, price: bp.productId.price } : undefined,
          quantity: bp.quantity,
        })),
        bundlePrice: offer.bundlePrice,
        freeShippingMinAmount: offer.freeShippingMinAmount,
        validFrom: offer.validFrom,
        validUntil: offer.validUntil,
        isActive: offer.isActive,
        priority: offer.priority,
        usageCount: offer.usageCount,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async listOffers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = {
        page: req.query.page ? parseInt(String(req.query.page), 10) : undefined,
        limit: req.query.limit ? parseInt(String(req.query.limit), 10) : undefined,
        offerType: req.query.offerType ? String(req.query.offerType) : undefined,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        category: req.query.category ? String(req.query.category) : undefined,
        productId: req.query.productId ? String(req.query.productId) : undefined,
      };

      const { offers, meta } = await offerService.listOffers(query);

      success(
        res,
        offers.map((offer) => ({
          id: offer._id.toString(),
          title: offer.title,
          description: offer.description,
          offerType: offer.offerType,
          discountType: offer.discountType,
          discountValue: offer.discountValue,
          minPurchaseAmount: offer.minPurchaseAmount,
          maxDiscountAmount: offer.maxDiscountAmount,
          flashSaleStart: offer.flashSaleStart,
          flashSaleEnd: offer.flashSaleEnd,
          flashSaleStockLimit: offer.flashSaleStockLimit,
          bogoBuyQuantity: offer.bogoBuyQuantity,
          bogoGetQuantity: offer.bogoGetQuantity,
          bogoProductId: offer.bogoProductId?.toString(),
          applicableCategories: offer.applicableCategories,
          applicableProducts: offer.applicableProducts?.map((p: any) => ({
            id: p._id?.toString() || p.toString(),
            title: p.title,
            price: p.price,
          })),
          bundleProducts: offer.bundleProducts?.map((bp: any) => ({
            productId: bp.productId._id?.toString() || bp.productId.toString(),
            product: bp.productId.title ? { title: bp.productId.title, price: bp.productId.price } : undefined,
            quantity: bp.quantity,
          })),
          bundlePrice: offer.bundlePrice,
          freeShippingMinAmount: offer.freeShippingMinAmount,
          validFrom: offer.validFrom,
          validUntil: offer.validUntil,
          isActive: offer.isActive,
          priority: offer.priority,
          usageCount: offer.usageCount,
          createdAt: offer.createdAt,
          updatedAt: offer.updatedAt,
        })),
        200,
        meta as unknown as Record<string, unknown>
      );
    } catch (err) {
      next(err);
    }
  }

  async getActiveOffers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const offers = await offerService.getActiveOffers();

      success(
        res,
        offers.map((offer) => ({
          id: offer._id.toString(),
          title: offer.title,
          description: offer.description,
          offerType: offer.offerType,
          discountType: offer.discountType,
          discountValue: offer.discountValue,
          minPurchaseAmount: offer.minPurchaseAmount,
          maxDiscountAmount: offer.maxDiscountAmount,
          flashSaleStart: offer.flashSaleStart,
          flashSaleEnd: offer.flashSaleEnd,
          flashSaleStockLimit: offer.flashSaleStockLimit,
          bogoBuyQuantity: offer.bogoBuyQuantity,
          bogoGetQuantity: offer.bogoGetQuantity,
          bogoProductId: offer.bogoProductId?.toString(),
          applicableCategories: offer.applicableCategories,
          applicableProducts: offer.applicableProducts?.map((p: any) => ({
            id: p._id?.toString() || p.toString(),
            title: p.title,
            price: p.price,
          })),
          bundleProducts: offer.bundleProducts?.map((bp: any) => ({
            productId: bp.productId._id?.toString() || bp.productId.toString(),
            product: bp.productId.title ? { title: bp.productId.title, price: bp.productId.price } : undefined,
            quantity: bp.quantity,
          })),
          bundlePrice: offer.bundlePrice,
          freeShippingMinAmount: offer.freeShippingMinAmount,
          validFrom: offer.validFrom,
          validUntil: offer.validUntil,
          priority: offer.priority,
        })),
        200
      );
    } catch (err) {
      next(err);
    }
  }

  async updateOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as UpdateOfferDto;
      const offer = await offerService.updateOffer(req.params.id, data);

      success(res, {
        id: offer._id.toString(),
        title: offer.title,
        description: offer.description,
        offerType: offer.offerType,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        minPurchaseAmount: offer.minPurchaseAmount,
        maxDiscountAmount: offer.maxDiscountAmount,
        flashSaleStart: offer.flashSaleStart,
        flashSaleEnd: offer.flashSaleEnd,
        flashSaleStockLimit: offer.flashSaleStockLimit,
        bogoBuyQuantity: offer.bogoBuyQuantity,
        bogoGetQuantity: offer.bogoGetQuantity,
        bogoProductId: offer.bogoProductId?.toString(),
        applicableCategories: offer.applicableCategories,
        applicableProducts: offer.applicableProducts?.map((p) => p.toString()),
        bundleProducts: offer.bundleProducts?.map((bp) => ({
          productId: bp.productId.toString(),
          quantity: bp.quantity,
        })),
        bundlePrice: offer.bundlePrice,
        freeShippingMinAmount: offer.freeShippingMinAmount,
        validFrom: offer.validFrom,
        validUntil: offer.validUntil,
        isActive: offer.isActive,
        priority: offer.priority,
        usageCount: offer.usageCount,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await offerService.deleteOffer(req.params.id);

      success(res, { message: 'Offer deleted successfully' }, 200);
    } catch (err) {
      next(err);
    }
  }

  async applyOffers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as ApplyOfferDto;
      const cartItems = req.body.cartItems || [];

      const result = await offerService.applyOffersToCart(cartItems, data.totalAmount);

      success(res, {
        applicableOffers: result.applicableOffers.map((ao) => ({
          offerId: ao.offer._id.toString(),
          title: ao.offer.title,
          description: ao.description,
          discountAmount: ao.discountAmount,
          offerType: ao.offer.offerType,
        })),
        totalDiscount: result.totalDiscount,
        freeShipping: result.freeShipping,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const offerController = new OfferController();

