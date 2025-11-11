import { Request, Response, NextFunction } from 'express';
import { commentService } from './comment.service';
import { CreateCommentDto, UpdateCommentDto, ModerateCommentDto } from './dto/comment.dto';
import { success } from '../../utils/response.util';

export class CommentController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = req.body as CreateCommentDto;
      const comment = await commentService.create(req.user._id.toString(), data);

      success(
        res,
        {
          id: comment._id.toString(),
          productId: comment.productId.toString(),
          userId: (comment.userId as any)?._id?.toString(),
          user: comment.userId
            ? {
                id: (comment.userId as any)._id.toString(),
                name: (comment.userId as any).name,
                avatarUrl: (comment.userId as any).avatarUrl,
              }
            : null,
          content: comment.content,
          parentId: comment.parentId?.toString(),
          upvotes: comment.upvotes,
          downvotes: comment.downvotes,
          isEdited: comment.isEdited,
          createdAt: comment.createdAt,
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

      success(
        res,
        Array.isArray(comments)
          ? comments.map((c: any) => ({
              id: c._id?.toString() || c.id,
              user: c.userId
                ? {
                    id: c.userId._id?.toString(),
                    name: c.userId.name,
                    avatarUrl: c.userId.avatarUrl,
                  }
                : c.user,
              content: c.content,
              parentId: c.parentId?.toString(),
              upvotes: c.upvotes,
              downvotes: c.downvotes,
              isEdited: c.isEdited,
              replies: c.replies || [],
              createdAt: c.createdAt,
            }))
          : [],
        200,
        meta as unknown as Record<string, unknown>
      );
    } catch (err) {
      next(err);
    }
  }

  async getReplies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

      const { replies, meta } = await commentService.getReplies(req.params.id, page, limit);

      success(
        res,
        replies.map((r: any) => ({
          id: r._id.toString(),
          user: r.userId
            ? {
                id: r.userId._id.toString(),
                name: r.userId.name,
                avatarUrl: r.userId.avatarUrl,
              }
            : null,
          content: r.content,
          upvotes: r.upvotes,
          downvotes: r.downvotes,
          createdAt: r.createdAt,
        })),
        200,
        meta as unknown as Record<string, unknown>
      );
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

