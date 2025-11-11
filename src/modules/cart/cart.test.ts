import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import { createApp } from '../../app';
import { User } from '../users/user.model';
import { Product } from '../products/product.model';
import { Cart } from './cart.model';
import bcrypt from 'bcryptjs';
import { generateAccessToken } from '../auth/token.util';

describe('Cart Module', () => {
  let app: Express;
  let customerToken: string;
  let customerId: string;
  let productId: string;

  beforeAll(async () => {
    app = createApp();
  });

  beforeEach(async () => {
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
      price: 1000,
      currency: 'USD',
      stock: 10,
      category: 'Electronics',
      tags: ['test'],
      sellerId: seller._id,
    });
    productId = product._id.toString();
  });

  afterEach(async () => {
    await Cart.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/v1/cart', () => {
    it('should get empty cart for new user', async () => {
      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(0);
      expect(response.body.data.itemCount).toBe(0);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app).get('/api/v1/cart').expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/cart', () => {
    it('should add item to cart successfully', async () => {
      const response = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId,
          quantity: 2,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.itemCount).toBe(2);
      expect(response.body.data.total).toBe(2000);
    });

    it('should update quantity if product already in cart', async () => {
      // Add item first
      await request(app).post('/api/v1/cart').set('Authorization', `Bearer ${customerToken}`).send({
        productId,
        quantity: 2,
      });

      // Add same item again
      const response = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId,
          quantity: 3,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.itemCount).toBe(5); // 2 + 3
    });

    it('should reject adding item with insufficient stock', async () => {
      const response = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId,
          quantity: 100, // More than available stock
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Insufficient stock');
    });
  });

  describe('PATCH /api/v1/cart/:productId', () => {
    beforeEach(async () => {
      await Cart.create({
        userId: customerId,
        items: [
          {
            productId,
            quantity: 2,
            price: 1000,
          },
        ],
      });
    });

    it('should update cart item quantity', async () => {
      const response = await request(app)
        .patch(`/api/v1/cart/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          quantity: 5,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.itemCount).toBe(5);
    });
  });

  describe('DELETE /api/v1/cart/:productId', () => {
    beforeEach(async () => {
      await Cart.create({
        userId: customerId,
        items: [
          {
            productId,
            quantity: 2,
            price: 1000,
          },
        ],
      });
    });

    it('should remove item from cart', async () => {
      const response = await request(app)
        .delete(`/api/v1/cart/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(0);
    });
  });

  describe('DELETE /api/v1/cart', () => {
    beforeEach(async () => {
      await Cart.create({
        userId: customerId,
        items: [
          {
            productId,
            quantity: 2,
            price: 1000,
          },
        ],
      });
    });

    it('should clear entire cart', async () => {
      const response = await request(app)
        .delete('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Cart cleared successfully');
    });
  });
});
