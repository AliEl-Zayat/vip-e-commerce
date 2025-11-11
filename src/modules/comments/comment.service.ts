import mongoose from 'mongoose';
import { Comment, IComment } from './comment.model';
import { CreateCommentDto, UpdateCommentDto, ModerateCommentDto } from './dto/comment.dto';
import { Product } from '../products/product.model';
import { AppError } from '../../utils/error.util';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.util';

export class CommentService {
  async create(userId: string, data: CreateCommentDto): Promise<IComment> {
    const product = await Product.findById(data.productId);
    if (!product) {
      throw AppError.notFound('Product not found');
    }

    // If parentId is provided, verify it exists and belongs to the same product
    if (data.parentId) {
      const parentComment = await Comment.findById(data.parentId);
      if (!parentComment) {
        throw AppError.notFound('Parent comment not found');
      }
      if (parentComment.productId.toString() !== data.productId) {
        throw AppError.badRequest('Parent comment must belong to the same product');
      }
    }

    const comment = await Comment.create({
      productId: new mongoose.Types.ObjectId(data.productId),
      userId: new mongoose.Types.ObjectId(userId),
      content: data.content,
      parentId: data.parentId ? new mongoose.Types.ObjectId(data.parentId) : undefined,
    });

    return comment.populate('userId', 'name email avatarUrl');
  }

  async update(commentId: string, userId: string, data: UpdateCommentDto): Promise<IComment> {
    const comment = await Comment.findOne({
      _id: commentId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!comment) {
      throw AppError.notFound('Comment not found');
    }

    if (data.content !== undefined) {
      comment.content = data.content;
      comment.isEdited = true;
    }

    await comment.save();
    return comment.populate('userId', 'name email avatarUrl');
  }

  async delete(commentId: string, userId: string, userRole: string): Promise<void> {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw AppError.notFound('Comment not found');
    }

    // Users can only delete their own comments, admins can delete any
    if (userRole !== 'admin' && comment.userId.toString() !== userId) {
      throw AppError.forbidden('You can only delete your own comments');
    }

    // Delete all replies if this is a parent comment
    await Comment.deleteMany({ parentId: commentId });
    await Comment.findByIdAndDelete(commentId);
  }

  async getProductComments(
    productId: string,
    page?: number,
    limit?: number,
    includeReplies = false
  ) {
    const { skip, limit: queryLimit } = parsePagination({ page, limit });

    const filter: Record<string, unknown> = {
      productId: new mongoose.Types.ObjectId(productId),
      isModerated: false, // Only show non-moderated comments
    };

    if (!includeReplies) {
      filter.parentId = null; // Only top-level comments
    }

    const [comments, totalItems] = await Promise.all([
      Comment.find(filter)
        .populate('userId', 'name email avatarUrl')
        .populate('parentId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(queryLimit),
      Comment.countDocuments(filter),
    ]);

    // If including replies, organize them hierarchically
    let organizedComments = comments;
    if (includeReplies) {
      organizedComments = this.organizeComments(comments as any[]);
    }

    const meta = buildPaginationMeta(page || 1, queryLimit, totalItems);

    return { comments: organizedComments, meta };
  }

  async getReplies(commentId: string, page?: number, limit?: number) {
    const { skip, limit: queryLimit } = parsePagination({ page, limit });

    const [replies, totalItems] = await Promise.all([
      Comment.find({
        parentId: new mongoose.Types.ObjectId(commentId),
        isModerated: false,
      })
        .populate('userId', 'name email avatarUrl')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(queryLimit),
      Comment.countDocuments({ parentId: new mongoose.Types.ObjectId(commentId) }),
    ]);

    const meta = buildPaginationMeta(page || 1, queryLimit, totalItems);

    return { replies, meta };
  }

  async upvote(commentId: string): Promise<IComment> {
    const comment = await Comment.findByIdAndUpdate(
      commentId,
      { $inc: { upvotes: 1 } },
      { new: true }
    );

    if (!comment) {
      throw AppError.notFound('Comment not found');
    }

    return comment;
  }

  async downvote(commentId: string): Promise<IComment> {
    const comment = await Comment.findByIdAndUpdate(
      commentId,
      { $inc: { downvotes: 1 } },
      { new: true }
    );

    if (!comment) {
      throw AppError.notFound('Comment not found');
    }

    return comment;
  }

  async moderate(commentId: string, data: ModerateCommentDto): Promise<IComment> {
    const comment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $set: {
          isModerated: data.isModerated,
          moderationReason: data.moderationReason,
        },
      },
      { new: true }
    );

    if (!comment) {
      throw AppError.notFound('Comment not found');
    }

    return comment;
  }

  private organizeComments(comments: any[]): any[] {
    const commentMap = new Map();
    const rootComments: any[] = [];

    // First pass: create map of all comments
    comments.forEach((comment) => {
      commentMap.set(comment._id.toString(), { ...comment.toObject(), replies: [] });
    });

    // Second pass: organize hierarchy
    comments.forEach((comment) => {
      const commentObj = commentMap.get(comment._id.toString());
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId.toString());
        if (parent) {
          parent.replies.push(commentObj);
        }
      } else {
        rootComments.push(commentObj);
      }
    });

    return rootComments;
  }
}

export const commentService = new CommentService();

