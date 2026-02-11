import { useState, useCallback } from 'react';
import { generateGif, downloadBlob } from '../utils/gifGenerator';
import type { GifFrame, ExportOptions } from '../types/gif.types';

interface UseGifEncoderReturn {
  encodeGif: (frames: GifFrame[], options?: ExportOptions) => Promise<Blob>;
  downloadGif: (frames: GifFrame[], filename: string, options?: ExportOptions) => Promise<void>;
  isEncoding: boolean;
  progress: number; // 0-100
  error: string | null;
}

export function useGifEncoder(): UseGifEncoderReturn {
  const [isEncoding, setIsEncoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const encodeGif = useCallback(
    async (frames: GifFrame[], options?: ExportOptions): Promise<Blob> => {
      setIsEncoding(true);
      setProgress(0);
      setError(null);

      try {
        if (frames.length === 0) {
          throw new Error('No frames to encode');
        }

        // Simulate progress (modern-gif doesn't provide real progress)
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const blob = await generateGif(frames, options);

        clearInterval(progressInterval);
        setProgress(100);

        return blob;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to encode GIF';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsEncoding(false);
        setTimeout(() => setProgress(0), 1000);
      }
    },
    []
  );

  const downloadGif = useCallback(
    async (frames: GifFrame[], filename: string, options?: ExportOptions): Promise<void> => {
      try {
        const blob = await encodeGif(frames, options);
        downloadBlob(blob, filename);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to download GIF';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [encodeGif]
  );

  return {
    encodeGif,
    downloadGif,
    isEncoding,
    progress,
    error,
  };
}
