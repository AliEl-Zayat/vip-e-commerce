import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import { User } from '../src/modules/users/user.model';
import { Product } from '../src/modules/products/product.model';
import bcrypt from 'bcryptjs';
import { generateAccessToken } from '../src/modules/auth/token.util';

describe('Edge Cases', () => {
  let app: Express;
  let sellerToken: string;
  let sellerId: string;
  let productId: string;

  beforeAll(async () => {
    app = createApp();
  });

  beforeEach(async () => {
    const seller = await User.create({
      email: 'seller@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Seller User',
      role: 'seller',
    });
    sellerId = seller._id.toString();
    sellerToken = generateAccessToken(seller);

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

  afterEach(async () => {
    await Product.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Pagination Edge Cases', () => {
    beforeEach(async () => {
      // Create multiple products
      const products = Array.from({ length: 25 }, (_, i) => ({
        title: `Product ${i + 1}`,
        slug: `product-${i + 1}`,
        description: `Description ${i + 1}`,
        price: 1000 + i * 100,
        currency: 'USD',
        stock: 10,
        category: 'Electronics',
        tags: ['test'],
        sellerId,
      }));
      await Product.insertMany(products);
    });

    it('should handle page beyond last page', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .query({ page: 100, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.meta.page).toBe(100);
      expect(response.body.meta.hasNext).toBe(false);
    });

    it('should handle zero or negative page', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .query({ page: 0, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.page).toBe(1); // Should default to 1
    });

    it('should enforce max limit', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .query({ page: 1, limit: 1000 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.limit).toBeLessThanOrEqual(100); // Max limit
    });

    it('should handle negative limit', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .query({ page: 1, limit: -10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.limit).toBeGreaterThan(0);
    });
  });

  describe('Concurrent Stock Updates', () => {
    it('should handle concurrent stock updates atomically', async () => {
      const product = await Product.findById(productId);
      const initialStock = product!.stock;

      // Simulate concurrent updates
      const updates = Array.from({ length: 5 }, () =>
        Product.findByIdAndUpdate(productId, { $inc: { stock: -1 } }, { new: true })
      );

      await Promise.all(updates);

      const updatedProduct = await Product.findById(productId);
      expect(updatedProduct!.stock).toBe(initialStock - 5);
    });
  });

  describe('Invalid JWT Tokens', () => {
    it('should reject expired access token', async () => {
      // Create an expired token (this would require mocking time or using a real expired token)
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

      const response = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('Unauthorized');
    });

    it('should reject malformed token', async () => {
      const response = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/v1/profile').expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Large File Uploads', () => {
    it('should reject files larger than 5MB', async () => {
      // Create a large buffer (6MB)
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

      const response = await request(app)
        .post('/api/v1/profile/avatar')
        .set('Authorization', `Bearer ${sellerToken}`)
        .attach('image', largeBuffer, 'large.jpg')
        .expect(413); // Payload Too Large

      expect(response.body.success).toBe(false);
    });
  });

  describe('Product Ownership', () => {
    let otherSellerToken: string;

    beforeEach(async () => {
      const otherSeller = await User.create({
        email: 'otherseller@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Other Seller',
        role: 'seller',
      });
      otherSellerToken = generateAccessToken(otherSeller);
    });

    it("should prevent seller from updating other seller's product", async () => {
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

    it('should allow admin to update any product', async () => {
      const admin = await User.create({
        email: 'admin@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Admin User',
        role: 'admin',
      });
      const adminToken = generateAccessToken(admin);

      const response = await request(app)
        .patch(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Update',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Admin Update');
    });
  });

  describe('Product Slug Uniqueness', () => {
    it('should prevent duplicate slugs', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: 'Test Product', // Same title = same slug
          description: 'Another description',
          price: 1000,
          currency: 'USD',
          stock: 10,
          category: 'Electronics',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already exists');
    });
  });

  describe('Invalid Input Validation', () => {
    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: 'password123',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should reject negative price', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: 'New Product',
          description: 'Description',
          price: -100,
          currency: 'USD',
          stock: 10,
          category: 'Electronics',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should reject negative stock', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: 'New Product',
          description: 'Description',
          price: 1000,
          currency: 'USD',
          stock: -10,
          category: 'Electronics',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });
  });
});
