import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import { createApp } from '../../app';
import { User } from '../users/user.model';
import { Product } from '../products/product.model';
import { Offer } from './offer.model';
import bcrypt from 'bcryptjs';
import { generateAccessToken } from '../auth/token.util';

describe('Offer Module', () => {
  let app: Express;
  let adminToken: string;
  let customerToken: string;
  let productId: string;
  let productId2: string;
  let productId3: string;

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

    const product2 = await Product.create({
      title: 'Test Product 2',
      slug: 'test-product-2',
      description: 'Test Description 2',
      price: 5000, // $50
      currency: 'USD',
      stock: 10,
      category: 'Clothing',
      tags: ['test'],
      sellerId: seller._id,
    });
    productId2 = product2._id.toString();

    const product3 = await Product.create({
      title: 'Test Product 3',
      slug: 'test-product-3',
      description: 'Test Description 3',
      price: 2000, // $20
      currency: 'USD',
      stock: 10,
      category: 'Electronics',
      tags: ['test'],
      sellerId: seller._id,
    });
    productId3 = product3._id.toString();
  });

  afterEach(async () => {
    await Offer.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/v1/offers', () => {
    it('should create flash sale offer successfully as admin', async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);
      const flashSaleEnd = new Date();
      flashSaleEnd.setDate(flashSaleEnd.getDate() + 7);

      const response = await request(app)
        .post('/api/v1/offers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Flash Sale - Electronics',
          description: '50% off on electronics',
          offerType: 'flash_sale',
          discountType: 'percentage',
          discountValue: 50,
          flashSaleStart: new Date().toISOString(),
          flashSaleEnd: flashSaleEnd.toISOString(),
          applicableProducts: [productId],
          validUntil: validUntil.toISOString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Flash Sale - Electronics');
      expect(response.body.data.offerType).toBe('flash_sale');
      expect(response.body.data.discountType).toBe('percentage');
      expect(response.body.data.discountValue).toBe(50);
    });

    it('should create category discount offer', async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      const response = await request(app)
        .post('/api/v1/offers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Electronics Sale',
          offerType: 'category_discount',
          discountType: 'percentage',
          discountValue: 20,
          applicableCategories: ['Electronics'],
          validUntil: validUntil.toISOString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.offerType).toBe('category_discount');
      expect(response.body.data.applicableCategories).toContain('Electronics');
    });

    it('should create BOGO offer', async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      const response = await request(app)
        .post('/api/v1/offers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Buy 2 Get 1 Free',
          offerType: 'bogo',
          discountType: 'percentage',
          discountValue: 0,
          bogoBuyQuantity: 2,
          bogoGetQuantity: 1,
          bogoProductId: productId,
          validUntil: validUntil.toISOString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.offerType).toBe('bogo');
      expect(response.body.data.bogoBuyQuantity).toBe(2);
      expect(response.body.data.bogoGetQuantity).toBe(1);
    });

    it('should create bundle offer', async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      const response = await request(app)
        .post('/api/v1/offers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Electronics Bundle',
          offerType: 'bundle',
          discountType: 'fixed',
          discountValue: 0,
          bundleProducts: [
            { productId: productId, quantity: 1 },
            { productId: productId3, quantity: 1 },
          ],
          bundlePrice: 11000, // $110 for both
          validUntil: validUntil.toISOString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.offerType).toBe('bundle');
      expect(response.body.data.bundleProducts).toHaveLength(2);
      expect(response.body.data.bundlePrice).toBe(11000);
    });

    it('should create free shipping offer', async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      const response = await request(app)
        .post('/api/v1/offers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Free Shipping Over $50',
          offerType: 'free_shipping',
          discountType: 'fixed',
          discountValue: 0,
          freeShippingMinAmount: 5000,
          validUntil: validUntil.toISOString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.offerType).toBe('free_shipping');
      expect(response.body.data.freeShippingMinAmount).toBe(5000);
    });

    it('should reject offer creation by non-admin', async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      const response = await request(app)
        .post('/api/v1/offers')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          title: 'Test Offer',
          offerType: 'product_discount',
          discountType: 'percentage',
          discountValue: 10,
          applicableProducts: [productId],
          validUntil: validUntil.toISOString(),
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid offer data', async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      const response = await request(app)
        .post('/api/v1/offers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Invalid Offer',
          offerType: 'category_discount',
          discountType: 'percentage',
          discountValue: 10,
          // Missing applicableCategories
          validUntil: validUntil.toISOString(),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/offers', () => {
    beforeEach(async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      await Offer.create([
        {
          title: 'Active Offer',
          offerType: 'product_discount',
          discountType: 'percentage',
          discountValue: 20,
          applicableProducts: [productId],
          validUntil,
          isActive: true,
        },
        {
          title: 'Inactive Offer',
          offerType: 'category_discount',
          discountType: 'percentage',
          discountValue: 15,
          applicableCategories: ['Electronics'],
          validUntil,
          isActive: false,
        },
      ]);
    });

    it('should list all offers', async () => {
      const response = await request(app).get('/api/v1/offers').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by active status', async () => {
      const response = await request(app).get('/api/v1/offers?isActive=true').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((o: { isActive: boolean }) => o.isActive)).toBe(true);
    });

    it('should filter by offer type', async () => {
      const response = await request(app).get('/api/v1/offers?offerType=product_discount').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((o: { offerType: string }) => o.offerType === 'product_discount')).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await request(app).get('/api/v1/offers?category=Electronics').expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/offers/active', () => {
    beforeEach(async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);
      const expiredUntil = new Date('2020-01-01');

      await Offer.create([
        {
          title: 'Active Offer',
          offerType: 'product_discount',
          discountType: 'percentage',
          discountValue: 20,
          applicableProducts: [productId],
          validFrom: new Date(),
          validUntil,
          isActive: true,
        },
        {
          title: 'Expired Offer',
          offerType: 'category_discount',
          discountType: 'percentage',
          discountValue: 15,
          applicableCategories: ['Electronics'],
          validFrom: new Date('2019-01-01'),
          validUntil: expiredUntil,
          isActive: true,
        },
        {
          title: 'Inactive Offer',
          offerType: 'product_discount',
          discountType: 'percentage',
          discountValue: 10,
          applicableProducts: [productId],
          validFrom: new Date(),
          validUntil,
          isActive: false,
        },
      ]);
    });

    it('should return only active offers', async () => {
      const response = await request(app).get('/api/v1/offers/active').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.every((o: { isActive: boolean }) => o.isActive)).toBe(true);
    });
  });

  describe('POST /api/v1/offers/apply', () => {
    beforeEach(async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      await Offer.create({
        title: 'Product Discount',
        offerType: 'product_discount',
        discountType: 'percentage',
        discountValue: 20,
        applicableProducts: [productId],
        validFrom: new Date(),
        validUntil,
        isActive: true,
      });
    });

    it('should apply offers to cart', async () => {
      const response = await request(app)
        .post('/api/v1/offers/apply')
        .send({
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
      expect(response.body.data.applicableOffers.length).toBeGreaterThan(0);
      expect(response.body.data.totalDiscount).toBeGreaterThan(0);
    });

    it('should apply free shipping offer', async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      await Offer.create({
        title: 'Free Shipping',
        offerType: 'free_shipping',
        discountType: 'fixed',
        discountValue: 0,
        freeShippingMinAmount: 5000,
        validFrom: new Date(),
        validUntil,
        isActive: true,
      });

      const response = await request(app)
        .post('/api/v1/offers/apply')
        .send({
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
      expect(response.body.data.freeShipping).toBe(true);
    });
  });

  describe('GET /api/v1/offers/:id', () => {
    it('should get offer by ID', async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      const offer = await Offer.create({
        title: 'Test Offer',
        offerType: 'product_discount',
        discountType: 'percentage',
        discountValue: 20,
        applicableProducts: [productId],
        validUntil,
        isActive: true,
      });

      const response = await request(app).get(`/api/v1/offers/${offer._id}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(offer._id.toString());
      expect(response.body.data.title).toBe('Test Offer');
    });

    it('should return 404 for non-existent offer', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/v1/offers/${fakeId}`).expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/offers/:id', () => {
    it('should update offer as admin', async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      const offer = await Offer.create({
        title: 'Test Offer',
        offerType: 'product_discount',
        discountType: 'percentage',
        discountValue: 20,
        applicableProducts: [productId],
        validUntil,
        isActive: true,
      });

      const response = await request(app)
        .patch(`/api/v1/offers/${offer._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          discountValue: 30,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.discountValue).toBe(30);
    });

    it('should reject update by non-admin', async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      const offer = await Offer.create({
        title: 'Test Offer',
        offerType: 'product_discount',
        discountType: 'percentage',
        discountValue: 20,
        applicableProducts: [productId],
        validUntil,
        isActive: true,
      });

      const response = await request(app)
        .patch(`/api/v1/offers/${offer._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          discountValue: 30,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/offers/:id', () => {
    it('should delete offer as admin', async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      const offer = await Offer.create({
        title: 'Test Offer',
        offerType: 'product_discount',
        discountType: 'percentage',
        discountValue: 20,
        applicableProducts: [productId],
        validUntil,
        isActive: true,
      });

      const response = await request(app)
        .delete(`/api/v1/offers/${offer._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify offer is deleted
      const deletedOffer = await Offer.findById(offer._id);
      expect(deletedOffer).toBeNull();
    });

    it('should reject delete by non-admin', async () => {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      const offer = await Offer.create({
        title: 'Test Offer',
        offerType: 'product_discount',
        discountType: 'percentage',
        discountValue: 20,
        applicableProducts: [productId],
        validUntil,
        isActive: true,
      });

      const response = await request(app)
        .delete(`/api/v1/offers/${offer._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});

