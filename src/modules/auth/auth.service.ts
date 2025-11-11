import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../users/user.model';
import { QRSession, QRStatus } from './qr-session.model';
import {
  RegisterDto,
  LoginDto,
  ForgetPasswordDto,
  ResetPasswordDto,
  RequestOTPDto,
  VerifyOTPDto,
  AuthenticateQRDto,
} from './dto/auth.dto';
import { AppError } from '../../utils/error.util';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from './token.util';
import { sendPasswordResetEmail, sendOTPEmail } from '../../utils/email.util';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatarUrl?: string;
  };
  accessToken: string;
  refreshToken: string;
}

// Note: generateSlug moved to product.service.ts where it's used

import { IUser } from '../users/user.model';

// Pure function: Create user response object
const createUserResponse = (user: IUser): AuthResponse['user'] => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name,
  role: user.role,
  avatarUrl: user.avatarUrl,
});

// Pure function: Create auth response
const createAuthResponse = (user: IUser): AuthResponse => ({
  user: createUserResponse(user),
  accessToken: generateAccessToken(user),
  refreshToken: generateRefreshToken(user),
});

// Service functions (functional programming approach)
export const register = async (data: RegisterDto): Promise<AuthResponse> => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: data.email.toLowerCase() });
  if (existingUser) {
    throw AppError.conflict('User with this email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Create user
  const user = await User.create({
    email: data.email.toLowerCase(),
    passwordHash,
    name: data.name,
    role: data.role || 'customer',
  });

  return createAuthResponse(user);
};

export const login = async (data: LoginDto): Promise<AuthResponse> => {
  // Find user
  const user = await User.findOne({ email: data.email.toLowerCase() });
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  return createAuthResponse(user);
};

export const refresh = async (refreshToken: string): Promise<{ accessToken: string }> => {
  try {
    const payload = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(payload.userId);
    if (!user) {
      throw AppError.unauthorized('User not found');
    }

    // Generate new access token
    return { accessToken: generateAccessToken(user) };
  } catch (error) {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }
};

export const logout = async (): Promise<void> => {
  // In a more advanced implementation, you might want to blacklist tokens
  // For now, we'll rely on token expiration
  return Promise.resolve();
};

export const forgetPassword = async (data: ForgetPasswordDto): Promise<void> => {
  const user = await User.findOne({ email: data.email.toLowerCase() });

  // Don't reveal if user exists or not (security best practice)
  if (!user) {
    // Return success even if user doesn't exist to prevent email enumeration
    return;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Save reset token to user
  user.passwordResetToken = resetTokenHash;
  user.passwordResetExpires = resetExpires;
  await user.save();

  // Send reset email
  await sendPasswordResetEmail(user.email, resetToken);
};

export const resetPassword = async (data: ResetPasswordDto): Promise<void> => {
  // Hash the token to compare with stored hash
  const resetTokenHash = crypto.createHash('sha256').update(data.token).digest('hex');

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: resetTokenHash,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw AppError.badRequest('Invalid or expired reset token');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Update user password and clear reset token
  user.passwordHash = passwordHash;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
};

export const requestOTP = async (data: RequestOTPDto): Promise<void> => {
  const user = await User.findOne({ email: data.email.toLowerCase() });

  if (!user) {
    // Don't reveal if user exists (security best practice)
    // Still return success to prevent email enumeration
    return;
  }

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save OTP to user
  user.otpCode = otpCode;
  user.otpExpires = otpExpires;
  await user.save();

  // Send OTP email
  await sendOTPEmail(user.email, otpCode);
};

export const verifyOTP = async (data: VerifyOTPDto): Promise<AuthResponse> => {
  const user = await User.findOne({ email: data.email.toLowerCase() });

  if (!user) {
    throw AppError.unauthorized('Invalid email or OTP');
  }

  // Check if OTP exists and is valid
  if (!user.otpCode || !user.otpExpires) {
    throw AppError.unauthorized('OTP not requested or expired');
  }

  // Check if OTP is expired
  if (user.otpExpires < new Date()) {
    // Clear expired OTP
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();
    throw AppError.unauthorized('OTP has expired');
  }

  // Verify OTP
  if (user.otpCode !== data.otpCode) {
    throw AppError.unauthorized('Invalid OTP code');
  }

  // Clear OTP after successful verification
  user.otpCode = undefined;
  user.otpExpires = undefined;
  await user.save();

  return createAuthResponse(user);
};

export const generateQRSession = async (): Promise<{
  sessionId: string;
  qrToken: string;
  qrCodeUrl: string;
}> => {
  // Generate unique session ID and QR token
  const sessionId = crypto.randomBytes(16).toString('hex');
  const qrToken = crypto.randomBytes(32).toString('hex');

  // Create QR session (expires in 5 minutes)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await QRSession.create({
    sessionId,
    qrToken,
    status: 'pending',
    expiresAt,
  });

  // Generate QR code data URL
  const { generateQRCodeDataURL } = await import('../../utils/qrcode.util');
  const qrCodeUrl = await generateQRCodeDataURL(
    JSON.stringify({
      sessionId,
      qrToken,
      type: 'login',
    })
  );

  return {
    sessionId,
    qrToken,
    qrCodeUrl,
  };
};

export const getQRSessionStatus = async (
  sessionId: string
): Promise<{ status: QRStatus; userId?: string; accessToken?: string; refreshToken?: string }> => {
  const session = await QRSession.findOne({ sessionId });

  if (!session) {
    throw AppError.notFound('QR session not found');
  }

  // Check if expired
  if (session.expiresAt < new Date() && session.status !== 'authenticated') {
    session.status = 'expired';
    await session.save();
    return { status: 'expired' };
  }

  if (session.status === 'authenticated' && session.userId) {
    // Get user and generate tokens
    const user = await User.findById(session.userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return {
      status: 'authenticated',
      userId: user._id.toString(),
      accessToken,
      refreshToken,
    };
  }

  return {
    status: session.status,
  };
};

export const authenticateQR = async (data: AuthenticateQRDto, userId: string): Promise<void> => {
  const session = await QRSession.findOne({
    sessionId: data.sessionId,
    qrToken: data.qrToken,
  });

  if (!session) {
    throw AppError.badRequest('Invalid QR session');
  }

  // Check if expired
  if (session.expiresAt < new Date()) {
    session.status = 'expired';
    await session.save();
    throw AppError.badRequest('QR session has expired');
  }

  // Check if already authenticated
  if (session.status === 'authenticated') {
    throw AppError.badRequest('QR session already authenticated');
  }

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }

  // Update session to authenticated
  session.status = 'authenticated';
  session.userId = user._id;
  session.scannedAt = session.scannedAt || new Date();
  session.authenticatedAt = new Date();
  await session.save();
};

export const scanQR = async (sessionId: string, qrToken: string): Promise<void> => {
  const session = await QRSession.findOne({
    sessionId,
    qrToken,
  });

  if (!session) {
    throw AppError.badRequest('Invalid QR session');
  }

  // Check if expired
  if (session.expiresAt < new Date()) {
    session.status = 'expired';
    await session.save();
    throw AppError.badRequest('QR session has expired');
  }

  // Update status to scanned
  if (session.status === 'pending') {
    session.status = 'scanned';
    session.scannedAt = new Date();
    await session.save();
  }
};
