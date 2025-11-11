import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import { createApp } from '../../app';
import { User } from './user.model';
import bcrypt from 'bcryptjs';
import { generateAccessToken } from '../auth/token.util';

// Mock Cloudinary before importing app
jest.mock('../../config/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload_stream: (_options: unknown, callback: (error: unknown, result: unknown) => void) => {
        callback(null, {
          secure_url: 'https://res.cloudinary.com/test/image/upload/v1234567890/avatar.jpg',
          public_id: 'test/avatar',
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

describe('User Avatar Upload', () => {
  let app: Express;
  let userToken: string;

  beforeAll(async () => {
    app = createApp();
  });

  beforeEach(async () => {
    const user = await User.create({
      email: 'test@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Test User',
    });
    userToken = generateAccessToken(user);
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should upload avatar successfully', async () => {
    const response = await request(app)
      .post('/api/v1/profile/avatar')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('image', Buffer.from('fake-image-data'), 'avatar.jpg')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.avatarUrl).toBeDefined();
  });

  it('should reject upload without authentication', async () => {
    const response = await request(app)
      .post('/api/v1/profile/avatar')
      .attach('image', Buffer.from('fake-image-data'), 'avatar.jpg')
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  it('should reject upload without file', async () => {
    const response = await request(app)
      .post('/api/v1/profile/avatar')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});
