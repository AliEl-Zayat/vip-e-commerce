import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import { createApp } from '../../app';
import { User } from './user.model';
import bcrypt from 'bcryptjs';
import { generateAccessToken } from '../auth/token.util';

describe('User Profile Module', () => {
  let app: Express;
  let accessToken: string;

  beforeAll(async () => {
    app = createApp();
  });

  beforeEach(async () => {
    const user = await User.create({
      email: 'test@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Test User',
    });

    accessToken = generateAccessToken(user);
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/v1/profile', () => {
    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.name).toBe('Test User');
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/v1/profile').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('Unauthorized');
    });
  });

  describe('PATCH /api/v1/profile', () => {
    it('should update user profile successfully', async () => {
      const response = await request(app)
        .patch('/api/v1/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Name',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should update avatar URL', async () => {
      const response = await request(app)
        .patch('/api/v1/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          avatarUrl: 'https://example.com/avatar.jpg',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('should reject invalid avatar URL', async () => {
      const response = await request(app)
        .patch('/api/v1/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          avatarUrl: 'not-a-url',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .patch('/api/v1/profile')
        .send({
          name: 'Updated Name',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('Unauthorized');
    });
  });
});
