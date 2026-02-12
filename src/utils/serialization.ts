/**
 * Utilities for serializing and deserializing GIF frames for storage
 */

import type { GifFrame } from '../types/gif.types';
import type { SerializedFrame } from '../types/workspace.types';

/**
 * Convert a GifFrame to a SerializedFrame for storage
 */
export function serializeFrame(frame: GifFrame): SerializedFrame {
  return {
    width: frame.imageData.width,
    height: frame.imageData.height,
    data: Array.from(frame.imageData.data), // Convert Uint8ClampedArray to regular array
    delay: frame.delay,
    disposalType: frame.disposalType,
  };
}

/**
 * Convert a SerializedFrame back to a GifFrame
 */
export function deserializeFrame(serialized: SerializedFrame): GifFrame {
  // Create ImageData from serialized data
  const imageData = new ImageData(
    new Uint8ClampedArray(serialized.data),
    serialized.width,
    serialized.height
  );

  // Create canvas and draw the image data
  const canvas = document.createElement('canvas');
  canvas.width = serialized.width;
  canvas.height = serialized.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context for frame deserialization');
  }

  ctx.putImageData(imageData, 0, 0);

  return {
    imageData,
    canvas,
    delay: serialized.delay,
    disposalType: serialized.disposalType,
  };
}

/**
 * Serialize multiple frames
 */
export function serializeFrames(frames: GifFrame[]): SerializedFrame[] {
  return frames.map(serializeFrame);
}

/**
 * Deserialize multiple frames
 */
export function deserializeFrames(serialized: SerializedFrame[]): GifFrame[] {
  return serialized.map(deserializeFrame);
}

/**
 * Generate a thumbnail data URL from a frame
 */
export function generateThumbnail(frame: GifFrame, maxWidth = 100, maxHeight = 100): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context for thumbnail generation');
  }

  // Calculate thumbnail dimensions maintaining aspect ratio
  const aspectRatio = frame.imageData.width / frame.imageData.height;
  let thumbWidth = maxWidth;
  let thumbHeight = maxHeight;

  if (aspectRatio > 1) {
    thumbHeight = Math.round(maxWidth / aspectRatio);
  } else {
    thumbWidth = Math.round(maxHeight * aspectRatio);
  }

  canvas.width = thumbWidth;
  canvas.height = thumbHeight;

  // Draw scaled frame
  if (frame.canvas) {
    ctx.drawImage(frame.canvas, 0, 0, thumbWidth, thumbHeight);
  } else {
    // If no canvas, create one from imageData
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = frame.imageData.width;
    tempCanvas.height = frame.imageData.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(frame.imageData, 0, 0);
      ctx.drawImage(tempCanvas, 0, 0, thumbWidth, thumbHeight);
    }
  }

  // Return as data URL
  return canvas.toDataURL('image/png');
}
