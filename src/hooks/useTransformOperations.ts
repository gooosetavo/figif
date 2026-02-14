import { useWorkspace } from '../contexts/WorkspaceContext';
import { addCustomPadding, rotate90, flipFrame } from '../utils/gifEffects';
import { resizeFrames, cropFrames } from '../utils/imageTransform';
import { normalizeFrameDimensions } from '../utils/frameNormalization';
import type { CropSelection } from '../components/Panels/CropPanel';

export const useTransformOperations = () => {
  const {
    frames,
    setFrames,
    currentFrameIndex,
    saveSnapshot,
    activeWorkspace,
  } = useWorkspace();

  const handleApplyPadding = async (
    scope: 'current' | 'all',
    left: number,
    right: number,
    top: number,
    bottom: number
  ) => {
    if (frames.length === 0) return;

    try {
      if (scope === 'current') {
        const paddedFrame = addCustomPadding(frames[currentFrameIndex], left, right, top, bottom);
        const newFrames = [...frames];
        newFrames[currentFrameIndex] = paddedFrame;

        // Normalize all frames to have the same dimensions
        const normalizedFrames = normalizeFrameDimensions(newFrames);
        setFrames(normalizedFrames);

        if (activeWorkspace) {
          await saveSnapshot(
            normalizedFrames,
            currentFrameIndex,
            `Applied padding to current frame (L:${left} R:${right} T:${top} B:${bottom})`,
            true
          );
        }
      } else {
        const paddedFrames = frames.map((frame) => addCustomPadding(frame, left, right, top, bottom));

        // Normalize all frames to have the same dimensions
        const normalizedFrames = normalizeFrameDimensions(paddedFrames);
        setFrames(normalizedFrames);

        if (activeWorkspace) {
          await saveSnapshot(
            normalizedFrames,
            currentFrameIndex,
            `Applied padding to all frames (L:${left} R:${right} T:${top} B:${bottom})`,
            true
          );
        }
      }
    } catch (err) {
      console.error('Failed to apply padding:', err);
    }
  };

  const handleRotate = async (clockwise: boolean, scope: 'current' | 'selected' | 'all', selectedFrames: Set<number>) => {
    if (frames.length === 0) return;

    try {
      const newFrames = [...frames];
      const framesToRotate =
        scope === 'all'
          ? Array.from({ length: frames.length }, (_, i) => i)
          : scope === 'selected'
          ? Array.from(selectedFrames)
          : [currentFrameIndex];

      for (const index of framesToRotate) {
        newFrames[index] = rotate90(frames[index], clockwise);
      }

      // Normalize all frames to have the same dimensions (rotation changes dimensions)
      const normalizedFrames = normalizeFrameDimensions(newFrames);
      setFrames(normalizedFrames);

      if (activeWorkspace) {
        const direction = clockwise ? 'clockwise' : 'counterclockwise';
        const scopeText =
          scope === 'all'
            ? 'all frames'
            : scope === 'selected'
            ? `${framesToRotate.length} selected frame${framesToRotate.length !== 1 ? 's' : ''}`
            : 'current frame';

        await saveSnapshot(
          normalizedFrames,
          currentFrameIndex,
          `Rotated 90° ${direction} (${scopeText})`,
          true
        );
      }
    } catch (err) {
      console.error('Failed to rotate frames:', err);
    }
  };

  const handleFlip = async (horizontal: boolean, scope: 'current' | 'selected' | 'all', selectedFrames: Set<number>) => {
    if (frames.length === 0) return;

    try {
      const newFrames = [...frames];
      const framesToFlip =
        scope === 'all'
          ? Array.from({ length: frames.length }, (_, i) => i)
          : scope === 'selected'
          ? Array.from(selectedFrames)
          : [currentFrameIndex];

      for (const index of framesToFlip) {
        newFrames[index] = flipFrame(frames[index], horizontal);
      }

      setFrames(newFrames);

      if (activeWorkspace) {
        const direction = horizontal ? 'horizontally' : 'vertically';
        const scopeText =
          scope === 'all'
            ? 'all frames'
            : scope === 'selected'
            ? `${framesToFlip.length} selected frame${framesToFlip.length !== 1 ? 's' : ''}`
            : 'current frame';

        await saveSnapshot(
          newFrames,
          currentFrameIndex,
          `Flipped ${direction} (${scopeText})`,
          true
        );
      }
    } catch (err) {
      console.error('Failed to flip frames:', err);
    }
  };

  const handleResize = async (
    width: number,
    height: number,
    _maintainAspectRatio: boolean,
    setIsResizing: (resizing: boolean) => void
  ) => {
    if (frames.length === 0) return;

    // Check if resize would cause data loss (making frames smaller)
    const maxWidth = Math.max(...frames.map(f => f.imageData.width));
    const maxHeight = Math.max(...frames.map(f => f.imageData.height));
    const wouldLoseData = width < maxWidth || height < maxHeight;

    if (wouldLoseData) {
      const confirmed = window.confirm(
        `Warning: Resizing to ${width}×${height} will crop your frames from ${maxWidth}×${maxHeight}, causing data loss.\n\n` +
        `Click OK to proceed with cropping, or Cancel to keep the current dimensions.`
      );

      if (!confirmed) {
        return; // User cancelled
      }
    }

    setIsResizing(true);
    try {
      const resizedFrames = resizeFrames(frames, width, height);
      setFrames(resizedFrames);

      if (activeWorkspace) {
        await saveSnapshot(resizedFrames, currentFrameIndex, `Resized to ${width}×${height}`, false);
      }
    } catch (err) {
      console.error('Failed to resize frames:', err);
    } finally {
      setIsResizing(false);
    }
  };

  const handleCrop = async (
    selection: CropSelection,
    setIsCropping: (cropping: boolean) => void,
    setCropSelection: (selection: CropSelection | null) => void
  ) => {
    if (frames.length === 0) return;

    // Check if crop would cause data loss
    const maxWidth = Math.max(...frames.map(f => f.imageData.width));
    const maxHeight = Math.max(...frames.map(f => f.imageData.height));
    const wouldLoseData = selection.width < maxWidth || selection.height < maxHeight;

    if (wouldLoseData) {
      const currentSize = `${maxWidth}×${maxHeight}`;
      const newSize = `${selection.width}×${selection.height}`;
      const confirmed = window.confirm(
        `Warning: Cropping to ${newSize} will remove parts of your frames (current size: ${currentSize}), causing data loss.\n\n` +
        `Click OK to proceed with cropping, or Cancel to keep the current frame dimensions.`
      );

      if (!confirmed) {
        setCropSelection(null);
        return; // User cancelled
      }
    }

    setIsCropping(true);
    try {
      const croppedFrames = cropFrames(frames, selection.x, selection.y, selection.width, selection.height);
      setFrames(croppedFrames);

      if (activeWorkspace) {
        await saveSnapshot(
          croppedFrames,
          currentFrameIndex,
          `Cropped to ${selection.width}×${selection.height}`,
          false
        );
      }

      setCropSelection(null);
    } catch (err) {
      console.error('Failed to crop frames:', err);
    } finally {
      setIsCropping(false);
    }
  };

  const handleSpin = async (clockwise: boolean) => {
    if (frames.length === 0) return;

    try {
      const newFrames = [...frames];

      // Rotate each frame progressively
      // Frame 0: 0 rotations, Frame 1: 1 rotation (90°), Frame 2: 2 rotations (180°), etc.
      for (let i = 0; i < frames.length; i++) {
        let currentFrame = frames[i];
        const rotations = i % 4; // 0, 1, 2, 3 (cycles every 4 frames)

        // Apply the number of 90° rotations
        for (let r = 0; r < rotations; r++) {
          currentFrame = rotate90(currentFrame, clockwise);
        }

        newFrames[i] = currentFrame;
      }

      // Normalize all frames to have the same dimensions (spin creates different rotations)
      const normalizedFrames = normalizeFrameDimensions(newFrames);
      setFrames(normalizedFrames);

      if (activeWorkspace) {
        const direction = clockwise ? 'clockwise' : 'counterclockwise';
        await saveSnapshot(
          normalizedFrames,
          currentFrameIndex,
          `Applied spin effect (${direction})`,
          true
        );
      }
    } catch (err) {
      console.error('Failed to apply spin effect:', err);
    }
  };

  return {
    handleApplyPadding,
    handleRotate,
    handleFlip,
    handleResize,
    handleCrop,
    handleSpin,
  };
};
