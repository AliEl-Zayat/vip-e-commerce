import type { HydratedDocument, Types } from 'mongoose';
import type { IComment } from './comment.model';
import type { IUser } from '../users/user.model';

export type CommentDocument = HydratedDocument<IComment>;

export type PopulatedCommentDocument = CommentDocument & {
  userId: IUser | Types.ObjectId;
  parentId?: PopulatedCommentDocument | Types.ObjectId | null;
};

export interface CommentUserSummary {
  id: string;
  name?: string;
  avatarUrl?: string;
}

export interface CommentDto {
  id: string;
  productId: string;
  userId: string | null;
  user: CommentUserSummary | null;
  content: string;
  parentId: string | null;
  upvotes: number;
  downvotes: number;
  isEdited: boolean;
  createdAt: Date;
  replies: CommentDto[];
}

const isUserDocument = (value: unknown): value is IUser => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record._id !== 'undefined' && typeof record.email === 'string';
};

const resolveObjectId = (
  value: Types.ObjectId | PopulatedCommentDocument | null | undefined
): string | null => {
  if (!value) {
    return null;
  }

  if (typeof (value as { toString?: () => string }).toString === 'function') {
    return value.toString();
  }

  return null;
};

const toUserSummary = (user: IUser | Types.ObjectId): CommentUserSummary | null => {
  if (isUserDocument(user)) {
    return {
      id: user._id.toString(),
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  }

  return {
    id: user.toString(),
  };
};

export const mapCommentToDto = (comment: PopulatedCommentDocument): CommentDto => ({
  id: comment._id.toString(),
  productId: comment.productId.toString(),
  userId: comment.userId
    ? isUserDocument(comment.userId)
      ? comment.userId._id.toString()
      : comment.userId.toString()
    : null,
  user: comment.userId ? toUserSummary(comment.userId) : null,
  content: comment.content,
  parentId: resolveObjectId(comment.parentId ?? null),
  upvotes: comment.upvotes,
  downvotes: comment.downvotes,
  isEdited: comment.isEdited,
  createdAt: comment.createdAt,
  replies: [],
});

export const attachReply = (parent: CommentDto, reply: CommentDto): void => {
  parent.replies.push(reply);
};
