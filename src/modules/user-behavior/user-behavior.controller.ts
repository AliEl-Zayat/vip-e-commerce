import { Request, Response, NextFunction } from 'express';
import { userBehaviorService } from './user-behavior.service';
import { TrackBehaviorDto } from './dto/user-behavior.dto';
import { success } from '../../utils/response.util';
import { asyncHandler } from '../../utils/async-handler.util';
import { isAuthenticated } from '../../utils/type-guards.util';
import { AppError } from '../../utils/error.util';

export class UserBehaviorController {
  track = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!isAuthenticated(req)) {
      throw AppError.unauthorized('User not authenticated');
    }

    const data = req.body as TrackBehaviorDto;
    const behavior = await userBehaviorService.track(req.user._id.toString(), data);

    success(
      res,
      {
        id: behavior._id.toString(),
        eventType: behavior.eventType,
        productId: behavior.productId?.toString(),
        categoryId: behavior.categoryId?.toString(),
        eventData: behavior.eventData,
        createdAt: behavior.createdAt,
      },
      201
    );
  });

  getStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!isAuthenticated(req)) {
      throw AppError.unauthorized('User not authenticated');
    }

    const stats = await userBehaviorService.getUserStats(req.user._id.toString());
    success(res, stats, 200);
  });

  getUserBehavior = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!isAuthenticated(req)) {
      throw AppError.unauthorized('User not authenticated');
    }

    const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const eventType = req.query.eventType as string | undefined;

    const { behaviors, meta } = await userBehaviorService.getUserBehavior(
      req.user._id.toString(),
      eventType as any,
      page,
      limit
    );

    success(
      res,
      behaviors.map((b: any) => ({
        id: b._id.toString(),
        eventType: b.eventType,
        product: b.productId
          ? {
              id: b.productId._id.toString(),
              title: b.productId.title,
              slug: b.productId.slug,
              price: b.productId.price,
              images: b.productId.images,
            }
          : null,
        category: b.categoryId
          ? {
              id: b.categoryId._id.toString(),
              name: b.categoryId.name,
              slug: b.categoryId.slug,
            }
          : null,
        eventData: b.eventData,
        createdAt: b.createdAt,
      })),
      200,
      meta as unknown as Record<string, unknown>
    );
  });
}

export const userBehaviorController = new UserBehaviorController();

