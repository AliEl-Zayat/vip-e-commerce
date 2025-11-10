import { cloudinary } from '../config/cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { AppError } from './error.util';

export interface CloudinaryUploadResult {
  url: string;
  id: string;
}

export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(AppError.badRequest(`Cloudinary upload failed: ${error.message}`));
        } else if (result) {
          resolve({
            url: result.secure_url,
            id: result.public_id,
          });
        } else {
          reject(AppError.badRequest('Cloudinary upload failed: Unknown error'));
        }
      }
    );

    uploadStream.end(file.buffer);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(AppError.badRequest(`Cloudinary delete failed: ${error.message}`));
      } else if (result?.result === 'ok') {
        resolve();
      } else {
        reject(AppError.badRequest('Cloudinary delete failed: Unknown error'));
      }
    });
  });
};

