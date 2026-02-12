/**
 * Utility to convert static images (PNG, JPG, WebP, etc.) to GIF format
 */

import type { DecodedGif } from '../types/gif.types';

/**
 * Convert a static image file to a single-frame GIF
 */
export async function convertImageToGif(file: File): Promise<DecodedGif> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        // Create canvas to draw the image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        // Draw the image
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Create single-frame GIF
        const decodedGif: DecodedGif = {
          frames: [
            {
              imageData,
              canvas,
              delay: 100, // Default 100ms delay
              disposalType: 0,
            },
          ],
          metadata: {
            width: img.width,
            height: img.height,
            loopCount: 0, // No loop for static images (or 0 for infinite)
            frameCount: 1,
            totalDuration: 100,
          },
        };

        URL.revokeObjectURL(url);
        resolve(decodedGif);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Check if a file is a GIF
 */
export function isGifFile(file: File): boolean {
  return file.type === 'image/gif';
}

/**
 * Check if a file is a supported image type
 */
export function isSupportedImageFile(file: File): boolean {
  const supportedTypes = [
    'image/gif',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
  ];

  return supportedTypes.includes(file.type);
}
