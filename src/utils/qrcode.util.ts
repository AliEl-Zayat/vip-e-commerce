import QRCode from 'qrcode';

/**
 * Generate QR code as data URL (for embedding in HTML)
 */
export const generateQRCodeDataURL = async (data: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1,
    });
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate QR code as SVG string
 */
export const generateQRCodeSVG = async (data: string): Promise<string> => {
  try {
    return await QRCode.toString(data, {
      type: 'svg',
      width: 300,
      margin: 1,
    });
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate QR code as buffer (for API responses)
 */
export const generateQRCodeBuffer = async (data: string): Promise<Buffer> => {
  try {
    return await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1,
    });
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

