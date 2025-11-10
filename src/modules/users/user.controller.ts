import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { UpdateProfileDto } from './dto/user.dto';
import { success } from '../../utils/response.util';
import { uploadToCloudinary } from '../../utils/cloudinary.util';
import { AppError } from '../../utils/error.util';

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const user = await userService.getProfile(req.user._id.toString());

      success(res, {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as UpdateProfileDto;
      const user = await userService.updateProfile(req.user._id.toString(), data);

      success(res, {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
