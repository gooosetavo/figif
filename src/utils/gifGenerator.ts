import { encode } from 'modern-gif';
import type { GifFrame, ExportOptions } from '../types/gif.types';

export async function generateGif(
  frames: GifFrame[],
  options: ExportOptions = { quality: 10, loopCount: 0 }
): Promise<Blob> {
  if (frames.length === 0) {
    throw new Error('No frames to encode');
  }

  // Prepare frame data for modern-gif
  const frameData = frames.map((frame) => {
    // Convert ImageData to the format expected by modern-gif
    const canvas = frame.canvas || createCanvasFromFrame(frame);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    return {
      data: frame.imageData.data,
      delay: frame.delay,
      width: frame.imageData.width,
      height: frame.imageData.height,
    };
  });

  // Configure encoding options
  const encodingOptions = {
    width: frames[0].imageData.width,
    height: frames[0].imageData.height,
    repeat: options.loopCount, // 0 for infinite
    transparent: options.transparent,
    quality: options.quality, // 1-10, higher is better but larger file
  };

  // Encode the GIF
  const output = await encode(encodingOptions, frameData);

  // Convert to Blob
  return new Blob([output], { type: 'image/gif' });
}

function createCanvasFromFrame(frame: GifFrame): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = frame.imageData.width;
  canvas.height = frame.imageData.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  ctx.putImageData(frame.imageData, 0, 0);
  return canvas;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
