/**
 * Utilities for calculating storage sizes of frames and workspaces
 */

import type { GifFrame } from '../types/gif.types';
import type { SerializedFrame } from '../types/workspace.types';

/**
 * Calculate the storage size of a single GifFrame in bytes
 */
export function calculateFrameSize(frame: GifFrame): number {
  // ImageData size (RGBA: 4 bytes per pixel)
  const imageDataSize = frame.imageData.width * frame.imageData.height * 4;

  // Additional frame metadata (approximate)
  const metadataSize = 20; // delay, disposalType, width, height, etc.

  return imageDataSize + metadataSize;
}

/**
 * Calculate the storage size of a serialized frame in bytes
 */
export function calculateSerializedFrameSize(frame: SerializedFrame): number {
  // Array data size (stored as numbers in JSON)
  const dataSize = frame.data.length;

  // Additional frame metadata
  const metadataSize = 20; // delay, disposalType, width, height

  return dataSize + metadataSize;
}

/**
 * Calculate total storage size for all frames
 */
export function calculateTotalSize(frames: GifFrame[]): number {
  return frames.reduce((total, frame) => total + calculateFrameSize(frame), 0);
}

/**
 * Calculate total storage size for serialized frames
 */
export function calculateSerializedTotalSize(frames: SerializedFrame[]): number {
  return frames.reduce((total, frame) => total + calculateSerializedFrameSize(frame), 0);
}

/**
 * Estimate compressed GIF size based on raw frame data
 * GIF compression typically achieves 10-20x compression for typical images
 * This is a rough estimate based on common compression ratios
 */
export function estimateGifSize(rawSize: number): number {
  // Conservative estimate: assume 12x compression ratio
  // This varies based on image complexity and color count
  return Math.round(rawSize / 12);
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
