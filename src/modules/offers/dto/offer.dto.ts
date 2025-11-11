import { z } from 'zod';

const bundleProductSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const createOfferSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
    description: z.string().optional(),
    offerType: z.enum(['flash_sale', 'bogo', 'category_discount', 'product_discount', 'bundle', 'free_shipping']),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().positive('Discount value must be positive'),
    minPurchaseAmount: z.number().min(0).optional(),
    maxDiscountAmount: z.number().min(0).optional(),
    flashSaleStart: z.string().datetime().optional(),
    flashSaleEnd: z.string().datetime().optional(),
    flashSaleStockLimit: z.number().int().min(0).optional(),
    bogoBuyQuantity: z.number().int().positive().optional(),
    bogoGetQuantity: z.number().int().positive().optional(),
    bogoProductId: z.string().optional(),
    applicableCategories: z.array(z.string()).optional(),
    applicableProducts: z.array(z.string()).optional(),
    bundleProducts: z.array(bundleProductSchema).optional(),
    bundlePrice: z.number().min(0).optional(),
    freeShippingMinAmount: z.number().min(0).optional(),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime(),
    isActive: z.boolean().default(true),
    priority: z.number().int().default(0),
  })
  .refine(
    (data) => {
      if (data.offerType === 'flash_sale') {
        return data.flashSaleStart && data.flashSaleEnd;
      }
      return true;
    },
    {
      message: 'Flash sale requires start and end dates',
      path: ['flashSaleStart'],
    }
  )
  .refine(
    (data) => {
      if (data.offerType === 'bogo') {
        return data.bogoBuyQuantity && data.bogoGetQuantity;
      }
      return true;
    },
    {
      message: 'BOGO offer requires buy and get quantities',
      path: ['bogoBuyQuantity'],
    }
  )
  .refine(
    (data) => {
      if (data.offerType === 'bundle') {
        return data.bundleProducts && data.bundleProducts.length >= 2 && data.bundlePrice;
      }
      return true;
    },
    {
      message: 'Bundle offer requires at least 2 products and bundle price',
      path: ['bundleProducts'],
    }
  )
  .refine(
    (data) => {
      if (data.offerType === 'category_discount') {
        return data.applicableCategories && data.applicableCategories.length > 0;
      }
      return true;
    },
    {
      message: 'Category discount requires at least one category',
      path: ['applicableCategories'],
    }
  )
  .refine(
    (data) => {
      if (data.offerType === 'product_discount') {
        return data.applicableProducts && data.applicableProducts.length > 0;
      }
      return true;
    },
    {
      message: 'Product discount requires at least one product',
      path: ['applicableProducts'],
    }
  )
  .refine(
    (data) => {
      if (data.offerType === 'free_shipping') {
        return data.freeShippingMinAmount !== undefined;
      }
      return true;
    },
    {
      message: 'Free shipping offer requires minimum amount',
      path: ['freeShippingMinAmount'],
    }
  );

export const updateOfferSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  discountValue: z.number().positive().optional(),
  minPurchaseAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  flashSaleStart: z.string().datetime().optional(),
  flashSaleEnd: z.string().datetime().optional(),
  flashSaleStockLimit: z.number().int().min(0).optional(),
  bogoBuyQuantity: z.number().int().positive().optional(),
  bogoGetQuantity: z.number().int().positive().optional(),
  bogoProductId: z.string().optional(),
  applicableCategories: z.array(z.string()).optional(),
  applicableProducts: z.array(z.string()).optional(),
  bundleProducts: z.array(bundleProductSchema).optional(),
  bundlePrice: z.number().min(0).optional(),
  freeShippingMinAmount: z.number().min(0).optional(),
  validUntil: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().optional(),
});

export const applyOfferSchema = z.object({
  productIds: z.array(z.string()).optional(),
  category: z.string().optional(),
  totalAmount: z.number().min(0),
});

export type CreateOfferDto = z.infer<typeof createOfferSchema>;
export type UpdateOfferDto = z.infer<typeof updateOfferSchema>;
export type ApplyOfferDto = z.infer<typeof applyOfferSchema>;


