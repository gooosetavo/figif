import type { GifFrame } from '../types/gif.types';
import type { ExportOptions } from '../components/ExportModal';

/**
 * Export frames as PNG (single frame)
 */
export const exportAsPNG = async (frame: GifFrame, filename: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      frame.canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create PNG blob'));
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        resolve();
      }, 'image/png');
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Export frames as APNG (animated PNG)
 * Note: This is a placeholder. Full APNG encoding requires a library like upng-js
 */
export const exportAsAPNG = async (
  frames: GifFrame[],
  filename: string,
  options: ExportOptions,
  onProgress?: (progress: number) => void
): Promise<void> => {
  // For now, we'll fall back to exporting as a zip of PNGs
  // A full implementation would use a library like upng-js
  console.warn('APNG export not yet fully implemented. Exporting as individual PNGs.');

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const frameName = filename.replace(/\.(png|apng)$/i, `_frame_${i + 1}.png`);
    await exportAsPNG(frame, frameName);

    if (onProgress) {
      onProgress(Math.round(((i + 1) / frames.length) * 100));
    }
  }
};

/**
 * Export frames as WebP (animated or static)
 * Note: This is a placeholder. Full WebP encoding requires a library
 */
export const exportAsWebP = async (
  frames: GifFrame[],
  filename: string,
  options: ExportOptions,
  onProgress?: (progress: number) => void
): Promise<void> => {
  // WebP encoding is not natively supported in canvas
  // A full implementation would use a library like libwebp.js or wasm
  console.warn('WebP export not yet fully implemented. Exporting first frame as PNG.');

  if (frames.length > 0) {
    await exportAsPNG(frames[0], filename.replace(/\.webp$/i, '.png'));
  }

  if (onProgress) {
    onProgress(100);
  }
};

/**
 * Export frames as MP4 video
 * Note: This requires MediaRecorder API or a video encoding library
 */
export const exportAsMP4 = async (
  frames: GifFrame[],
  filename: string,
  options: ExportOptions,
  onProgress?: (progress: number) => void
): Promise<void> => {
  try {
    // Create a canvas to render frames
    const canvas = document.createElement('canvas');
    canvas.width = frames[0].imageData.width;
    canvas.height = frames[0].imageData.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Check if MediaRecorder is supported
    const stream = canvas.captureStream(options.fps || 30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm', // Most browsers support webm, not mp4 directly
      videoBitsPerSecond: 2500000
    });

    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.replace(/\.mp4$/i, '.webm'); // Save as webm
      link.click();
      URL.revokeObjectURL(url);
    };

    mediaRecorder.start();

    // Render frames at the specified FPS
    const frameDuration = 1000 / (options.fps || 30);
    for (let i = 0; i < frames.length; i++) {
      ctx.putImageData(frames[i].imageData, 0, 0);
      await new Promise(resolve => setTimeout(resolve, frameDuration));

      if (onProgress) {
        onProgress(Math.round(((i + 1) / frames.length) * 100));
      }
    }

    mediaRecorder.stop();
  } catch (error) {
    console.error('MP4 export failed:', error);
    throw new Error('Video export is not supported in this browser. Try exporting as GIF instead.');
  }
};

/**
 * Get appropriate filename based on format
 */
export const getExportFilename = (format: string, originalName = 'export'): string => {
  const baseName = originalName.replace(/\.[^/.]+$/, ''); // Remove existing extension
  return `${baseName}.${format}`;
};
