import mongoose from 'mongoose';
import { PushToken, IPushToken, PushPlatform } from './push-notification.model';
import { RegisterPushTokenDto } from './dto/push-notification.dto';
import { AppError } from '../../utils/error.util';

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export class PushNotificationService {
  // In a real implementation, you would use Firebase Admin SDK or similar
  // For now, this is a placeholder that logs notifications
  private async sendPushNotification(
    token: string,
    platform: PushPlatform,
    payload: PushNotificationPayload
  ): Promise<void> {
    // TODO: Implement actual push notification sending using FCM or similar
    // Example with Firebase Admin SDK:
    // const message = {
    //   notification: {
    //     title: payload.title,
    //     body: payload.body,
    //   },
    //   data: payload.data as Record<string, string>,
    //   token: token,
    // };
    // await admin.messaging().send(message);

    console.log(`[Push Notification] Platform: ${platform}, Token: ${token.substring(0, 20)}...`);
    console.log(`Title: ${payload.title}`);
    console.log(`Body: ${payload.body}`);
    console.log(`Data:`, payload.data);
  }

  async registerToken(userId: string, data: RegisterPushTokenDto): Promise<IPushToken> {
    // Check if token already exists
    let token = await PushToken.findOne({ token: data.token });

    if (token) {
      // Update existing token
      token.userId = new mongoose.Types.ObjectId(userId);
      token.platform = data.platform;
      token.deviceId = data.deviceId;
      token.deviceName = data.deviceName;
      token.isActive = true;
      token.lastUsedAt = new Date();
      await token.save();
    } else {
      // Create new token
      token = await PushToken.create({
        userId: new mongoose.Types.ObjectId(userId),
        token: data.token,
        platform: data.platform,
        deviceId: data.deviceId,
        deviceName: data.deviceName,
      });
    }

    return token;
  }

  async unregisterToken(token: string): Promise<void> {
    await PushToken.findOneAndUpdate({ token }, { isActive: false });
  }

  async getUserTokens(userId: string): Promise<IPushToken[]> {
    return PushToken.find({
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true,
    });
  }

  async sendToUser(userId: string, payload: PushNotificationPayload): Promise<void> {
    const tokens = await this.getUserTokens(userId);

    if (tokens.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return;
    }

    // Send to all user's devices
    const promises = tokens.map(token =>
      this.sendPushNotification(token.token, token.platform, payload).catch(error => {
        console.error(`Failed to send push to token ${token.token}:`, error);
        // Mark token as inactive if sending fails
        if (error.code === 'messaging/registration-token-not-registered') {
          token.isActive = false;
          token.save().catch(console.error);
        }
      })
    );

    await Promise.allSettled(promises);
  }

  async sendToToken(token: string, payload: PushNotificationPayload): Promise<void> {
    const pushToken = await PushToken.findOne({ token, isActive: true });
    if (!pushToken) {
      throw AppError.notFound('Push token not found or inactive');
    }

    await this.sendPushNotification(pushToken.token, pushToken.platform, payload);
    pushToken.lastUsedAt = new Date();
    await pushToken.save();
  }

  async sendToAll(payload: PushNotificationPayload): Promise<void> {
    const tokens = await PushToken.find({ isActive: true });
    const promises = tokens.map(token =>
      this.sendPushNotification(token.token, token.platform, payload).catch(error => {
        console.error(`Failed to send push to token ${token.token}:`, error);
      })
    );

    await Promise.allSettled(promises);
  }

  async deleteToken(tokenId: string, userId: string): Promise<void> {
    const result = await PushToken.deleteOne({
      _id: tokenId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw AppError.notFound('Push token not found');
    }
  }
}

export const pushNotificationService = new PushNotificationService();
