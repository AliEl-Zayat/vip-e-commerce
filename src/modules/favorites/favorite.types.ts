import type { HydratedDocument, Types } from 'mongoose';
import type { IFavorite } from './favorite.model';
import type { IProduct } from '../products/product.model';

export type FavoriteDocument = HydratedDocument<IFavorite>;

export type PopulatedFavoriteDocument = FavoriteDocument & {
  productId: IProduct | Types.ObjectId;
};

export interface FavoriteDto {
  id: string;
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    images: Array<{ url: string; id: string }>;
  } | null;
  createdAt: Date;
}

const isProductDocument = (value: unknown): value is IProduct => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record._id !== 'undefined' && typeof record.title === 'string';
};

export const mapFavoriteToDto = (favorite: PopulatedFavoriteDocument): FavoriteDto => {
  const product = favorite.productId;

  const productSummary = isProductDocument(product)
    ? {
        id: product._id.toString(),
        title: product.title,
        slug: product.slug,
        price: product.price,
        images: product.images,
      }
    : null;

  return {
    id: favorite._id.toString(),
    product: productSummary,
    createdAt: favorite.createdAt,
  };
};
