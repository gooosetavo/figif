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
  // Note: We pass fully composed frames (not patches) since we've already
  // handled disposal methods during decoding
  const frameData = frames.map((frame) => {
    return {
      data: frame.imageData.data,
      delay: frame.delay,
      width: frame.imageData.width,
      height: frame.imageData.height,
      // modern-gif will use disposal method 1 (do not dispose) by default
      // which is correct since we're passing full frames, not patches
    };
  });

  // Configure encoding options with frame data
  const encodingOptions = {
    width: frames[0].imageData.width,
    height: frames[0].imageData.height,
    repeat: options.loopCount, // 0 for infinite
    transparent: options.transparent,
    quality: options.quality, // 1-10, higher is better but larger file
    frames: frameData,
  };

  // Encode the GIF
  const output = await encode(encodingOptions);

  // Convert to Blob
  return new Blob([output], { type: 'image/gif' });
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
