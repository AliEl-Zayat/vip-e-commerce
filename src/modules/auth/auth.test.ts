import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import { createApp } from '../../app';
import { User } from '../users/user.model';
import { QRSession } from './qr-session.model';
import bcrypt from 'bcryptjs';
import { generateAccessToken } from './token.util';

describe('Auth Module', () => {
  let app: Express;

  beforeAll(async () => {
    app = createApp();
  });

  afterEach(async () => {
    await QRSession.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.name).toBe('Test User');
      expect(response.body.data.user.role).toBe('customer');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should register with seller role', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'seller@example.com',
          password: 'password123',
          name: 'Seller User',
          role: 'seller',
        })
        .expect(201);

      expect(response.body.data.user.role).toBe('seller');
    });

    it('should reject duplicate email', async () => {
      await User.create({
        email: 'existing@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Existing User',
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          name: 'New User',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already exists');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should reject short password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Test User',
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('Unauthorized');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('Unauthorized');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const user = await User.create({
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Test User',
      });

      const { generateRefreshToken } = require('./token.util');
      refreshToken = generateRefreshToken(user);
    });

    it('should refresh access token successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should reject request without refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('Unauthorized');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Logged out successfully');
    });
  });

  describe('POST /api/v1/auth/forget-password', () => {
    beforeEach(async () => {
      await User.create({
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Test User',
      });
    });

    it('should send password reset email for existing user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forget-password')
        .send({
          email: 'test@example.com',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('password reset link');

      // Verify reset token was saved
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user?.passwordResetToken).toBeDefined();
      expect(user?.passwordResetExpires).toBeDefined();
    });

    it('should return success even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forget-password')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    let resetToken: string;
    let resetTokenHash: string;
    let user: any;

    beforeEach(async () => {
      const crypto = require('crypto');
      resetToken = crypto.randomBytes(32).toString('hex');
      resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

      user = await User.create({
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('oldpassword', 10),
        name: 'Test User',
        passwordResetToken: resetTokenHash,
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      });
    });

    it('should reset password successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          password: 'newpassword123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('reset successfully');

      // Verify password was changed
      const updatedUser = await User.findById(user._id);
      const isPasswordValid = await bcrypt.compare('newpassword123', updatedUser!.passwordHash);
      expect(isPasswordValid).toBe(true);

      // Verify reset token was cleared
      expect(updatedUser!.passwordResetToken).toBeUndefined();
      expect(updatedUser!.passwordResetExpires).toBeUndefined();
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'newpassword123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid or expired');
    });

    it('should reject expired token', async () => {
      // Set token to expired
      user.passwordResetExpires = new Date(Date.now() - 1000);
      await user.save();

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          password: 'newpassword123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid or expired');
    });
  });

  describe('POST /api/v1/auth/otp/request', () => {
    beforeEach(async () => {
      await User.create({
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Test User',
      });
    });

    it('should send OTP email for existing user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({
          email: 'test@example.com',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('OTP code');

      // Verify OTP was saved
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user?.otpCode).toBeDefined();
      expect(user?.otpExpires).toBeDefined();
      expect(user?.otpCode?.length).toBe(6);
    });

    it('should return success even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/auth/otp/verify', () => {
    let user: any;
    let otpCode: string;

    beforeEach(async () => {
      otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      user = await User.create({
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Test User',
        otpCode,
        otpExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      });
    });

    it('should verify OTP and login successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: 'test@example.com',
          otpCode,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();

      // Verify OTP was cleared after use
      const updatedUser = await User.findById(user._id);
      expect(updatedUser!.otpCode).toBeUndefined();
      expect(updatedUser!.otpExpires).toBeUndefined();
    });

    it('should reject invalid OTP code', async () => {
      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: 'test@example.com',
          otpCode: '000000',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid');
    });

    it('should reject expired OTP', async () => {
      // Set OTP to expired
      user.otpExpires = new Date(Date.now() - 1000);
      await user.save();

      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: 'test@example.com',
          otpCode,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('expired');
    });

    it('should reject OTP for non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: 'nonexistent@example.com',
          otpCode: '123456',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject when OTP not requested', async () => {
      await User.create({
        email: 'no-otp@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'No OTP User',
      });

      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: 'no-otp@example.com',
          otpCode: '123456',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not requested');
    });
  });

  describe('POST /api/v1/auth/qr/generate', () => {
    it('should generate QR code session successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/qr/generate')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBeDefined();
      expect(response.body.data.qrCodeUrl).toBeDefined();
      expect(response.body.data.qrCodeUrl).toContain('data:image/png;base64');
      expect(response.body.data.expiresIn).toBe(300);

      // Verify session was created
      const session = await QRSession.findOne({ sessionId: response.body.data.sessionId });
      expect(session).toBeDefined();
      expect(session?.status).toBe('pending');
    });
  });

  describe('GET /api/v1/auth/qr/status/:sessionId', () => {
    let sessionId: string;
    let qrToken: string;

    beforeEach(async () => {
      const crypto = require('crypto');
      sessionId = crypto.randomBytes(16).toString('hex');
      qrToken = crypto.randomBytes(32).toString('hex');

      await QRSession.create({
        sessionId,
        qrToken,
        status: 'pending',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });
    });

    it('should return pending status for new session', async () => {
      const response = await request(app)
        .get(`/api/v1/auth/qr/status/${sessionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('pending');
    });

    it('should return scanned status after scanning', async () => {
      const session = await QRSession.findOne({ sessionId });
      session!.status = 'scanned';
      session!.scannedAt = new Date();
      await session!.save();

      const response = await request(app)
        .get(`/api/v1/auth/qr/status/${sessionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('scanned');
    });

    it('should return authenticated status with tokens', async () => {
      const user = await User.create({
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Test User',
      });

      const session = await QRSession.findOne({ sessionId });
      session!.status = 'authenticated';
      session!.userId = user._id;
      session!.authenticatedAt = new Date();
      await session!.save();

      const response = await request(app)
        .get(`/api/v1/auth/qr/status/${sessionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('authenticated');
      expect(response.body.data.userId).toBe(user._id.toString());
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return expired status for expired session', async () => {
      const session = await QRSession.findOne({ sessionId });
      session!.expiresAt = new Date(Date.now() - 1000);
      await session!.save();

      const response = await request(app)
        .get(`/api/v1/auth/qr/status/${sessionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('expired');
    });

    it('should return 404 for non-existent session', async () => {
      const fakeSessionId = 'nonexistent-session-id';
      const response = await request(app)
        .get(`/api/v1/auth/qr/status/${fakeSessionId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/qr/scan', () => {
    let sessionId: string;
    let qrToken: string;

    beforeEach(async () => {
      const crypto = require('crypto');
      sessionId = crypto.randomBytes(16).toString('hex');
      qrToken = crypto.randomBytes(32).toString('hex');

      await QRSession.create({
        sessionId,
        qrToken,
        status: 'pending',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });
    });

    it('should mark QR code as scanned', async () => {
      const response = await request(app)
        .post('/api/v1/auth/qr/scan')
        .send({
          sessionId,
          qrToken,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('scanned');

      // Verify session status updated
      const session = await QRSession.findOne({ sessionId });
      expect(session?.status).toBe('scanned');
      expect(session?.scannedAt).toBeDefined();
    });

    it('should reject invalid session', async () => {
      const response = await request(app)
        .post('/api/v1/auth/qr/scan')
        .send({
          sessionId: 'invalid',
          qrToken: 'invalid',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject expired session', async () => {
      const session = await QRSession.findOne({ sessionId });
      session!.expiresAt = new Date(Date.now() - 1000);
      await session!.save();

      const response = await request(app)
        .post('/api/v1/auth/qr/scan')
        .send({
          sessionId,
          qrToken,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/qr/authenticate', () => {
    let sessionId: string;
    let qrToken: string;
    let userToken: string;
    let userId: string;

    beforeEach(async () => {
      const crypto = require('crypto');
      sessionId = crypto.randomBytes(16).toString('hex');
      qrToken = crypto.randomBytes(32).toString('hex');

      const user = await User.create({
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Test User',
      });
      userId = user._id.toString();
      userToken = generateAccessToken(user);

      await QRSession.create({
        sessionId,
        qrToken,
        status: 'scanned',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        scannedAt: new Date(),
      });
    });

    it('should authenticate QR code successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/qr/authenticate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId,
          qrToken,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('authenticated');

      // Verify session updated
      const session = await QRSession.findOne({ sessionId });
      expect(session?.status).toBe('authenticated');
      expect(session?.userId?.toString()).toBe(userId);
      expect(session?.authenticatedAt).toBeDefined();
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/auth/qr/authenticate')
        .send({
          sessionId,
          qrToken,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid session', async () => {
      const response = await request(app)
        .post('/api/v1/auth/qr/authenticate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: 'invalid',
          qrToken: 'invalid',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject expired session', async () => {
      const session = await QRSession.findOne({ sessionId });
      session!.expiresAt = new Date(Date.now() - 1000);
      await session!.save();

      const response = await request(app)
        .post('/api/v1/auth/qr/authenticate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId,
          qrToken,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject already authenticated session', async () => {
      const session = await QRSession.findOne({ sessionId });
      session!.status = 'authenticated';
      await session!.save();

      const response = await request(app)
        .post('/api/v1/auth/qr/authenticate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId,
          qrToken,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already authenticated');
    });
  });
});

