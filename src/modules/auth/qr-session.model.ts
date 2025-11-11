import mongoose, { Schema } from 'mongoose';

export type QRStatus = 'pending' | 'scanned' | 'authenticated' | 'expired' | 'cancelled';

export interface IQRSession extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  sessionId: string; // Unique session identifier
  qrToken: string; // Token embedded in QR code
  status: QRStatus;
  userId?: mongoose.Types.ObjectId; // Set when authenticated
  expiresAt: Date;
  scannedAt?: Date;
  authenticatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const qrSessionSchema = new Schema<IQRSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true, // unique: true automatically creates an index
    },
    qrToken: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'scanned', 'authenticated', 'expired', 'cancelled'],
      default: 'pending',
      // Index defined at schema level: qrSessionSchema.index({ sessionId: 1, status: 1 })
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index for auto-deletion
    },
    scannedAt: {
      type: Date,
    },
    authenticatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
qrSessionSchema.index({ qrToken: 1, status: 1 });
qrSessionSchema.index({ sessionId: 1, status: 1 });

export const QRSession = mongoose.model<IQRSession>('QRSession', qrSessionSchema);


