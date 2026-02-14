import { encode } from 'modern-gif';
import type { GifFrame, ExportOptions } from '../types/gif.types';

export async function generateGif(
  frames: GifFrame[],
  options: ExportOptions = { quality: 10, loopCount: 0 }
): Promise<Blob> {
  if (frames.length === 0) {
    throw new Error('No frames to encode');
  }

  // All frames should already be normalized to the same dimensions at the workspace level
  // But calculate maximum bounds as a safety measure
  const maxWidth = Math.max(...frames.map(f => f.imageData.width));
  const maxHeight = Math.max(...frames.map(f => f.imageData.height));

  // Prepare frame data for modern-gif
  // Note: We pass fully composed frames (not patches) since we've already
  // handled disposal methods during decoding
  const frameData = frames.map((frame) => {
    // If frame dimensions don't match max bounds (shouldn't happen after normalization),
    // center it on a larger canvas as a fallback
    if (frame.imageData.width !== maxWidth || frame.imageData.height !== maxHeight) {
      console.warn('Frame size mismatch detected - normalizing at export time');
      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = maxHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Center the frame
        const offsetX = Math.floor((maxWidth - frame.imageData.width) / 2);
        const offsetY = Math.floor((maxHeight - frame.imageData.height) / 2);

        // Create a temporary canvas with the frame
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = frame.imageData.width;
        tempCanvas.height = frame.imageData.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.putImageData(frame.imageData, 0, 0);
          ctx.drawImage(tempCanvas, offsetX, offsetY);
        }

        // Get the centered image data
        const centeredImageData = ctx.getImageData(0, 0, maxWidth, maxHeight);

        return {
          data: centeredImageData.data,
          delay: frame.delay,
          width: maxWidth,
          height: maxHeight,
        };
      }
    }

    return {
      data: frame.imageData.data,
      delay: frame.delay,
      width: frame.imageData.width,
      height: frame.imageData.height,
      // modern-gif will use disposal method 1 (do not dispose) by default
      // which is correct since we're passing full frames, not patches
    };
  });

  // Configure encoding options with frame dimensions
  const encodingOptions = {
    width: maxWidth,
    height: maxHeight,
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
