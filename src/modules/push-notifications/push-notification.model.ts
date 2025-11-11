import mongoose, { Schema } from 'mongoose';

export type PushPlatform = 'ios' | 'android' | 'web';

export interface IPushToken extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  token: string;
  platform: PushPlatform;
  deviceId?: string;
  deviceName?: string;
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pushTokenSchema = new Schema<IPushToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // Index defined at schema level: pushTokenSchema.index({ userId: 1, isActive: 1 })
    },
    token: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true,
    },
    deviceId: {
      type: String,
    },
    deviceName: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      // Index defined at schema level: pushTokenSchema.index({ userId: 1, isActive: 1 })
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

pushTokenSchema.index({ userId: 1, isActive: 1 });
pushTokenSchema.index({ token: 1 }, { unique: true });

export const PushToken = mongoose.model<IPushToken>('PushToken', pushTokenSchema);
