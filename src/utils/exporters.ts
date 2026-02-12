import UPNG from 'upng-js';
import type { GifFrame } from '../types/gif.types';
import type { ExportOptions } from '../components/ExportModal';

/**
 * Export frames as PNG (single frame)
 */
export const exportAsPNG = async (frame: GifFrame, filename: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (!frame.canvas) {
        reject(new Error('Frame canvas is not available'));
        return;
      }

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
 * Export frames as APNG (animated PNG) using upng-js
 */
export const exportAsAPNG = async (
  frames: GifFrame[],
  filename: string,
  options: ExportOptions,
  onProgress?: (progress: number) => void
): Promise<void> => {
  try {
    if (frames.length === 0) {
      throw new Error('No frames to export');
    }

    // Collect frame data as RGBA buffers
    const width = frames[0].imageData.width;
    const height = frames[0].imageData.height;
    const frameBuffers: ArrayBuffer[] = [];
    const delays: number[] = [];

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      // Get RGBA data from ImageData
      frameBuffers.push(frame.imageData.data.buffer);
      // Use frame delay, default to 100ms if not available
      delays.push(frame.delay || 100);

      if (onProgress) {
        onProgress(Math.round(((i + 1) / frames.length) * 50)); // First 50%
      }
    }

    // Encode as APNG
    // cnum = 0 for RGBA (no color compression)
    // Note: UPNG doesn't directly support loop count in encode, APNG loops infinitely by default
    void options; // Loop count not used in UPNG.encode
    const apngBuffer = UPNG.encode(frameBuffers, width, height, 0, delays);

    if (onProgress) {
      onProgress(75); // Encoding done
    }

    // Create blob and download
    const blob = new Blob([apngBuffer], { type: 'image/apng' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    if (onProgress) {
      onProgress(100);
    }
  } catch (error) {
    console.error('APNG export failed:', error);
    throw new Error('APNG export failed. Try exporting as GIF instead.');
  }
};

/**
 * Export frames as WebP (static image)
 * Note: Animated WebP encoding is not natively supported in browsers
 * This exports the first frame as a static WebP image
 */
export const exportAsWebP = async (
  frames: GifFrame[],
  filename: string,
  options: ExportOptions,
  onProgress?: (progress: number) => void
): Promise<void> => {
  try {
    if (frames.length === 0) {
      throw new Error('No frames to export');
    }

    // Export first frame (or current selected frame) as static WebP
    const frame = frames[0];

    if (!frame.canvas) {
      throw new Error('Frame canvas is not available');
    }

    // Use quality option (1-20 scale to 0-1 scale for WebP)
    const quality = options.quality / 20;

    return new Promise((resolve, reject) => {
      frame.canvas!.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create WebP blob'));
            return;
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);

          if (onProgress) {
            onProgress(100);
          }

          resolve();
        },
        'image/webp',
        quality
      );
    });
  } catch (error) {
    console.error('WebP export failed:', error);
    throw new Error('WebP export is not supported in this browser. Try exporting as PNG or GIF instead.');
  }
};

/**
 * Export frames as WebM video using MediaRecorder API
 */
export const exportAsWebM = async (
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
      mimeType: 'video/webm',
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
      link.download = filename;
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
    console.error('WebM export failed:', error);
    throw new Error('Video export is not supported in this browser. Try exporting as GIF instead.');
  }
};

/**
 * Export frames as MP4 video
 * Note: MP4 encoding is not supported in browsers - use WebM instead
 */
export const exportAsMP4 = async (
  frames: GifFrame[],
  filename: string,
  options: ExportOptions,
  onProgress?: (progress: number) => void
): Promise<void> => {
  // Reference parameters to avoid unused warnings
  void frames;
  void filename;
  void options;
  void onProgress;
  throw new Error('MP4 export is not supported. Please use WebM format instead.');
};

/**
 * Get appropriate filename based on format
 */
export const getExportFilename = (format: string, originalName = 'export'): string => {
  const baseName = originalName.replace(/\.[^/.]+$/, ''); // Remove existing extension
  return `${baseName}.${format}`;
};
