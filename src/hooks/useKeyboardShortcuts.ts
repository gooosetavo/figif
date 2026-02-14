import { useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';

export const useKeyboardShortcuts = () => {
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    saveSnapshot,
    activeWorkspace,
    frames,
    currentFrameIndex,
    setFrames,
    setCurrentFrameIndex,
  } = useWorkspace();

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const isMac = navigator.userAgent.indexOf('Mac') !== -1;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl/Cmd + Z
      if (ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          const restoredFrames = await undo();
          if (restoredFrames) {
            setFrames(restoredFrames);
            if (activeWorkspace) {
              setCurrentFrameIndex(activeWorkspace.currentHistoryIndex);
            }
          }
        }
      }

      // Redo: Ctrl/Cmd + Shift + Z
      if (ctrlKey && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (canRedo) {
          const restoredFrames = await redo();
          if (restoredFrames) {
            setFrames(restoredFrames);
            if (activeWorkspace) {
              setCurrentFrameIndex(activeWorkspace.currentHistoryIndex);
            }
          }
        }
      }

      // Save: Ctrl/Cmd + S
      if (ctrlKey && e.key === 's') {
        e.preventDefault();
        if (activeWorkspace && frames.length > 0) {
          await saveSnapshot(
            frames,
            currentFrameIndex,
            'Manual save',
            false
          );
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, saveSnapshot, activeWorkspace, frames, currentFrameIndex, setFrames, setCurrentFrameIndex]);
};
