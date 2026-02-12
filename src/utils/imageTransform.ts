/**
 * Image transformation utilities for GIF frames
 */

import type { GifFrame } from '../types/gif.types';

/**
 * Resize a single frame
 */
export function resizeFrame(frame: GifFrame, newWidth: number, newHeight: number): GifFrame {
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context for resizing');
  }

  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw the original frame scaled to new dimensions
  if (frame.canvas) {
    ctx.drawImage(frame.canvas, 0, 0, newWidth, newHeight);
  } else {
    // If no canvas, create one from imageData
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = frame.imageData.width;
    tempCanvas.height = frame.imageData.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(frame.imageData, 0, 0);
      ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
    }
  }

  // Get the new image data
  const imageData = ctx.getImageData(0, 0, newWidth, newHeight);

  return {
    imageData,
    canvas,
    delay: frame.delay,
    disposalType: frame.disposalType,
  };
}

/**
 * Resize all frames
 */
export function resizeFrames(
  frames: GifFrame[],
  newWidth: number,
  newHeight: number,
  onProgress?: (progress: number) => void
): GifFrame[] {
  return frames.map((frame, index) => {
    const resizedFrame = resizeFrame(frame, newWidth, newHeight);
    if (onProgress) {
      const progress = Math.round(((index + 1) / frames.length) * 100);
      onProgress(progress);
    }
    return resizedFrame;
  });
}

/**
 * Crop a single frame
 */
export function cropFrame(
  frame: GifFrame,
  x: number,
  y: number,
  width: number,
  height: number
): GifFrame {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context for cropping');
  }

  // Draw the cropped portion
  if (frame.canvas) {
    ctx.drawImage(frame.canvas, x, y, width, height, 0, 0, width, height);
  } else {
    // If no canvas, create one from imageData
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = frame.imageData.width;
    tempCanvas.height = frame.imageData.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(frame.imageData, 0, 0);
      ctx.drawImage(tempCanvas, x, y, width, height, 0, 0, width, height);
    }
  }

  // Get the cropped image data
  const imageData = ctx.getImageData(0, 0, width, height);

  return {
    imageData,
    canvas,
    delay: frame.delay,
    disposalType: frame.disposalType,
  };
}

/**
 * Crop all frames
 */
export function cropFrames(
  frames: GifFrame[],
  x: number,
  y: number,
  width: number,
  height: number,
  onProgress?: (progress: number) => void
): GifFrame[] {
  return frames.map((frame, index) => {
    const croppedFrame = cropFrame(frame, x, y, width, height);
    if (onProgress) {
      const progress = Math.round(((index + 1) / frames.length) * 100);
      onProgress(progress);
    }
    return croppedFrame;
  });
}
