import { Request, Response } from 'express';
import * as userService from './user.service';
import { UpdateProfileDto } from './dto/user.dto';
import { success } from '../../utils/response.util';
import { uploadToCloudinary } from '../../utils/cloudinary.util';
import { AppError } from '../../utils/error.util';
import { asyncHandler } from '../../utils/async-handler.util';

import { IUser } from './user.model';

// Pure function: Transform user to response format
export const transformUser = (user: IUser) => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name,
  role: user.role,
  avatarUrl: user.avatarUrl,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Controller handlers (functional programming approach)
export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new Error('User not authenticated');
  }

  const user = await userService.getProfile(req.user._id.toString());
  success(res, transformUser(user));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new Error('User not authenticated');
  }

  const data = req.body as UpdateProfileDto;
  const user = await userService.updateProfile(req.user._id.toString(), data);

  success(res, transformUser(user));
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new Error('User not authenticated');
  }

  if (!req.file) {
    throw AppError.badRequest('No file uploaded');
  }

  // Upload to Cloudinary
  const result = await uploadToCloudinary(req.file, `avatars/${req.user._id}`);

  // Update user profile
  const user = await userService.updateProfile(req.user._id.toString(), {
    avatarUrl: result.url,
  });

  success(res, {
    id: user._id.toString(),
    avatarUrl: user.avatarUrl,
  });
});
