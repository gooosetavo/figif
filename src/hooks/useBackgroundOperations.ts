import { useWorkspace } from '../contexts/WorkspaceContext';
import { useEditor } from '../contexts/EditorContext';
import { useBackgroundRemoval, type RemovalMode } from './useBackgroundRemoval';
import { applyIntensifiesEffect, applyPartyEffect, applyOnDrugsEffect } from '../utils/gifEffects';
import type { AIBackgroundRemovalConfig } from '../types/gif.types';
import type { GifEffect } from '../components/Panels/BackgroundRemovalPanel';
import { backendClient, type SelectionPoint } from '../services/grpcClient';

export const useBackgroundOperations = () => {
  const {
    frames,
    setFrames,
    currentFrameIndex,
    saveSnapshot,
    activeWorkspace,
    savePreview,
    loadPreview,
    clearPreview,
  } = useWorkspace();

  const {
    setSelectionMask,
    selectionMask,
    selectionPoints,
    setSelectionPoints,
    manualTolerance,
    setIsManualSelectionMode,
    setShowPreviewModal,
    processingMode,
    isBackendAvailable,
  } = useEditor();

  const {
    removeBackgroundFromFrame,
    removeBackgroundFromFrames,
    previewBackgroundRemoval,
    selectWithMagicWand,
    applyMask,
  } = useBackgroundRemoval();

  const handleRemoveBackground = async (
    mode: RemovalMode,
    target: 'current' | 'all',
    config?: AIBackgroundRemovalConfig
  ) => {
    if (frames.length === 0) return;

    try {
      if (target === 'current') {
        const processedFrame = await removeBackgroundFromFrame(frames[currentFrameIndex], mode, config, processingMode);
        const newFrames = [...frames];
        newFrames[currentFrameIndex] = processedFrame;
        setFrames(newFrames);

        if (activeWorkspace) {
          await saveSnapshot(newFrames, currentFrameIndex, `Background removed (${mode}, ${processingMode})`, true);
        }
      } else {
        const processedFrames = await removeBackgroundFromFrames(frames, mode, config, processingMode, (progress) => {
          console.log(`Processing: ${progress}%`);
        });
        setFrames(processedFrames);

        if (activeWorkspace) {
          await saveSnapshot(processedFrames, currentFrameIndex, `Background removed from all frames (${mode}, ${processingMode})`, true);
        }
      }
      setSelectionMask(null);
    } catch (err) {
      console.error('Failed to remove background:', err);
    }
  };

  const handlePreview = async (config: AIBackgroundRemovalConfig) => {
    if (!frames[currentFrameIndex]) return;

    try {
      const preview = await previewBackgroundRemoval(frames[currentFrameIndex], config, processingMode);

      const canvas = document.createElement('canvas');
      canvas.width = preview.width;
      canvas.height = preview.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      ctx.putImageData(preview, 0, 0);

      const previewFrame = {
        ...frames[currentFrameIndex],
        imageData: preview,
        canvas,
      };

      if (activeWorkspace) {
        await savePreview(currentFrameIndex, previewFrame);
      }

      setShowPreviewModal(true);
    } catch (err) {
      console.error('Failed to generate preview:', err);
    }
  };

  const handleApplyPreview = async () => {
    if (!frames[currentFrameIndex]) return;

    try {
      const previewData = loadPreview();
      if (!previewData) {
        console.error('No preview data available');
        return;
      }

      const processedFrame = previewData.previewFrame;

      const newFrames = [...frames];
      newFrames[currentFrameIndex] = processedFrame;
      setFrames(newFrames);

      if (activeWorkspace) {
        await saveSnapshot(newFrames, currentFrameIndex, 'Applied background removal preview', false);
      }

      setShowPreviewModal(false);
      await clearPreview();
    } catch (err) {
      console.error('Failed to apply preview:', err);
    }
  };

  const handleCancelPreview = async () => {
    setShowPreviewModal(false);
    await clearPreview();
  };

  const handleEnableManualMode = () => {
    setIsManualSelectionMode(true);
    setSelectionMask(null);
    setSelectionPoints([]);
  };

  const handleCanvasClick = (x: number, y: number) => {
    if (!frames[currentFrameIndex]) return;

    const newMask = selectWithMagicWand(frames[currentFrameIndex].imageData, x, y, manualTolerance);

    const combineMasks = (mask1: Uint8ClampedArray, mask2: Uint8ClampedArray): Uint8ClampedArray => {
      const combined = new Uint8ClampedArray(mask1.length);
      for (let i = 0; i < mask1.length; i++) {
        combined[i] = mask1[i] === 255 || mask2[i] === 255 ? 255 : 0;
      }
      return combined;
    };

    const combinedMask = selectionMask ? combineMasks(selectionMask, newMask) : newMask;

    setSelectionMask(combinedMask);
    setSelectionPoints([...selectionPoints, { x, y, tolerance: manualTolerance }]);
  };

  const handleClearSelections = () => {
    setSelectionMask(null);
    setSelectionPoints([]);
  };

  const handleRemoveLastSelection = () => {
    if (selectionPoints.length === 0) return;

    const newPoints = selectionPoints.slice(0, -1);
    setSelectionPoints(newPoints);

    if (newPoints.length === 0) {
      setSelectionMask(null);
    } else if (frames[currentFrameIndex]) {
      let combinedMask: Uint8ClampedArray | null = null;
      for (const point of newPoints) {
        const mask = selectWithMagicWand(frames[currentFrameIndex].imageData, point.x, point.y, point.tolerance);
        if (combinedMask) {
          const combined = new Uint8ClampedArray(mask.length);
          for (let i = 0; i < mask.length; i++) {
            combined[i] = combinedMask[i] === 255 || mask[i] === 255 ? 255 : 0;
          }
          combinedMask = combined;
        } else {
          combinedMask = mask;
        }
      }
      setSelectionMask(combinedMask);
    }
  };

  const handleApplySelection = async (_tolerance: number, invert: boolean, effect: GifEffect) => {
    if (!selectionMask || !frames[currentFrameIndex]) return;

    try {
      let processedFrame;

      // Use backend if available and enabled
      if (processingMode === 'backend' && isBackendAvailable && selectionPoints.length > 0) {
        const selections: SelectionPoint[] = selectionPoints.map((point) => ({
          x: point.x,
          y: point.y,
          tolerance: point.tolerance,
        }));

        const processedImageData = await backendClient.manualRemoveBackground(
          frames[currentFrameIndex].imageData,
          selections,
          invert,
          effect
        );

        const canvas = document.createElement('canvas');
        canvas.width = processedImageData.width;
        canvas.height = processedImageData.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        ctx.putImageData(processedImageData, 0, 0);

        processedFrame = {
          ...frames[currentFrameIndex],
          imageData: processedImageData,
          canvas,
        };
      } else {
        // Use browser mode
        processedFrame = applyMask(frames[currentFrameIndex], selectionMask, invert);
      }

      const newFrames = [...frames];
      newFrames[currentFrameIndex] = processedFrame;
      setFrames(newFrames);
      handleClearSelections();

      if (activeWorkspace) {
        await saveSnapshot(
          newFrames,
          currentFrameIndex,
          `Applied manual selection (${selectionPoints.length} area${selectionPoints.length !== 1 ? 's' : ''}, ${processingMode})${
            effect !== 'none' ? ` + ${effect}` : ''
          }`,
          true
        );
      }
    } catch (err) {
      console.error('Failed to apply selection:', err);
    }
  };

  const handleApplyToAllFrames = async (_tolerance: number, invert: boolean, effect: GifEffect) => {
    if (selectionPoints.length === 0 || frames.length === 0) {
      console.error('No selection points saved. Click on the background first.');
      return;
    }

    try {
      let processedFrames;

      // Use backend if available and enabled
      if (processingMode === 'backend' && isBackendAvailable) {
        const selections: SelectionPoint[] = selectionPoints.map((point) => ({
          x: point.x,
          y: point.y,
          tolerance: point.tolerance,
        }));

        processedFrames = await Promise.all(
          frames.map(async (frame) => {
            const processedImageData = await backendClient.manualRemoveBackground(
              frame.imageData,
              selections,
              invert,
              effect
            );

            const canvas = document.createElement('canvas');
            canvas.width = processedImageData.width;
            canvas.height = processedImageData.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');
            ctx.putImageData(processedImageData, 0, 0);

            return {
              ...frame,
              imageData: processedImageData,
              canvas,
            };
          })
        );
      } else {
        // Use browser mode
        processedFrames = frames.map((frame) => {
          let combinedMask: Uint8ClampedArray | null = null;

          for (const point of selectionPoints) {
            const mask = selectWithMagicWand(frame.imageData, point.x, point.y, point.tolerance);
            if (combinedMask) {
              const combined = new Uint8ClampedArray(mask.length);
              for (let i = 0; i < mask.length; i++) {
                combined[i] = combinedMask[i] === 255 || mask[i] === 255 ? 255 : 0;
              }
              combinedMask = combined;
            } else {
              combinedMask = mask;
            }
          }

          return combinedMask ? applyMask(frame, combinedMask, invert) : frame;
        });

        // Apply effects if selected (browser mode only, backend handles effects)
        if (effect === 'intensifies') {
          processedFrames = applyIntensifiesEffect(processedFrames);
        } else if (effect === 'party') {
          processedFrames = applyPartyEffect(processedFrames);
        } else if (effect === 'on-drugs') {
          processedFrames = applyOnDrugsEffect(processedFrames);
        }
      }

      setFrames(processedFrames);
      handleClearSelections();

      if (activeWorkspace) {
        await saveSnapshot(
          processedFrames,
          currentFrameIndex,
          `Applied manual selection to all frames (${selectionPoints.length} area${
            selectionPoints.length !== 1 ? 's' : ''
          }, ${processingMode})${effect !== 'none' ? ` + ${effect}` : ''}`,
          true
        );
      }
    } catch (err) {
      console.error('Failed to apply selection to all frames:', err);
    }
  };

  return {
    handleRemoveBackground,
    handlePreview,
    handleApplyPreview,
    handleCancelPreview,
    handleEnableManualMode,
    handleCanvasClick,
    handleClearSelections,
    handleRemoveLastSelection,
    handleApplySelection,
    handleApplyToAllFrames,
  };
};
