import { Request, Response, NextFunction } from 'express';
import { pushNotificationService } from './push-notification.service';
import { RegisterPushTokenDto } from './dto/push-notification.dto';
import { success } from '../../utils/response.util';

export class PushNotificationController {
  async registerToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as RegisterPushTokenDto;
      const token = await pushNotificationService.registerToken(req.user._id.toString(), data);

      success(
        res,
        {
          id: token._id.toString(),
          platform: token.platform,
          deviceId: token.deviceId,
          deviceName: token.deviceName,
          isActive: token.isActive,
          createdAt: token.createdAt,
        },
        201
      );
    } catch (err) {
      next(err);
    }
  }

  async unregisterToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.body.token as string;
      if (!token) {
        throw new Error('Token is required');
      }

      await pushNotificationService.unregisterToken(token);
      success(res, { message: 'Token unregistered successfully' }, 200);
    } catch (err) {
      next(err);
    }
  }

  async getUserTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const tokens = await pushNotificationService.getUserTokens(req.user._id.toString());

      success(
        res,
        tokens.map(token => ({
          id: token._id.toString(),
          platform: token.platform,
          deviceId: token.deviceId,
          deviceName: token.deviceName,
          isActive: token.isActive,
          lastUsedAt: token.lastUsedAt,
          createdAt: token.createdAt,
        }))
      );
    } catch (err) {
      next(err);
    }
  }

  async deleteToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      await pushNotificationService.deleteToken(req.params.id, req.user._id.toString());
      success(res, { message: 'Token deleted successfully' }, 200);
    } catch (err) {
      next(err);
    }
  }
}

export const pushNotificationController = new PushNotificationController();
