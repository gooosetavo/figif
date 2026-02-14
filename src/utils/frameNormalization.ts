/**
 * Utilities for normalizing frame dimensions
 */

import type { GifFrame } from '../types/gif.types';

/**
 * Normalizes all frames to have the same dimensions (maximum width/height across all frames)
 * Frames are centered on the canvas if they're smaller than the max dimensions
 */
export function normalizeFrameDimensions(frames: GifFrame[]): GifFrame[] {
  if (frames.length === 0) return frames;

  // Calculate maximum dimensions across all frames
  const maxWidth = Math.max(...frames.map(f => f.imageData.width));
  const maxHeight = Math.max(...frames.map(f => f.imageData.height));

  // Check if normalization is needed
  const needsNormalization = frames.some(
    f => f.imageData.width !== maxWidth || f.imageData.height !== maxHeight
  );

  if (!needsNormalization) {
    return frames; // All frames already have the same dimensions
  }

  // Normalize each frame
  return frames.map(frame => {
    if (frame.imageData.width === maxWidth && frame.imageData.height === maxHeight) {
      return frame; // Frame already has correct dimensions
    }

    // Create a canvas with the maximum dimensions
    const canvas = document.createElement('canvas');
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Failed to get canvas context for frame normalization');
      return frame;
    }

    // Calculate offset to center the frame
    const offsetX = Math.floor((maxWidth - frame.imageData.width) / 2);
    const offsetY = Math.floor((maxHeight - frame.imageData.height) / 2);

    // Create a temporary canvas with the original frame
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = frame.imageData.width;
    tempCanvas.height = frame.imageData.height;
    const tempCtx = tempCanvas.getContext('2d');

    if (tempCtx) {
      tempCtx.putImageData(frame.imageData, 0, 0);
      ctx.drawImage(tempCanvas, offsetX, offsetY);
    }

    // Get the normalized image data
    const normalizedImageData = ctx.getImageData(0, 0, maxWidth, maxHeight);

    return {
      imageData: normalizedImageData,
      canvas: canvas,
      delay: frame.delay,
      disposalType: frame.disposalType,
    };
  });
}
