import { Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'seller' | 'customer';
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
