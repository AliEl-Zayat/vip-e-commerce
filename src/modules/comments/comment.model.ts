import mongoose, { Schema } from 'mongoose';

export interface IComment extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  parentId?: mongoose.Types.ObjectId; // For nested replies
  upvotes: number;
  downvotes: number;
  isEdited: boolean;
  isModerated: boolean;
  moderationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      // Index defined at schema level: commentSchema.index({ productId: 1, createdAt: -1 })
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // Index defined at schema level: commentSchema.index({ userId: 1 })
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      // Index defined at schema level: commentSchema.index({ parentId: 1 })
    },
    upvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isModerated: {
      type: Boolean,
      default: false,
    },
    moderationReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ productId: 1, createdAt: -1 });
commentSchema.index({ parentId: 1 });
commentSchema.index({ userId: 1 });

export const Comment = mongoose.model<IComment>('Comment', commentSchema);

