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

  // Create accumulation canvas for proper frame composition
  const accumulationCanvas = document.createElement('canvas');
  accumulationCanvas.width = width;
  accumulationCanvas.height = height;
  const accumulationCtx = accumulationCanvas.getContext('2d');

  if (!accumulationCtx) {
    throw new Error('Could not get canvas context');
  }

  let previousImageData: ImageData | null = null;

  // Process each frame into ImageData with proper disposal handling
  const gifFrames: GifFrame[] = frames.map((frame, index) => {
    // Handle disposal of previous frame
    if (index > 0) {
      const prevFrame = frames[index - 1];
      const prevDisposal = prevFrame.disposalType || 0;

      if (prevDisposal === 2) {
        // Disposal 2: Restore to background (clear)
        accumulationCtx.clearRect(
          prevFrame.dims.left,
          prevFrame.dims.top,
          prevFrame.dims.width,
          prevFrame.dims.height
        );
      } else if (prevDisposal === 3 && previousImageData) {
        // Disposal 3: Restore to previous
        accumulationCtx.putImageData(previousImageData, 0, 0);
      }
      // Disposal 0 or 1: Do nothing (leave as is)
    }

    // Save state before drawing if next frame might need it (disposal 3)
    if (frame.disposalType === 3) {
      previousImageData = accumulationCtx.getImageData(0, 0, width, height);
    }

    // Create ImageData from frame patch
    const patchCanvas = document.createElement('canvas');
    patchCanvas.width = frame.dims.width;
    patchCanvas.height = frame.dims.height;
    const patchCtx = patchCanvas.getContext('2d');

    if (!patchCtx) {
      throw new Error('Could not get canvas context');
    }

    const patchImageData = patchCtx.createImageData(frame.dims.width, frame.dims.height);
    patchImageData.data.set(frame.patch);
    patchCtx.putImageData(patchImageData, 0, 0);

    // Draw patch to accumulation canvas at correct position
    accumulationCtx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);

    // Get the composed frame
    const fullImageData = accumulationCtx.getImageData(0, 0, width, height);

    // Create output canvas for this frame
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    ctx.putImageData(fullImageData, 0, 0);

    return {
      imageData: cloneImageData(fullImageData),
      delay: frame.delay || 100, // Default 100ms if not specified
      disposalType: frame.disposalType || 0,
      canvas,
    };
  });

  // Calculate metadata
  const totalDuration = gifFrames.reduce((sum, frame) => sum + frame.delay, 0);
  // gifuct-js returns an object with optional loop property
  const loopCount = 'loop' in gif && typeof gif.loop === 'number' ? gif.loop : 0; // 0 = infinite

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
