import mongoose from 'mongoose';
import { Offer, IOffer } from './offer.model';
import { CreateOfferDto, UpdateOfferDto, ApplyOfferDto } from './dto/offer.dto';
import { AppError } from '../../utils/error.util';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.util';
import { Product } from '../products/product.model';

export interface OfferListQuery {
  page?: number;
  limit?: number;
  offerType?: string;
  isActive?: boolean;
  category?: string;
  productId?: string;
}

export interface OfferApplicationResult {
  applicableOffers: Array<{
    offer: IOffer;
    discountAmount: number;
    description: string;
  }>;
  totalDiscount: number;
  freeShipping: boolean;
}

export class OfferService {
  async createOffer(data: CreateOfferDto): Promise<IOffer> {
    // Validate discount value
    if (data.discountType === 'percentage' && data.discountValue > 100) {
      throw AppError.badRequest('Percentage discount cannot exceed 100%');
    }

    // Validate products exist if specified
    if (data.applicableProducts && data.applicableProducts.length > 0) {
      const products = await Product.find({
        _id: { $in: data.applicableProducts },
      });
      if (products.length !== data.applicableProducts.length) {
        throw AppError.badRequest('Some products do not exist');
      }
    }

    // Validate bundle products exist
    if (data.bundleProducts && data.bundleProducts.length > 0) {
      const bundleProductIds = data.bundleProducts.map((bp) => bp.productId);
      const products = await Product.find({
        _id: { $in: bundleProductIds },
      });
      if (products.length !== bundleProductIds.length) {
        throw AppError.badRequest('Some bundle products do not exist');
      }
    }

    // Validate BOGO product exists
    if (data.bogoProductId) {
      const product = await Product.findById(data.bogoProductId);
      if (!product) {
        throw AppError.badRequest('BOGO product does not exist');
      }
    }

    const offerData: Record<string, unknown> = {
      ...data,
      validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
      validUntil: new Date(data.validUntil),
    };

    if (data.flashSaleStart) {
      offerData.flashSaleStart = new Date(data.flashSaleStart);
    }
    if (data.flashSaleEnd) {
      offerData.flashSaleEnd = new Date(data.flashSaleEnd);
    }

    if (data.applicableProducts) {
      offerData.applicableProducts = data.applicableProducts.map((id) => new mongoose.Types.ObjectId(id));
    }

    if (data.bundleProducts) {
      offerData.bundleProducts = data.bundleProducts.map((bp) => ({
        productId: new mongoose.Types.ObjectId(bp.productId),
        quantity: bp.quantity,
      }));
    }

    if (data.bogoProductId) {
      offerData.bogoProductId = new mongoose.Types.ObjectId(data.bogoProductId);
    }

    const offer = await Offer.create(offerData);
    return offer;
  }

  async getOfferById(id: string): Promise<IOffer> {
    const offer = await Offer.findById(id)
      .populate('applicableProducts', 'title price')
      .populate('bundleProducts.productId', 'title price')
      .populate('bogoProductId', 'title price');
    if (!offer) {
      throw AppError.notFound('Offer not found');
    }
    return offer;
  }

  async listOffers(query: OfferListQuery) {
    const { page, limit, skip } = parsePagination(query);

    const filter: Record<string, unknown> = {};

    if (query.offerType) {
      filter.offerType = query.offerType;
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.category) {
      filter.applicableCategories = { $in: [query.category] };
    }

    if (query.productId) {
      filter.$or = [
        { applicableProducts: new mongoose.Types.ObjectId(query.productId) },
        { 'bundleProducts.productId': new mongoose.Types.ObjectId(query.productId) },
        { bogoProductId: new mongoose.Types.ObjectId(query.productId) },
      ];
    }

    const [offers, totalItems] = await Promise.all([
      Offer.find(filter)
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('applicableProducts', 'title price')
        .populate('bundleProducts.productId', 'title price')
        .populate('bogoProductId', 'title price'),
      Offer.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(page, limit, totalItems);

    return { offers, meta };
  }

  async getActiveOffers(): Promise<IOffer[]> {
    const now = new Date();
    return Offer.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    })
      .sort({ priority: -1, createdAt: -1 })
      .populate('applicableProducts', 'title price')
      .populate('bundleProducts.productId', 'title price')
      .populate('bogoProductId', 'title price');
  }

  async updateOffer(id: string, data: UpdateOfferDto): Promise<IOffer> {
    const offer = await Offer.findById(id);
    if (!offer) {
      throw AppError.notFound('Offer not found');
    }

    // Validate discount value if updating
    if (data.discountValue !== undefined) {
      if (offer.discountType === 'percentage' && data.discountValue > 100) {
        throw AppError.badRequest('Percentage discount cannot exceed 100%');
      }
    }

    // Validate products if updating
    if (data.applicableProducts) {
      const products = await Product.find({
        _id: { $in: data.applicableProducts },
      });
      if (products.length !== data.applicableProducts.length) {
        throw AppError.badRequest('Some products do not exist');
      }
    }

    // Validate bundle products if updating
    if (data.bundleProducts) {
      const bundleProductIds = data.bundleProducts.map((bp) => bp.productId);
      const products = await Product.find({
        _id: { $in: bundleProductIds },
      });
      if (products.length !== bundleProductIds.length) {
        throw AppError.badRequest('Some bundle products do not exist');
      }
    }

    const updateData: Record<string, unknown> = { ...data };

    if (data.validUntil) {
      updateData.validUntil = new Date(data.validUntil);
    }

    if (data.flashSaleStart) {
      updateData.flashSaleStart = new Date(data.flashSaleStart);
    }

    if (data.flashSaleEnd) {
      updateData.flashSaleEnd = new Date(data.flashSaleEnd);
    }

    if (data.applicableProducts) {
      updateData.applicableProducts = data.applicableProducts.map((id) => new mongoose.Types.ObjectId(id));
    }

    if (data.bundleProducts) {
      updateData.bundleProducts = data.bundleProducts.map((bp) => ({
        productId: new mongoose.Types.ObjectId(bp.productId),
        quantity: bp.quantity,
      }));
    }

    if (data.bogoProductId) {
      updateData.bogoProductId = new mongoose.Types.ObjectId(data.bogoProductId);
    }

    const updatedOffer = await Offer.findByIdAndUpdate(id, { $set: updateData }, { new: true });

    if (!updatedOffer) {
      throw AppError.notFound('Offer not found');
    }

    return updatedOffer;
  }

  async deleteOffer(id: string): Promise<void> {
    const offer = await Offer.findByIdAndDelete(id);
    if (!offer) {
      throw AppError.notFound('Offer not found');
    }
  }

  async applyOffersToCart(
    cartItems: Array<{ productId: string; quantity: number; price: number; category?: string }>,
    totalAmount: number
  ): Promise<OfferApplicationResult> {
    const now = new Date();
    const activeOffers = await Offer.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    })
      .sort({ priority: -1 })
      .populate('applicableProducts', 'category')
      .populate('bundleProducts.productId', 'category')
      .populate('bogoProductId', 'category');

    const applicableOffers: Array<{
      offer: IOffer;
      discountAmount: number;
      description: string;
    }> = [];

    let totalDiscount = 0;
    let freeShipping = false;

    const productMap = new Map(
      cartItems.map((item) => [item.productId, { ...item, product: null as any }])
    );

    // Fetch product details for cart items
    const productIds = cartItems.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    products.forEach((product) => {
      const item = productMap.get(product._id.toString());
      if (item) {
        item.product = product;
      }
    });

    for (const offer of activeOffers) {
      let applicable = false;
      let discountAmount = 0;
      let description = '';

      // Check minimum purchase amount
      if (offer.minPurchaseAmount && totalAmount < offer.minPurchaseAmount) {
        continue;
      }

      switch (offer.offerType) {
        case 'flash_sale':
          // Check if flash sale is currently active
          if (offer.flashSaleStart && offer.flashSaleEnd) {
            if (now < offer.flashSaleStart || now > offer.flashSaleEnd) {
              continue;
            }
          }

          // Check if products match
          if (offer.applicableProducts && offer.applicableProducts.length > 0) {
            const applicableProductIds = offer.applicableProducts.map((p: any) => p._id.toString());
            const matchingItems = cartItems.filter((item) => applicableProductIds.includes(item.productId));

            if (matchingItems.length > 0) {
              applicable = true;
              const matchingTotal = matchingItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
              discountAmount = this.calculateDiscount(matchingTotal, offer);
              description = `Flash Sale: ${offer.title}`;
            }
          }
          break;

        case 'category_discount':
          if (offer.applicableCategories && offer.applicableCategories.length > 0) {
            const matchingItems = cartItems.filter((item) => {
              const product = products.find((p) => p._id.toString() === item.productId);
              return product && offer.applicableCategories!.includes(product.category);
            });

            if (matchingItems.length > 0) {
              applicable = true;
              const matchingTotal = matchingItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
              discountAmount = this.calculateDiscount(matchingTotal, offer);
              description = `Category Discount: ${offer.title}`;
            }
          }
          break;

        case 'product_discount':
          if (offer.applicableProducts && offer.applicableProducts.length > 0) {
            const applicableProductIds = offer.applicableProducts.map((p: any) => p._id.toString());
            const matchingItems = cartItems.filter((item) => applicableProductIds.includes(item.productId));

            if (matchingItems.length > 0) {
              applicable = true;
              const matchingTotal = matchingItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
              discountAmount = this.calculateDiscount(matchingTotal, offer);
              description = `Product Discount: ${offer.title}`;
            }
          }
          break;

        case 'bogo':
          if (offer.bogoProductId && offer.bogoBuyQuantity && offer.bogoGetQuantity) {
            const bogoProductId = (offer.bogoProductId as any)._id?.toString() || offer.bogoProductId.toString();
            const cartItem = cartItems.find((item) => item.productId === bogoProductId);

            if (cartItem && cartItem.quantity >= offer.bogoBuyQuantity) {
              applicable = true;
              const freeQuantity = Math.floor(cartItem.quantity / offer.bogoBuyQuantity) * offer.bogoGetQuantity;
              discountAmount = Math.min(freeQuantity, cartItem.quantity) * cartItem.price;
              description = `BOGO: Buy ${offer.bogoBuyQuantity}, Get ${offer.bogoGetQuantity} Free`;
            }
          }
          break;

        case 'bundle':
          if (offer.bundleProducts && offer.bundleProducts.length > 0) {
            const bundleProductIds = offer.bundleProducts.map((bp: any) =>
              bp.productId._id?.toString() || bp.productId.toString()
            );
            const bundleQuantities = new Map(
              offer.bundleProducts.map((bp: any) => [
                bp.productId._id?.toString() || bp.productId.toString(),
                bp.quantity,
              ])
            );

            // Check if all bundle products are in cart with required quantities
            let hasAllProducts = true;
            for (const [productId, requiredQty] of bundleQuantities) {
              const cartItem = cartItems.find((item) => item.productId === productId);
              if (!cartItem || cartItem.quantity < requiredQty) {
                hasAllProducts = false;
                break;
              }
            }

            if (hasAllProducts && offer.bundlePrice) {
              applicable = true;
              const bundleTotal = Array.from(bundleQuantities.entries()).reduce((sum, [productId, qty]) => {
                const cartItem = cartItems.find((item) => item.productId === productId);
                return sum + (cartItem ? cartItem.price * qty : 0);
              }, 0);
              discountAmount = bundleTotal - offer.bundlePrice;
              description = `Bundle Offer: ${offer.title}`;
            }
          }
          break;

        case 'free_shipping':
          if (offer.freeShippingMinAmount && totalAmount >= offer.freeShippingMinAmount) {
            applicable = true;
            freeShipping = true;
            description = `Free Shipping: ${offer.title}`;
          }
          break;
      }

      if (applicable && discountAmount > 0) {
        applicableOffers.push({
          offer,
          discountAmount,
          description,
        });
        totalDiscount += discountAmount;
      }
    }

    // Ensure total discount doesn't exceed total amount
    totalDiscount = Math.min(totalDiscount, totalAmount);

    return {
      applicableOffers,
      totalDiscount,
      freeShipping,
    };
  }

  private calculateDiscount(amount: number, offer: IOffer): number {
    let discount = 0;

    if (offer.discountType === 'percentage') {
      discount = Math.round((amount * offer.discountValue) / 100);
      if (offer.maxDiscountAmount) {
        discount = Math.min(discount, offer.maxDiscountAmount);
      }
    } else {
      discount = offer.discountValue;
    }

    return Math.min(discount, amount);
  }

  async incrementUsageCount(offerId: string): Promise<void> {
    await Offer.findByIdAndUpdate(offerId, { $inc: { usageCount: 1 } });
  }
}

export const offerService = new OfferService();

