import { useState, useCallback } from 'react';
import { removeBackgroundAI, magicWandSelect, applyMaskToRemoveBackground, invertMask } from '../utils/backgroundRemoval';
import type { GifFrame } from '../types/gif.types';

export type RemovalMode = 'ai' | 'manual';

interface UseBackgroundRemovalReturn {
  removeBackgroundFromFrame: (frame: GifFrame, mode: RemovalMode) => Promise<GifFrame>;
  removeBackgroundFromFrames: (frames: GifFrame[], mode: RemovalMode, onProgress?: (progress: number) => void) => Promise<GifFrame[]>;
  selectWithMagicWand: (imageData: ImageData, x: number, y: number, tolerance: number) => Uint8ClampedArray;
  applyMask: (frame: GifFrame, mask: Uint8ClampedArray, invert?: boolean) => GifFrame;
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

export function useBackgroundRemoval(): UseBackgroundRemovalReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const removeBackgroundFromFrame = useCallback(
    async (frame: GifFrame, mode: RemovalMode): Promise<GifFrame> => {
      setIsProcessing(true);
      setError(null);

      try {
        let processedImageData: ImageData;

        if (mode === 'ai') {
          processedImageData = await removeBackgroundAI(frame.imageData);
        } else {
          // For manual mode, we'll just return the frame as-is
          // The actual processing happens when user clicks
          processedImageData = frame.imageData;
        }

        // Create canvas for the processed frame
        const canvas = document.createElement('canvas');
        canvas.width = processedImageData.width;
        canvas.height = processedImageData.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        ctx.putImageData(processedImageData, 0, 0);

        return {
          ...frame,
          imageData: processedImageData,
          canvas,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to remove background';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const removeBackgroundFromFrames = useCallback(
    async (
      frames: GifFrame[],
      mode: RemovalMode,
      onProgress?: (progress: number) => void
    ): Promise<GifFrame[]> => {
      setIsProcessing(true);
      setError(null);
      setProgress(0);

      try {
        const processedFrames: GifFrame[] = [];

        for (let i = 0; i < frames.length; i++) {
          const frame = frames[i];
          const processedFrame = await removeBackgroundFromFrame(frame, mode);
          processedFrames.push(processedFrame);

          const currentProgress = Math.round(((i + 1) / frames.length) * 100);
          setProgress(currentProgress);
          onProgress?.(currentProgress);
        }

        return processedFrames;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to process frames';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsProcessing(false);
        setProgress(0);
      }
    },
    [removeBackgroundFromFrame]
  );

  const selectWithMagicWand = useCallback(
    (imageData: ImageData, x: number, y: number, tolerance: number): Uint8ClampedArray => {
      return magicWandSelect(imageData, x, y, tolerance);
    },
    []
  );

  const applyMask = useCallback(
    (frame: GifFrame, mask: Uint8ClampedArray, invert: boolean = false): GifFrame => {
      const finalMask = invert ? invertMask(mask) : mask;
      const processedImageData = applyMaskToRemoveBackground(frame.imageData, finalMask);

      const canvas = document.createElement('canvas');
      canvas.width = processedImageData.width;
      canvas.height = processedImageData.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      ctx.putImageData(processedImageData, 0, 0);

      return {
        ...frame,
        imageData: processedImageData,
        canvas,
      };
    },
    []
  );

  return {
    removeBackgroundFromFrame,
    removeBackgroundFromFrames,
    selectWithMagicWand,
    applyMask,
    isProcessing,
    progress,
    error,
  };
}
