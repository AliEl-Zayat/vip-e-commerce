export const mockCloudinaryUpload = jest.fn(
  (callback: (error: unknown, result: unknown) => void) => {
    callback(null, {
      secure_url: 'https://res.cloudinary.com/test/image/upload/v1234567890/test.jpg',
      public_id: 'test/test',
    });
    return {
      end: jest.fn(),
    };
  }
);

export const mockCloudinaryDestroy = jest.fn(
  (_publicId: string, callback: (error: unknown, result: unknown) => void) => {
    callback(null, { result: 'ok' });
  }
);

jest.mock('../../src/config/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload_stream: mockCloudinaryUpload,
      destroy: mockCloudinaryDestroy,
    },
  },
}));
