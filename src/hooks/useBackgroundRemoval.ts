import { useState, useCallback, useRef } from 'react';
import { removeBackgroundAI, magicWandSelect, applyMaskToRemoveBackground, invertMask } from '../utils/backgroundRemoval';
import type { GifFrame, AIBackgroundRemovalConfig } from '../types/gif.types';
import type { ProcessingMode } from '../services/grpcClient';
import { sessionClient } from '../services/sessionClient';

export type RemovalMode = 'ai' | 'manual';

interface UseBackgroundRemovalReturn {
  removeBackgroundFromFrame: (frame: GifFrame, mode: RemovalMode, config?: AIBackgroundRemovalConfig, processingMode?: ProcessingMode, frameIndex?: number) => Promise<GifFrame>;
  removeBackgroundFromFrames: (frames: GifFrame[], mode: RemovalMode, config?: AIBackgroundRemovalConfig, processingMode?: ProcessingMode, onProgress?: (progress: number) => void) => Promise<GifFrame[]>;
  previewBackgroundRemoval: (frame: GifFrame, config?: AIBackgroundRemovalConfig, processingMode?: ProcessingMode) => Promise<ImageData>;
  selectWithMagicWand: (imageData: ImageData, x: number, y: number, tolerance: number) => Uint8ClampedArray;
  applyMask: (frame: GifFrame, mask: Uint8ClampedArray, invert?: boolean) => GifFrame;
  isProcessing: boolean;
  isGeneratingPreview: boolean;
  progress: number;
  error: string | null;
  aiProgress: { stage: string; current: number; total: number } | null;
}

export function useBackgroundRemoval(): UseBackgroundRemovalReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [aiProgress, setAiProgress] = useState<{ stage: string; current: number; total: number } | null>(null);

  // Track uploaded frame indices to avoid duplicate uploads
  const uploadedFramesRef = useRef<Set<number>>(new Set());

  const removeBackgroundFromFrame = useCallback(
    async (frame: GifFrame, mode: RemovalMode, config?: AIBackgroundRemovalConfig, processingMode: ProcessingMode = 'browser', frameIndex: number = 0): Promise<GifFrame> => {
      setIsProcessing(true);
      setError(null);
      setAiProgress(null);

      try {
        let processedImageData: ImageData;

        // Backend session-based processing
        if (processingMode === 'backend' && mode === 'ai') {
          console.log(`🔄 Using backend session for frame ${frameIndex}`);

          // Lazy session creation
          if (!sessionClient.hasActiveSession()) {
            console.log('🔑 Creating backend session (first operation)');
            await sessionClient.createSession();
          }

          // Upload frame if not already uploaded
          if (!uploadedFramesRef.current.has(frameIndex)) {
            console.log(`⬆️ Uploading frame ${frameIndex} to backend`);
            await sessionClient.uploadFrames([frame], undefined, frameIndex);
            uploadedFramesRef.current.add(frameIndex);
          }

          // Process frame on backend (lightweight command)
          // Note: Backend uses its own model configuration, so we don't pass the full config
          await sessionClient.removeBackgroundFromFrame(frameIndex, 'ai');

          // Download processed result
          processedImageData = await sessionClient.getProcessedFrame(
            frameIndex,
            frame.imageData.width,
            frame.imageData.height
          );
        } else if (mode === 'ai') {
          // Browser-based AI processing
          const enhancedConfig: AIBackgroundRemovalConfig = {
            model: config?.model || 'isnet_fp16',
            device: config?.device || 'cpu',
            progressCallback: (stage: string, current: number, total: number) => {
              setAiProgress({ stage, current, total });
            },
          };

          processedImageData = await removeBackgroundAI(frame.imageData, enhancedConfig, processingMode);
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
        setAiProgress(null);
      }
    },
    []
  );

  const previewBackgroundRemoval = useCallback(
    async (frame: GifFrame, config?: AIBackgroundRemovalConfig, processingMode: ProcessingMode = 'browser'): Promise<ImageData> => {
      setIsGeneratingPreview(true);
      setError(null);
      setAiProgress(null);

      try {
        // Backend session-based preview
        if (processingMode === 'backend') {
          console.log('🔄 Using backend session for preview');

          // Lazy session creation
          if (!sessionClient.hasActiveSession()) {
            console.log('🔑 Creating backend session for preview');
            await sessionClient.createSession();
          }

          // Use a temporary frame index for preview (e.g., -1 or 9999)
          const previewFrameIndex = 9999;

          // Upload preview frame
          await sessionClient.uploadFrames([frame], undefined, previewFrameIndex);

          // Process on backend
          await sessionClient.removeBackgroundFromFrame(previewFrameIndex, 'ai');

          // Download processed result
          const processedImageData = await sessionClient.getProcessedFrame(
            previewFrameIndex,
            frame.imageData.width,
            frame.imageData.height
          );

          return processedImageData;
        }

        // Browser-based preview
        const enhancedConfig: AIBackgroundRemovalConfig = {
          model: config?.model || 'isnet_fp16',
          device: config?.device || 'cpu',
          progressCallback: (stage: string, current: number, total: number) => {
            setAiProgress({ stage, current, total });
          },
        };

        const processedImageData = await removeBackgroundAI(frame.imageData, enhancedConfig, processingMode);
        return processedImageData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate preview';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsGeneratingPreview(false);
        setAiProgress(null);
      }
    },
    []
  );

  const removeBackgroundFromFrames = useCallback(
    async (
      frames: GifFrame[],
      mode: RemovalMode,
      config?: AIBackgroundRemovalConfig,
      processingMode: ProcessingMode = 'browser',
      onProgress?: (progress: number) => void
    ): Promise<GifFrame[]> => {
      setIsProcessing(true);
      setError(null);
      setProgress(0);

      try {
        const processedFrames: GifFrame[] = [];

        // Backend session-based batch processing
        if (processingMode === 'backend' && mode === 'ai') {
          console.log(`🔄 Using backend session for ${frames.length} frames`);

          // Lazy session creation
          if (!sessionClient.hasActiveSession()) {
            console.log('🔑 Creating backend session for batch operation');
            await sessionClient.createSession();
          }

          // Upload all frames at once (with progress tracking)
          console.log(`⬆️ Uploading ${frames.length} frames to backend`);
          await sessionClient.uploadFrames(frames, (uploaded, total) => {
            const uploadProgress = Math.round((uploaded / total) * 50); // 0-50% for upload
            setProgress(uploadProgress);
            onProgress?.(uploadProgress);
          });

          // Mark all frames as uploaded
          for (let i = 0; i < frames.length; i++) {
            uploadedFramesRef.current.add(i);
          }

          // Process each frame on backend
          for (let i = 0; i < frames.length; i++) {
            await sessionClient.removeBackgroundFromFrame(i, 'ai');

            // Download processed frame
            const processedImageData = await sessionClient.getProcessedFrame(
              i,
              frames[i].imageData.width,
              frames[i].imageData.height
            );

            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = processedImageData.width;
            canvas.height = processedImageData.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              throw new Error('Could not get canvas context');
            }

            ctx.putImageData(processedImageData, 0, 0);

            processedFrames.push({
              ...frames[i],
              imageData: processedImageData,
              canvas,
            });

            // 50-100% for processing
            const processingProgress = 50 + Math.round(((i + 1) / frames.length) * 50);
            setProgress(processingProgress);
            onProgress?.(processingProgress);
          }
        } else {
          // Browser-based processing (existing logic)
          for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const processedFrame = await removeBackgroundFromFrame(frame, mode, config, processingMode, i);
            processedFrames.push(processedFrame);

            const currentProgress = Math.round(((i + 1) / frames.length) * 100);
            setProgress(currentProgress);
            onProgress?.(currentProgress);
          }
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
    previewBackgroundRemoval,
    selectWithMagicWand,
    applyMask,
    isProcessing,
    isGeneratingPreview,
    progress,
    error,
    aiProgress,
  };
}
