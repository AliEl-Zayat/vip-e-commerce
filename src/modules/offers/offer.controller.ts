import { Request, Response, NextFunction } from 'express';
import { offerService } from './offer.service';
import { CreateOfferDto, UpdateOfferDto, ApplyOfferDto } from './dto/offer.dto';
import { success } from '../../utils/response.util';
import { mapOfferToDto, OfferDto } from './offer.types';

export class OfferController {
  async createOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as CreateOfferDto;
      const offer = await offerService.createOffer(data);

      success(res, mapOfferToDto(offer), 201);
    } catch (err) {
      next(err);
    }
  }

  async getOfferById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const offer = await offerService.getOfferById(req.params.id);

      success(res, mapOfferToDto(offer));
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
        isActive:
          req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        category: req.query.category ? String(req.query.category) : undefined,
        productId: req.query.productId ? String(req.query.productId) : undefined,
      };

      const { offers, meta } = await offerService.listOffers(query);

      success(res, offers.map(mapOfferToDto), 200, meta as unknown as Record<string, unknown>);
    } catch (err) {
      next(err);
    }
  }

  async getActiveOffers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const offers = await offerService.getActiveOffers();
      const activeOffers = offers.map(mapOfferToDto);

      success(res, activeOffers as OfferDto[], 200);
    } catch (err) {
      next(err);
    }
  }

  async updateOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as UpdateOfferDto;
      const offer = await offerService.updateOffer(req.params.id, data);

      success(res, mapOfferToDto(offer));
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
        applicableOffers: result.applicableOffers.map(ao => ({
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
