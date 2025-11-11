import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  port: number;
  nodeEnv: string;
  mongodb: {
    uri: string;
  };
  jwt: {
    accessTokenSecret: string;
    refreshTokenSecret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  cors: {
    origin: string | string[];
  };
}

const getConfig = (): Config => {
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_ACCESS_TOKEN_SECRET',
    'JWT_REFRESH_TOKEN_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];

  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    mongodb: {
      uri: process.env.MONGODB_URI!,
    },
    jwt: {
      accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET!,
      refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET!,
      accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
      refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      apiSecret: process.env.CLOUDINARY_API_SECRET!,
    },
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
    },
  };
};

export const config = getConfig();
