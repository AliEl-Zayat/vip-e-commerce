import type { Types } from 'mongoose';
import type { IOffer, OfferType, DiscountType } from './offer.model';
import type { IProduct } from '../products/product.model';

export interface OfferProductSummary {
  id: string;
  title?: string;
  price?: number;
}

export interface OfferBundleProductSummary {
  productId: string;
  product?: OfferProductSummary;
  quantity: number;
}

export interface OfferDto {
  id: string;
  title: string;
  description?: string;
  offerType: OfferType;
  discountType: DiscountType;
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  flashSaleStart?: Date;
  flashSaleEnd?: Date;
  flashSaleStockLimit?: number;
  bogoBuyQuantity?: number;
  bogoGetQuantity?: number;
  bogoProduct?: OfferProductSummary;
  applicableCategories?: string[];
  applicableProducts?: OfferProductSummary[];
  bundleProducts?: OfferBundleProductSummary[];
  bundlePrice?: number;
  freeShippingMinAmount?: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  priority: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const isProductDocument = (value: unknown): value is IProduct => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record._id !== 'undefined' && typeof record.title === 'string';
};

const toProductSummary = (
  product: Types.ObjectId | IProduct | undefined | null
): OfferProductSummary | undefined => {
  if (!product) {
    return undefined;
  }

  if (isProductDocument(product)) {
    return {
      id: product._id.toString(),
      title: product.title,
      price: product.price,
    };
  }

  return {
    id: product.toString(),
  };
};

const toBundleSummary = (bundle: {
  productId: Types.ObjectId | IProduct;
  quantity: number;
}): OfferBundleProductSummary => {
  const productSummary = toProductSummary(bundle.productId);
  return {
    productId: productSummary?.id ?? bundle.productId.toString(),
    product: productSummary,
    quantity: bundle.quantity,
  };
};

export const mapOfferToDto = (offer: IOffer): OfferDto => ({
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
  bogoProduct: toProductSummary(offer.bogoProductId as Types.ObjectId | IProduct | undefined),
  applicableCategories: offer.applicableCategories,
  applicableProducts: offer.applicableProducts
    ? offer.applicableProducts
        .map(product => toProductSummary(product as Types.ObjectId | IProduct))
        .filter((product): product is OfferProductSummary => Boolean(product))
    : undefined,
  bundleProducts: offer.bundleProducts
    ? offer.bundleProducts.map(bundle => toBundleSummary(bundle))
    : undefined,
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
