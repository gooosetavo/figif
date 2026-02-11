import { parseGIF, decompressFrames } from 'gifuct-js';
import type { DecodedGif, GifFrame, GifMetadata } from '../types/gif.types';

export async function parseGifFile(file: File): Promise<DecodedGif> {
  const arrayBuffer = await file.arrayBuffer();
  const gif = parseGIF(arrayBuffer);
  const frames = decompressFrames(gif, true);

  if (!frames || frames.length === 0) {
    throw new Error('No frames found in GIF');
  }

  // Get dimensions from first frame
  const width = frames[0].dims.width;
  const height = frames[0].dims.height;

  // Process each frame into ImageData
  const gifFrames: GifFrame[] = frames.map((frame) => {
    // Create canvas for this frame
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Create ImageData from frame patch
    const imageData = ctx.createImageData(frame.dims.width, frame.dims.height);
    imageData.data.set(frame.patch);

    // Draw to canvas at correct position
    ctx.putImageData(imageData, frame.dims.left, frame.dims.top);

    // Get full frame ImageData
    const fullImageData = ctx.getImageData(0, 0, width, height);

    return {
      imageData: fullImageData,
      delay: frame.delay || 100, // Default 100ms if not specified
      disposalType: frame.disposalType || 0,
      canvas,
    };
  });

  // Calculate metadata
  const totalDuration = gifFrames.reduce((sum, frame) => sum + frame.delay, 0);
  const loopCount = (gif as any).loop !== undefined ? (gif as any).loop : 0; // 0 = infinite

  const metadata: GifMetadata = {
    width,
    height,
    loopCount,
    frameCount: gifFrames.length,
    totalDuration,
  };

  return {
    frames: gifFrames,
    metadata,
  };
}

export function createCanvasFromImageData(imageData: ImageData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function cloneImageData(imageData: ImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
}
