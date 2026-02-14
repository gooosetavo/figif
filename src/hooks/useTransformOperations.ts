import { useWorkspace } from '../contexts/WorkspaceContext';
import { addCustomPadding, rotate90, flipFrame } from '../utils/gifEffects';
import { resizeFrames, cropFrames } from '../utils/imageTransform';
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
        setFrames(newFrames);

        if (activeWorkspace) {
          await saveSnapshot(
            newFrames,
            currentFrameIndex,
            `Applied padding to current frame (L:${left} R:${right} T:${top} B:${bottom})`,
            true
          );
        }
      } else {
        const paddedFrames = frames.map((frame) => addCustomPadding(frame, left, right, top, bottom));
        setFrames(paddedFrames);

        if (activeWorkspace) {
          await saveSnapshot(
            paddedFrames,
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

      setFrames(newFrames);

      if (activeWorkspace) {
        const direction = clockwise ? 'clockwise' : 'counterclockwise';
        const scopeText =
          scope === 'all'
            ? 'all frames'
            : scope === 'selected'
            ? `${framesToRotate.length} selected frame${framesToRotate.length !== 1 ? 's' : ''}`
            : 'current frame';

        await saveSnapshot(
          newFrames,
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

  return {
    handleApplyPadding,
    handleRotate,
    handleFlip,
    handleResize,
    handleCrop,
  };
};
