import { useWorkspace } from '../contexts/WorkspaceContext';
import type { GifFrame } from '../types/gif.types';

export const useFrameOperations = () => {
  const {
    frames,
    setFrames,
    currentFrameIndex,
    setCurrentFrameIndex,
    reverseFrames: reverseFramesBase,
    updateAllFrameDelays,
    saveSnapshot,
    activeWorkspace,
  } = useWorkspace();

  // Enhanced frame operations with auto-save
  const handleDeleteFrame = async (scope: 'current' | 'selected', selectedFrames: Set<number>) => {
    if (frames.length <= 1) return;

    try {
      let newFrames: typeof frames;
      let description: string;

      if (scope === 'selected' && selectedFrames.size > 0) {
        // Delete selected frames
        const indicesToDelete = new Set(selectedFrames);
        newFrames = frames.filter((_f, i) => !indicesToDelete.has(i));
        description = `Deleted ${indicesToDelete.size} frame${indicesToDelete.size !== 1 ? 's' : ''}`;
      } else {
        // Delete current frame
        newFrames = frames.filter((_f, i) => i !== currentFrameIndex);
        description = 'Deleted frame';
      }

      if (newFrames.length === 0) {
        console.error('Cannot delete all frames');
        return;
      }

      setFrames(newFrames);
      setCurrentFrameIndex(Math.min(currentFrameIndex, newFrames.length - 1));

      // Auto-save
      if (activeWorkspace) {
        await saveSnapshot(
          newFrames,
          Math.min(currentFrameIndex, newFrames.length - 1),
          description,
          true
        );
      }
    } catch (err) {
      console.error('Failed to delete frames:', err);
    }
  };

  const handleDuplicateFrame = async (scope: 'current' | 'selected', selectedFrames: Set<number>) => {
    if (frames.length === 0) return;

    try {
      let newFrames: typeof frames;
      let description: string;

      if (scope === 'selected' && selectedFrames.size > 0) {
        // Duplicate selected frames
        newFrames = [];
        const selectedIndices = Array.from(selectedFrames).sort((a, b) => a - b);

        for (let i = 0; i < frames.length; i++) {
          newFrames.push(frames[i]);
          if (selectedIndices.includes(i)) {
            // Add duplicate right after the original
            newFrames.push({ ...frames[i] });
          }
        }

        description = `Duplicated ${selectedIndices.length} frame${selectedIndices.length !== 1 ? 's' : ''}`;
      } else {
        // Duplicate current frame
        newFrames = [
          ...frames.slice(0, currentFrameIndex + 1),
          { ...frames[currentFrameIndex] },
          ...frames.slice(currentFrameIndex + 1)
        ];
        description = 'Duplicated frame';
      }

      setFrames(newFrames);

      // Auto-save
      if (activeWorkspace) {
        await saveSnapshot(
          newFrames,
          currentFrameIndex,
          description,
          true
        );
      }
    } catch (err) {
      console.error('Failed to duplicate frames:', err);
    }
  };

  const handleReverseFrames = async () => {
    reverseFramesBase();

    // Auto-save after state updates
    setTimeout(async () => {
      if (activeWorkspace) {
        await saveSnapshot(
          frames,
          currentFrameIndex,
          'Reversed frames',
          true
        );
      }
    }, 100);
  };

  const handleRemoveEveryOtherFrame = async () => {
    if (frames.length <= 1) return;

    // Keep frames at even indices (0, 2, 4, 6...)
    const filteredFrames = frames.filter((_, index) => index % 2 === 0);
    setFrames(filteredFrames);

    // Adjust current frame index if needed
    const newIndex = Math.min(Math.floor(currentFrameIndex / 2), filteredFrames.length - 1);
    setCurrentFrameIndex(newIndex);

    // Auto-save
    setTimeout(async () => {
      if (activeWorkspace) {
        await saveSnapshot(
          filteredFrames,
          newIndex,
          `Removed every other frame (${frames.length} → ${filteredFrames.length})`,
          true
        );
      }
    }, 100);
  };

  const handleDuplicateAllFrames = async () => {
    if (frames.length === 0) return;

    // Duplicate each frame in place: [1,2,3] -> [1,1,2,2,3,3]
    const duplicatedFrames: typeof frames = [];
    frames.forEach(frame => {
      duplicatedFrames.push(frame);
      duplicatedFrames.push({ ...frame });
    });

    setFrames(duplicatedFrames);
    setCurrentFrameIndex(currentFrameIndex * 2);

    // Auto-save
    setTimeout(async () => {
      if (activeWorkspace) {
        await saveSnapshot(
          duplicatedFrames,
          currentFrameIndex * 2,
          `Duplicated all frames (${frames.length} → ${duplicatedFrames.length})`,
          true
        );
      }
    }, 100);
  };

  const handleKeepEveryNthFrame = async (n: number) => {
    if (frames.length <= 1 || n < 2) return;

    // Keep frames at indices 0, n, 2n, 3n...
    const filteredFrames = frames.filter((_, index) => index % n === 0);
    setFrames(filteredFrames);

    // Adjust current frame index
    const newIndex = Math.min(Math.floor(currentFrameIndex / n), filteredFrames.length - 1);
    setCurrentFrameIndex(newIndex);

    // Auto-save
    setTimeout(async () => {
      if (activeWorkspace) {
        await saveSnapshot(
          filteredFrames,
          newIndex,
          `Kept every ${n}th frame (${frames.length} → ${filteredFrames.length})`,
          true
        );
      }
    }, 100);
  };

  const handleReorderFrames = async (fromIndex: number, toIndex: number, selectedFrames: Set<number>, setSelectedFrames: (frames: Set<number>) => void) => {
    if (frames.length === 0 || fromIndex === toIndex) return;

    try {
      const newFrames = [...frames];
      const [movedFrame] = newFrames.splice(fromIndex, 1);
      newFrames.splice(toIndex, 0, movedFrame);

      setFrames(newFrames);

      // Update current frame index if needed
      let newCurrentIndex = currentFrameIndex;
      if (currentFrameIndex === fromIndex) {
        newCurrentIndex = toIndex;
      } else if (fromIndex < currentFrameIndex && toIndex >= currentFrameIndex) {
        newCurrentIndex = currentFrameIndex - 1;
      } else if (fromIndex > currentFrameIndex && toIndex <= currentFrameIndex) {
        newCurrentIndex = currentFrameIndex + 1;
      }
      setCurrentFrameIndex(newCurrentIndex);

      // Update selected frames indices
      if (selectedFrames.size > 0) {
        const newSelection = new Set<number>();
        selectedFrames.forEach(idx => {
          if (idx === fromIndex) {
            newSelection.add(toIndex);
          } else if (fromIndex < idx && toIndex >= idx) {
            newSelection.add(idx - 1);
          } else if (fromIndex > idx && toIndex <= idx) {
            newSelection.add(idx + 1);
          } else {
            newSelection.add(idx);
          }
        });
        setSelectedFrames(newSelection);
      }

      // Auto-save
      if (activeWorkspace) {
        await saveSnapshot(
          newFrames,
          newCurrentIndex,
          `Moved frame ${fromIndex + 1} to position ${toIndex + 1}`,
          true
        );
      }
    } catch (err) {
      console.error('Failed to reorder frames:', err);
    }
  };

  const handleSpeedChange = (multiplier: number) => {
    if (frames.length === 0) return;
    const newDelay = Math.max(10, Math.round(frames[currentFrameIndex].delay / multiplier));
    updateAllFrameDelays(newDelay);
  };

  return {
    handleDeleteFrame,
    handleDuplicateFrame,
    handleReverseFrames,
    handleRemoveEveryOtherFrame,
    handleDuplicateAllFrames,
    handleKeepEveryNthFrame,
    handleReorderFrames,
    handleSpeedChange,
  };
};
