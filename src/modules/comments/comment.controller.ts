import { Request, Response, NextFunction } from 'express';
import { commentService } from './comment.service';
import { CreateCommentDto, UpdateCommentDto, ModerateCommentDto } from './dto/comment.dto';
import { success } from '../../utils/response.util';
import { mapCommentToDto, CommentDto } from './comment.types';

export class CommentController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as CreateCommentDto;
      const comment = await commentService.create(req.user._id.toString(), data);
      const dto = mapCommentToDto(comment);

      success(
        res,
        {
          id: dto.id,
          productId: dto.productId,
          userId: dto.userId,
          user: dto.user,
          content: dto.content,
          parentId: dto.parentId,
          upvotes: dto.upvotes,
          downvotes: dto.downvotes,
          isEdited: dto.isEdited,
          createdAt: dto.createdAt,
        },
        201
      );
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as UpdateCommentDto;
      const comment = await commentService.update(req.params.id, req.user._id.toString(), data);

      success(res, {
        id: comment._id.toString(),
        content: comment.content,
        isEdited: comment.isEdited,
        updatedAt: comment.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      await commentService.delete(req.params.id, req.user._id.toString(), req.user.role);
      success(res, { message: 'Comment deleted successfully' }, 200);
    } catch (err) {
      next(err);
    }
  }

  async getProductComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
      const includeReplies = req.query.includeReplies === 'true';

      const { comments, meta } = await commentService.getProductComments(
        req.params.productId,
        page,
        limit,
        includeReplies
      );

      success(res, comments as CommentDto[], 200, meta as unknown as Record<string, unknown>);
    } catch (err) {
      next(err);
    }
  }

  async getReplies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

      const { replies, meta } = await commentService.getReplies(req.params.id, page, limit);

      success(res, replies as CommentDto[], 200, meta as unknown as Record<string, unknown>);
    } catch (err) {
      next(err);
    }
  }

  async upvote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const comment = await commentService.upvote(req.params.id);
      success(res, {
        id: comment._id.toString(),
        upvotes: comment.upvotes,
      });
    } catch (err) {
      next(err);
    }
  }

  async downvote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const comment = await commentService.downvote(req.params.id);
      success(res, {
        id: comment._id.toString(),
        downvotes: comment.downvotes,
      });
    } catch (err) {
      next(err);
    }
  }

  async moderate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as ModerateCommentDto;
      const comment = await commentService.moderate(req.params.id, data);
      success(res, {
        id: comment._id.toString(),
        isModerated: comment.isModerated,
        moderationReason: comment.moderationReason,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const commentController = new CommentController();
