import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import { createApp } from '../../app';
import { User } from '../users/user.model';
import { Product } from './product.model';
import bcrypt from 'bcryptjs';
import { generateAccessToken } from '../auth/token.util';
// Mock Cloudinary before importing app
jest.mock('../../config/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload_stream: (_options: unknown, callback: (error: unknown, result: unknown) => void) => {
        callback(null, {
          secure_url: 'https://res.cloudinary.com/test/image/upload/v1234567890/test.jpg',
          public_id: 'test/test',
        });
        return {
          end: jest.fn(),
        };
      },
      destroy: jest.fn((_publicId: string, callback: (error: unknown, result: unknown) => void) => {
        callback(null, { result: 'ok' });
      }),
    },
  },
}));

describe('Product Image Upload', () => {
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

  it('should upload product images successfully', async () => {
    const response = await request(app)
      .post(`/api/v1/products/${productId}/images`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .attach('images', Buffer.from('fake-image-data'), 'test.jpg')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.images).toBeDefined();
  });

  it('should reject upload without authentication', async () => {
    const response = await request(app)
      .post(`/api/v1/products/${productId}/images`)
      .attach('images', Buffer.from('fake-image-data'), 'test.jpg')
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  it('should reject upload without files', async () => {
    const response = await request(app)
      .post(`/api/v1/products/${productId}/images`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});

