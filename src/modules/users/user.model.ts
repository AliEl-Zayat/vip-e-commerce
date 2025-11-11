import mongoose, { Schema } from 'mongoose';
import { MongooseTransformReturn, MongooseTransformFn } from '../../types/mongoose.types';

export interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'seller' | 'customer';
  avatarUrl?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  otpCode?: string;
  otpExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Don't include password hash by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'seller', 'customer'],
        message: 'Role must be admin, seller, or customer',
      },
      default: 'customer',
    },
    avatarUrl: {
      type: String,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    otpCode: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: {
      transform: ((_doc, ret: MongooseTransformReturn) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.otpCode;
        delete ret.otpExpires;
        return ret;
      }) as MongooseTransformFn,
    },
    toObject: {
      transform: ((_doc, ret: MongooseTransformReturn) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }) as MongooseTransformFn,
    },
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
