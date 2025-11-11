import nodemailer from 'nodemailer';
import { config } from '../config';

// Create reusable transporter
const createTransporter = () => {
  // For development, use console logging
  if (config.nodeEnv === 'development' && !process.env.SMTP_HOST) {
    return {
      sendMail: async (options: EmailOptions) => {
        console.log('📧 Email (Development Mode):');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Body:', options.text || options.html);
        return { messageId: 'dev-mode-message-id' };
      },
    };
  }

  // For production or when SMTP is configured
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const transporter = createTransporter();

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@example.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    // In development, we don't want to fail if email sending fails
    if (config.nodeEnv === 'production') {
      throw error;
    }
  }
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4CAF50;">Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
    Password Reset Request
    
    You requested to reset your password. Click the link below to reset it:
    ${resetUrl}
    
    This link will expire in 1 hour. If you didn't request this, please ignore this email.
  `;

  await sendEmail({
    to: email,
    subject: 'Password Reset Request',
    text,
    html,
  });
};

export const sendOTPEmail = async (email: string, otpCode: string): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2196F3;">Your Login OTP Code</h2>
          <p>Your One-Time Password (OTP) for login is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; display: inline-block;">
              <h1 style="margin: 0; color: #2196F3; font-size: 36px; letter-spacing: 5px;">${otpCode}</h1>
            </div>
          </div>
          <p>Enter this code to complete your login. This code will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this OTP, please ignore this email.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
    Your Login OTP Code
    
    Your One-Time Password (OTP) for login is: ${otpCode}
    
    Enter this code to complete your login. This code will expire in 10 minutes.
    
    If you didn't request this OTP, please ignore this email.
  `;

  await sendEmail({
    to: email,
    subject: 'Your Login OTP Code',
    text,
    html,
  });
};
