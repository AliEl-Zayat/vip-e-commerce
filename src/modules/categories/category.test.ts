import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import { createApp } from '../../app';
import { User } from '../users/user.model';
import { Category } from './category.model';
import { Product } from '../products/product.model';
import bcrypt from 'bcryptjs';
import { generateAccessToken } from '../auth/token.util';

describe('Category Module', () => {
  let app: Express;
  let adminToken: string;
  let customerToken: string;
  let sellerId: string;

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
    sellerId = seller._id.toString();
  });

  afterEach(async () => {
    await Product.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/v1/categories', () => {
    it('should create category successfully as admin', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Electronics',
          description: 'Electronic products',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Electronics');
      expect(response.body.data.slug).toBe('electronics');
      expect(response.body.data.isActive).toBe(true);
    });

    it('should create category with custom slug', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Home & Garden',
          slug: 'home-garden',
          description: 'Home and garden products',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('home-garden');
    });

    it('should create category with parent', async () => {
      const parent = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
      });

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Smartphones',
          parentId: parent._id.toString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Smartphones');
      expect(response.body.data.parentId).toBe(parent._id.toString());
    });

    it('should reject duplicate category name', async () => {
      await Category.create({
        name: 'Electronics',
        slug: 'electronics',
      });

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Electronics',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already exists');
    });

    it('should reject category creation by non-admin', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Test Category',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/categories', () => {
    beforeEach(async () => {
      await Category.create([
        {
          name: 'Electronics',
          slug: 'electronics',
          isActive: true,
        },
        {
          name: 'Clothing',
          slug: 'clothing',
          isActive: true,
        },
        {
          name: 'Inactive Category',
          slug: 'inactive-category',
          isActive: false,
        },
      ]);
    });

    it('should list all categories', async () => {
      const response = await request(app).get('/api/v1/categories').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by active status', async () => {
      const response = await request(app).get('/api/v1/categories?isActive=true').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((c: { isActive: boolean }) => c.isActive)).toBe(true);
    });

    it('should filter by parent', async () => {
      const parent = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
      });

      await Category.create({
        name: 'Smartphones',
        slug: 'smartphones',
        parentId: parent._id,
      });

      const response = await request(app)
        .get(`/api/v1/categories?parentId=${parent._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((c: { parentId: any }) => c.parentId?.id === parent._id.toString())).toBe(true);
    });
  });

  describe('GET /api/v1/categories/tree', () => {
    beforeEach(async () => {
      const electronics = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
        order: 1,
      });

      await Category.create({
        name: 'Smartphones',
        slug: 'smartphones',
        parentId: electronics._id,
        order: 1,
      });

      await Category.create({
        name: 'Laptops',
        slug: 'laptops',
        parentId: electronics._id,
        order: 2,
      });

      await Category.create({
        name: 'Clothing',
        slug: 'clothing',
        order: 2,
      });
    });

    it('should return category tree structure', async () => {
      const response = await request(app).get('/api/v1/categories/tree').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      const electronics = response.body.data.find((c: { name: string }) => c.name === 'Electronics');
      expect(electronics).toBeDefined();
      expect(electronics.children).toBeDefined();
      expect(electronics.children.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/categories/:id', () => {
    it('should get category by ID', async () => {
      const category = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic products',
      });

      const response = await request(app).get(`/api/v1/categories/${category._id}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(category._id.toString());
      expect(response.body.data.name).toBe('Electronics');
    });

    it('should include product count when requested', async () => {
      const category = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
      });

      const seller = await User.findById(sellerId);
      await Product.create({
        title: 'Test Product',
        slug: 'test-product',
        description: 'Test',
        price: 10000,
        currency: 'USD',
        stock: 10,
        category: 'Electronics',
        sellerId: seller!._id,
      });

      const response = await request(app)
        .get(`/api/v1/categories/${category._id}?includeProductCount=true`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.productCount).toBe(1);
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/v1/categories/${fakeId}`).expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/categories/slug/:slug', () => {
    it('should get category by slug', async () => {
      await Category.create({
        name: 'Electronics',
        slug: 'electronics',
      });

      const response = await request(app).get('/api/v1/categories/slug/electronics').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('electronics');
    });
  });

  describe('GET /api/v1/categories/:id/children', () => {
    it('should get category with children', async () => {
      const parent = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
      });

      await Category.create({
        name: 'Smartphones',
        slug: 'smartphones',
        parentId: parent._id,
      });

      const response = await request(app).get(`/api/v1/categories/${parent._id}/children`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.children).toBeDefined();
      expect(response.body.data.children.length).toBe(1);
    });
  });

  describe('PATCH /api/v1/categories/:id', () => {
    it('should update category as admin', async () => {
      const category = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
      });

      const response = await request(app)
        .patch(`/api/v1/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Updated description');
    });

    it('should update parent category', async () => {
      const parent = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
      });

      const child = await Category.create({
        name: 'Smartphones',
        slug: 'smartphones',
      });

      const response = await request(app)
        .patch(`/api/v1/categories/${child._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentId: parent._id.toString(),
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject update by non-admin', async () => {
      const category = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
      });

      const response = await request(app)
        .patch(`/api/v1/categories/${category._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Updated',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    it('should delete category as admin', async () => {
      const category = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
      });

      const response = await request(app)
        .delete(`/api/v1/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify category is deleted
      const deletedCategory = await Category.findById(category._id);
      expect(deletedCategory).toBeNull();
    });

    it('should reject deletion of category with children', async () => {
      const parent = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
      });

      await Category.create({
        name: 'Smartphones',
        slug: 'smartphones',
        parentId: parent._id,
      });

      const response = await request(app)
        .delete(`/api/v1/categories/${parent._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('children');
    });

    it('should reject deletion of category with products', async () => {
      const category = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
      });

      const seller = await User.findById(sellerId);
      await Product.create({
        title: 'Test Product',
        slug: 'test-product',
        description: 'Test',
        price: 10000,
        currency: 'USD',
        stock: 10,
        category: 'Electronics',
        sellerId: seller!._id,
      });

      const response = await request(app)
        .delete(`/api/v1/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('products');
    });

    it('should reject delete by non-admin', async () => {
      const category = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
      });

      const response = await request(app)
        .delete(`/api/v1/categories/${category._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});

