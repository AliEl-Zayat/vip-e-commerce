import multer from 'multer';
import { Request, RequestHandler } from 'express';
import { AppError } from '../utils/error.util';

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      AppError.badRequest(
        'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'
      ) as unknown as Error
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export const uploadSingle: RequestHandler = upload.single('image');
export const uploadMultiple: RequestHandler = upload.array('images', 10);
