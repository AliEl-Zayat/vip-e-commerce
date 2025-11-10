import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import { createApp } from '../../app';
import { User } from '../users/user.model';
import { Product } from './product.model';
import bcrypt from 'bcryptjs';
import { generateAccessToken } from '../auth/token.util';

describe('Product Module', () => {
  let app: Express;
  let sellerToken: string;
  let adminToken: string;
  let customerToken: string;
  let sellerId: string;

  beforeAll(async () => {
    app = createApp();
  });

  beforeEach(async () => {
    // Create seller
    const seller = await User.create({
      email: 'seller@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Seller User',
      role: 'seller',
    });
    sellerId = seller._id.toString();
    sellerToken = generateAccessToken(seller);

    // Create admin
    const admin = await User.create({
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Admin User',
      role: 'admin',
    });
    adminToken = generateAccessToken(admin);

    // Create customer
    const customer = await User.create({
      email: 'customer@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Customer User',
      role: 'customer',
    });
    customerToken = generateAccessToken(customer);
  });

  afterEach(async () => {
    await Product.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/v1/products', () => {
    it('should create product successfully as seller', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: 'Test Product',
          description: 'Test Description',
          price: 1000,
          currency: 'USD',
          stock: 10,
          category: 'Electronics',
          tags: ['test', 'product'],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Product');
      expect(response.body.data.sellerId).toBe(sellerId);
    });

    it('should create product successfully as admin', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Product',
          description: 'Admin Description',
          price: 2000,
          currency: 'USD',
          stock: 5,
          category: 'Electronics',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should reject product creation by customer', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          title: 'Customer Product',
          description: 'Customer Description',
          price: 1000,
          currency: 'USD',
          stock: 10,
          category: 'Electronics',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('Forbidden');
    });

    it('should reject product creation without auth', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .send({
          title: 'Test Product',
          description: 'Test Description',
          price: 1000,
          currency: 'USD',
          stock: 10,
          category: 'Electronics',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid product data', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: '',
          description: 'Test Description',
          price: -100,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });
  });

  describe('GET /api/v1/products', () => {
    beforeEach(async () => {
      await Product.create([
        {
          title: 'Product 1',
          slug: 'product-1',
          description: 'Description 1',
          price: 1000,
          currency: 'USD',
          stock: 10,
          category: 'Electronics',
          tags: ['tag1'],
          sellerId,
        },
        {
          title: 'Product 2',
          slug: 'product-2',
          description: 'Description 2',
          price: 2000,
          currency: 'USD',
          stock: 5,
          category: 'Clothing',
          tags: ['tag2'],
          sellerId,
        },
      ]);
    });

    it('should list products with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.totalItems).toBe(2);
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .query({ category: 'Electronics' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('Electronics');
    });

    it('should filter products by price range', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .query({ minPrice: 1500, maxPrice: 2500 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].price).toBe(2000);
    });

    it('should search products by query', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .query({ q: 'Product 1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await Product.create({
        title: 'Test Product',
        slug: 'test-product',
        description: 'Test Description',
        price: 1000,
        currency: 'USD',
        stock: 10,
        category: 'Electronics',
        tags: ['test'],
        sellerId,
      });
      productId = product._id.toString();
    });

    it('should get product by id', async () => {
      const response = await request(app).get(`/api/v1/products/${productId}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).get(`/api/v1/products/${fakeId}`).expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NotFound');
    });
  });

  describe('PATCH /api/v1/products/:id', () => {
    let productId: string;
    let otherSellerToken: string;

    beforeEach(async () => {
      const otherSeller = await User.create({
        email: 'otherseller@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Other Seller',
        role: 'seller',
      });
      otherSellerToken = generateAccessToken(otherSeller);

      const product = await Product.create({
        title: 'Test Product',
        slug: 'test-product',
        description: 'Test Description',
        price: 1000,
        currency: 'USD',
        stock: 10,
        category: 'Electronics',
        tags: ['test'],
        sellerId,
      });
      productId = product._id.toString();
    });

    it('should update product as owner', async () => {
      const response = await request(app)
        .patch(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: 'Updated Product',
          price: 1500,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Product');
      expect(response.body.data.price).toBe(1500);
    });

    it('should update product as admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Updated Product',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Admin Updated Product');
    });

    it('should reject update by non-owner seller', async () => {
      const response = await request(app)
        .patch(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${otherSellerToken}`)
        .send({
          title: 'Unauthorized Update',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('Forbidden');
    });

    it('should reject update by customer', async () => {
      const response = await request(app)
        .patch(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          title: 'Customer Update',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    let productId: string;
    let otherSellerToken: string;

    beforeEach(async () => {
      const otherSeller = await User.create({
        email: 'otherseller@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Other Seller',
        role: 'seller',
      });
      otherSellerToken = generateAccessToken(otherSeller);

      const product = await Product.create({
        title: 'Test Product',
        slug: 'test-product',
        description: 'Test Description',
        price: 1000,
        currency: 'USD',
        stock: 10,
        category: 'Electronics',
        tags: ['test'],
        sellerId,
      });
      productId = product._id.toString();
    });

    it('should delete product as owner', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify product is deleted
      const product = await Product.findById(productId);
      expect(product).toBeNull();
    });

    it('should delete product as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject delete by non-owner seller', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${otherSellerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('Forbidden');
    });
  });
});
