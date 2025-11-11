import type { HydratedDocument } from 'mongoose';
import type { ICart, ICartItem } from './cart.model';
import type { IProduct } from '../products/product.model';

export interface CartItemWithProduct extends Omit<ICartItem, 'productId'> {
  productId: IProduct;
}

export type CartDocument = HydratedDocument<ICart>;

export type PopulatedCartDocument = CartDocument & {
  items: Array<CartItemWithProduct | ICartItem>;
  discountAmount?: number;
  couponCode?: string;
};

export const isCartItemWithProduct = (
  item: ICartItem | CartItemWithProduct
): item is CartItemWithProduct => {
  const product = (item as CartItemWithProduct).productId as unknown;
  return (
    Boolean(product) &&
    typeof product === 'object' &&
    'title' in (product as Record<string, unknown>)
  );
};
