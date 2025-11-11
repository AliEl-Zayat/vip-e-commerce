import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import { createApp } from '../../app';
import { User } from '../users/user.model';
import { Product } from '../products/product.model';
import { Coupon } from './coupon.model';
import { Cart } from '../cart/cart.model';
import bcrypt from 'bcryptjs';
import { generateAccessToken } from '../auth/token.util';

describe('Coupon Module', () => {
  let app: Express;
  let adminToken: string;
  let customerToken: string;
  let customerId: string;
  let productId: string;

  beforeAll(async () => {
    app = createApp();
  });

  beforeEach(async () => {
    const admin = await User.create({
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Admin User',
      role: 'admin',
    });
    adminToken = generateAccessToken(admin);

    const customer = await User.create({
      email: 'customer@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Customer User',
      role: 'customer',
    });
    customerId = customer._id.toString();
    customerToken = generateAccessToken(customer);

    const seller = await User.create({
      email: 'seller@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Seller User',
      role: 'seller',
    });

    const product = await Product.create({
      title: 'Test Product',
      slug: 'test-product',
      description: 'Test Description',
      price: 10000, // $100
      currency: 'USD',
      stock: 10,
      category: 'Electronics',
      tags: ['test'],
      sellerId: seller._id,
    });
    productId = product._id.toString();
  });

  afterEach(async () => {
    await Coupon.deleteMany({});
    await Cart.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/v1/coupons', () => {
    it('should create coupon successfully as admin', async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      const response = await request(app)
        .post('/api/v1/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'SAVE20',
          description: 'Save 20%',
          discountType: 'percentage',
          discountValue: 20,
          validUntil: validUntil.toISOString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('SAVE20');
      expect(response.body.data.discountType).toBe('percentage');
      expect(response.body.data.discountValue).toBe(20);
    });

    it('should create fixed amount coupon', async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      const response = await request(app)
        .post('/api/v1/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'FIXED10',
          discountType: 'fixed',
          discountValue: 1000, // $10
          validUntil: validUntil.toISOString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.discountType).toBe('fixed');
      expect(response.body.data.discountValue).toBe(1000);
    });

    it('should reject duplicate coupon code', async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      await Coupon.create({
        code: 'DUPLICATE',
        discountType: 'percentage',
        discountValue: 10,
        validUntil,
      });

      const response = await request(app)
        .post('/api/v1/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'DUPLICATE',
          discountType: 'percentage',
          discountValue: 10,
          validUntil: validUntil.toISOString(),
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already exists');
    });

    it('should reject coupon creation by non-admin', async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      const response = await request(app)
        .post('/api/v1/coupons')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          code: 'TEST',
          discountType: 'percentage',
          discountValue: 10,
          validUntil: validUntil.toISOString(),
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/coupons', () => {
    beforeEach(async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      await Coupon.create([
        {
          code: 'ACTIVE',
          discountType: 'percentage',
          discountValue: 20,
          validUntil,
          isActive: true,
        },
        {
          code: 'INACTIVE',
          discountType: 'percentage',
          discountValue: 15,
          validUntil,
          isActive: false,
        },
      ]);
    });

    it('should list all coupons', async () => {
      const response = await request(app).get('/api/v1/coupons').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by active status', async () => {
      const response = await request(app).get('/api/v1/coupons?isActive=true').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((c: { isActive: boolean }) => c.isActive)).toBe(true);
    });
  });

  describe('POST /api/v1/coupons/validate', () => {
    let couponCode: string;

    beforeEach(async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      const coupon = await Coupon.create({
        code: 'VALID20',
        discountType: 'percentage',
        discountValue: 20,
        validUntil,
        isActive: true,
      });
      couponCode = coupon.code;

      await Cart.create({
        userId: customerId,
        items: [
          {
            productId,
            quantity: 2,
            price: 10000,
          },
        ],
      });
    });

    it('should validate valid coupon', async () => {
      const response = await request(app)
        .post('/api/v1/coupons/validate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          code: couponCode,
          cartItems: [
            {
              productId,
              quantity: 2,
              price: 10000,
            },
          ],
          totalAmount: 20000,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.discountAmount).toBe(4000); // 20% of 20000
    });

    it('should reject expired coupon', async () => {
      const expiredCoupon = await Coupon.create({
        code: 'EXPIRED',
        discountType: 'percentage',
        discountValue: 20,
        validUntil: new Date('2020-01-01'),
        isActive: true,
      });

      const response = await request(app)
        .post('/api/v1/coupons/validate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          code: expiredCoupon.code,
          cartItems: [
            {
              productId,
              quantity: 1,
              price: 10000,
            },
          ],
          totalAmount: 10000,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.error).toContain('expired');
    });

    it('should reject coupon below minimum purchase', async () => {
      const coupon = await Coupon.create({
        code: 'MIN50',
        discountType: 'percentage',
        discountValue: 20,
        minPurchaseAmount: 50000, // $500
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
      });

      const response = await request(app)
        .post('/api/v1/coupons/validate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          code: coupon.code,
          cartItems: [
            {
              productId,
              quantity: 1,
              price: 10000,
            },
          ],
          totalAmount: 10000, // $100, below minimum
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.error).toContain('Minimum purchase');
    });
  });

  describe('POST /api/v1/cart/coupon', () => {
    beforeEach(async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      await Coupon.create({
        code: 'CART20',
        discountType: 'percentage',
        discountValue: 20,
        validUntil,
        isActive: true,
      });

      await Cart.create({
        userId: customerId,
        items: [
          {
            productId,
            quantity: 2,
            price: 10000,
          },
        ],
      });
    });

    it('should apply coupon to cart', async () => {
      const response = await request(app)
        .post('/api/v1/cart/coupon')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          code: 'CART20',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.couponCode).toBe('CART20');
      expect(response.body.data.discountAmount).toBeGreaterThan(0);
      expect(response.body.data.total).toBeLessThan(response.body.data.subtotal);
    });

    it('should reject invalid coupon', async () => {
      const response = await request(app)
        .post('/api/v1/cart/coupon')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          code: 'INVALID',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
