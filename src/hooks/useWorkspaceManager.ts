/**
 * Workspace manager hook - orchestrates multiple workspaces with version control
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  Workspace,
  WorkspaceMetadata,
  WorkspaceSnapshot,
  WorkspacePreviewData,
  SerializedFrame,
} from '../types/workspace.types';
import type { DecodedGif, GifFrame } from '../types/gif.types';
import {
  saveWorkspace as saveWorkspaceDB,
  loadWorkspace as loadWorkspaceDB,
  deleteWorkspace as deleteWorkspaceDB,
  isIndexedDBAvailable,
} from '../utils/storage/indexedDB';
import {
  getWorkspaceIndex,
  addWorkspaceToIndex,
  removeWorkspaceFromIndex,
  updateWorkspaceMetadata,
  setActiveWorkspace as setActiveWorkspaceLS,
  getActiveWorkspaceId,
  isLocalStorageAvailable,
} from '../utils/storage/localStorage';
import { serializeFrames, deserializeFrames, generateThumbnail } from '../utils/serialization';
import { calculateSerializedFrameSize, calculateSerializedTotalSize } from '../utils/storageSize';

const MAX_HISTORY = 20;
const DEBOUNCE_DELAY = 2000; // 2 seconds

export interface UseWorkspaceManagerReturn {
  // Workspace management
  workspaces: WorkspaceMetadata[];
  activeWorkspace: Workspace | null;
  activeWorkspaceId: string | null;
  isLoading: boolean;
  isCreatingWorkspace: boolean;
  isSwitchingWorkspace: boolean;
  isClosingWorkspace: boolean;

  // Workspace CRUD
  createWorkspace(name: string, gif?: DecodedGif): Promise<string>;
  switchWorkspace(id: string): Promise<void>;
  closeWorkspace(id: string): Promise<void>;
  renameWorkspace(id: string, name: string): Promise<void>;

  // History/Version control
  saveSnapshot(frames: GifFrame[], currentFrameIndex: number, description: string, isAutoSave: boolean): Promise<void>;
  undo(): Promise<GifFrame[] | null>;
  redo(): Promise<GifFrame[] | null>;
  canUndo: boolean;
  canRedo: boolean;

  // Preview state
  savePreview(frameIndex: number, previewFrame: GifFrame): Promise<void>;
  loadPreview(): { originalFrameIndex: number; previewFrame: GifFrame } | null;
  clearPreview(): Promise<void>;

  // Frame management
  updateWorkspaceFrames(frames: GifFrame[], currentFrameIndex: number): Promise<void>;
}

export function useWorkspaceManager(): UseWorkspaceManagerReturn {
  const [workspaces, setWorkspaces] = useState<WorkspaceMetadata[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isSwitchingWorkspace, setIsSwitchingWorkspace] = useState(false);
  const [isClosingWorkspace, setIsClosingWorkspace] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Check storage availability
  const storageAvailable = isIndexedDBAvailable() && isLocalStorageAvailable();

  // Load workspaces on mount
  useEffect(() => {
    const loadWorkspaces = async () => {
      if (!storageAvailable) {
        setIsLoading(false);
        return;
      }

      try {
        const index = getWorkspaceIndex();
        const metadataList = index.workspaceOrder.map((id) => index.workspaces[id]).filter(Boolean);
        setWorkspaces(metadataList);

        // Load active workspace
        const activeId = getActiveWorkspaceId();
        if (activeId) {
          const workspace = await loadWorkspaceDB(activeId);
          if (workspace) {
            setActiveWorkspace(workspace);
          }
        }
      } catch (error) {
        console.error('Failed to load workspaces:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspaces();
  }, [storageAvailable]);

  // Create a new workspace
  const createWorkspace = useCallback(
    async (name: string, gif?: DecodedGif): Promise<string> => {
      if (!storageAvailable) {
        throw new Error('Storage not available');
      }

      setIsCreatingWorkspace(true);
      try {
        const id = `workspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();

        let frames: SerializedFrame[] = [];
        let thumbnail: string | undefined;
        let initialSnapshot: WorkspaceSnapshot | undefined;

        if (gif) {
          frames = serializeFrames(gif.frames);
          thumbnail = generateThumbnail(gif.frames[0]);

          // Calculate storage sizes
          const totalSize = calculateSerializedTotalSize(frames);
          const currentFrameSize = frames.length > 0 ? calculateSerializedFrameSize(frames[0]) : 0;
          const originalFileSize = gif.originalFileSize;

          // Create initial snapshot for the original image
          initialSnapshot = {
            id: `snapshot-${Date.now()}-initial`,
            timestamp: now,
            frames: frames,
            currentFrameIndex: 0,
            description: 'Original image',
            isAutoSave: false,
            currentFrameSize,
            totalSize,
            originalFileSize,
          };
        }

        const workspace: Workspace = {
          id,
          name,
          createdAt: now,
          lastModified: now,
          currentFrames: frames,
          currentFrameIndex: 0,
          historyStack: initialSnapshot ? [initialSnapshot] : [],
          currentHistoryIndex: initialSnapshot ? 0 : -1,
          currentFrameSize: initialSnapshot?.currentFrameSize,
          totalSize: initialSnapshot?.totalSize,
          originalFileSize: initialSnapshot?.originalFileSize,
        };

        const metadata: WorkspaceMetadata = {
          id,
          name,
          lastModified: now,
          thumbnail,
          frameCount: frames.length,
        };

        await saveWorkspaceDB(workspace);
        addWorkspaceToIndex(metadata);

        setWorkspaces((prev) => [...prev, metadata]);
        setActiveWorkspace(workspace);

        return id;
      } finally {
        setIsCreatingWorkspace(false);
      }
    },
    [storageAvailable]
  );

  // Switch to a different workspace
  const switchWorkspace = useCallback(
    async (id: string): Promise<void> => {
      if (!storageAvailable) return;

      setIsSwitchingWorkspace(true);
      try {
        const workspace = await loadWorkspaceDB(id);
        if (workspace) {
          setActiveWorkspace(workspace);
          setActiveWorkspaceLS(id);
        }
      } catch (error) {
        console.error('Failed to switch workspace:', error);
      } finally {
        setIsSwitchingWorkspace(false);
      }
    },
    [storageAvailable]
  );

  // Close and delete a workspace
  const closeWorkspace = useCallback(
    async (id: string): Promise<void> => {
      if (!storageAvailable) return;

      setIsClosingWorkspace(true);
      try {
        await deleteWorkspaceDB(id);
        removeWorkspaceFromIndex(id);

        // Calculate remaining workspaces before updating state
        const remainingWorkspaces = workspaces.filter((w) => w.id !== id);
        setWorkspaces(remainingWorkspaces);

        if (activeWorkspace?.id === id) {
          if (remainingWorkspaces.length > 0) {
            await switchWorkspace(remainingWorkspaces[0].id);
          } else {
            setActiveWorkspace(null);
            setActiveWorkspaceLS(''); // Clear active workspace from localStorage
          }
        }
      } catch (error) {
        console.error('Failed to close workspace:', error);
      } finally {
        setIsClosingWorkspace(false);
      }
    },
    [storageAvailable, activeWorkspace, workspaces, switchWorkspace]
  );

  // Rename a workspace
  const renameWorkspace = useCallback(
    async (id: string, name: string): Promise<void> => {
      if (!storageAvailable) return;

      try {
        const workspace = await loadWorkspaceDB(id);
        if (workspace) {
          workspace.name = name;
          workspace.lastModified = Date.now();
          await saveWorkspaceDB(workspace);

          const metadata = workspaces.find((w) => w.id === id);
          if (metadata) {
            metadata.name = name;
            metadata.lastModified = workspace.lastModified;
            updateWorkspaceMetadata(metadata);
            setWorkspaces((prev) => prev.map((w) => (w.id === id ? metadata : w)));
          }

          if (activeWorkspace?.id === id) {
            setActiveWorkspace(workspace);
          }
        }
      } catch (error) {
        console.error('Failed to rename workspace:', error);
      }
    },
    [storageAvailable, workspaces, activeWorkspace]
  );

  // Save a snapshot with debouncing for auto-saves
  const saveSnapshot = useCallback(
    async (frames: GifFrame[], currentFrameIndex: number, description: string, isAutoSave: boolean): Promise<void> => {
      if (!storageAvailable || !activeWorkspace) return;

      const performSave = async () => {
        const serializedFrames = serializeFrames(frames);

        // Calculate storage sizes
        const totalSize = calculateSerializedTotalSize(serializedFrames);
        const currentFrameSize = serializedFrames.length > currentFrameIndex
          ? calculateSerializedFrameSize(serializedFrames[currentFrameIndex])
          : 0;

        const snapshot: WorkspaceSnapshot = {
          id: `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          frames: serializedFrames,
          currentFrameIndex,
          description,
          isAutoSave,
          currentFrameSize,
          totalSize,
        };

        const updatedWorkspace = { ...activeWorkspace };
        updatedWorkspace.lastModified = Date.now();
        updatedWorkspace.currentFrames = snapshot.frames;
        updatedWorkspace.currentFrameIndex = currentFrameIndex;
        updatedWorkspace.currentFrameSize = currentFrameSize;
        updatedWorkspace.totalSize = totalSize;

        // Add snapshot to history
        const newHistory = updatedWorkspace.historyStack.slice(0, updatedWorkspace.currentHistoryIndex + 1);
        newHistory.push(snapshot);

        // Limit history size
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
        } else {
          updatedWorkspace.currentHistoryIndex++;
        }

        updatedWorkspace.historyStack = newHistory;

        await saveWorkspaceDB(updatedWorkspace);
        setActiveWorkspace(updatedWorkspace);

        // Update metadata
        const metadata = workspaces.find((w) => w.id === activeWorkspace.id);
        if (metadata) {
          metadata.lastModified = updatedWorkspace.lastModified;
          metadata.frameCount = frames.length;
          if (frames.length > 0) {
            metadata.thumbnail = generateThumbnail(frames[0]);
          }
          updateWorkspaceMetadata(metadata);
          setWorkspaces((prev) => prev.map((w) => (w.id === activeWorkspace.id ? metadata : w)));
        }
      };

      if (isAutoSave) {
        // Debounce auto-saves
        if (saveTimeout) {
          clearTimeout(saveTimeout);
        }
        const timeout = setTimeout(performSave, DEBOUNCE_DELAY);
        setSaveTimeout(timeout);
      } else {
        // Manual saves happen immediately
        await performSave();
      }
    },
    [storageAvailable, activeWorkspace, workspaces, saveTimeout]
  );

  // Undo to previous snapshot
  const undo = useCallback(async (): Promise<GifFrame[] | null> => {
    if (!activeWorkspace || activeWorkspace.currentHistoryIndex <= 0) {
      return null;
    }

    const newIndex = activeWorkspace.currentHistoryIndex - 1;
    const snapshot = activeWorkspace.historyStack[newIndex];

    const updatedWorkspace = {
      ...activeWorkspace,
      currentHistoryIndex: newIndex,
      currentFrames: snapshot.frames,
      currentFrameIndex: snapshot.currentFrameIndex,
    };

    await saveWorkspaceDB(updatedWorkspace);
    setActiveWorkspace(updatedWorkspace);

    return deserializeFrames(snapshot.frames);
  }, [activeWorkspace]);

  // Redo to next snapshot
  const redo = useCallback(async (): Promise<GifFrame[] | null> => {
    if (!activeWorkspace || activeWorkspace.currentHistoryIndex >= activeWorkspace.historyStack.length - 1) {
      return null;
    }

    const newIndex = activeWorkspace.currentHistoryIndex + 1;
    const snapshot = activeWorkspace.historyStack[newIndex];

    const updatedWorkspace = {
      ...activeWorkspace,
      currentHistoryIndex: newIndex,
      currentFrames: snapshot.frames,
      currentFrameIndex: snapshot.currentFrameIndex,
    };

    await saveWorkspaceDB(updatedWorkspace);
    setActiveWorkspace(updatedWorkspace);

    return deserializeFrames(snapshot.frames);
  }, [activeWorkspace]);

  // Save preview state
  const savePreview = useCallback(
    async (frameIndex: number, previewFrame: GifFrame): Promise<void> => {
      if (!activeWorkspace) return;

      const previewData: WorkspacePreviewData = {
        originalFrameIndex: frameIndex,
        previewFrame: {
          width: previewFrame.imageData.width,
          height: previewFrame.imageData.height,
          data: Array.from(previewFrame.imageData.data),
          delay: previewFrame.delay,
          disposalType: previewFrame.disposalType,
        },
      };

      const updatedWorkspace = {
        ...activeWorkspace,
        previewData,
      };

      await saveWorkspaceDB(updatedWorkspace);
      setActiveWorkspace(updatedWorkspace);
    },
    [activeWorkspace]
  );

  // Load preview state
  const loadPreview = useCallback((): { originalFrameIndex: number; previewFrame: GifFrame } | null => {
    if (!activeWorkspace?.previewData) return null;

    const { originalFrameIndex, previewFrame: serialized } = activeWorkspace.previewData;
    const previewFrame = {
      imageData: new ImageData(
        new Uint8ClampedArray(serialized.data),
        serialized.width,
        serialized.height
      ),
      canvas: document.createElement('canvas'),
      delay: serialized.delay,
      disposalType: serialized.disposalType,
    };

    // Draw to canvas
    previewFrame.canvas.width = serialized.width;
    previewFrame.canvas.height = serialized.height;
    const ctx = previewFrame.canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(previewFrame.imageData, 0, 0);
    }

    return { originalFrameIndex, previewFrame };
  }, [activeWorkspace]);

  // Clear preview state
  const clearPreview = useCallback(async (): Promise<void> => {
    if (!activeWorkspace) return;

    const updatedWorkspace = {
      ...activeWorkspace,
      previewData: undefined,
    };

    await saveWorkspaceDB(updatedWorkspace);
    setActiveWorkspace(updatedWorkspace);
  }, [activeWorkspace]);

  // Update workspace frames (called by frame manager)
  const updateWorkspaceFrames = useCallback(
    async (frames: GifFrame[], currentFrameIndex: number): Promise<void> => {
      if (!activeWorkspace) return;

      const serializedFrames = serializeFrames(frames);
      const totalSize = calculateSerializedTotalSize(serializedFrames);
      const currentFrameSize = serializedFrames.length > currentFrameIndex
        ? calculateSerializedFrameSize(serializedFrames[currentFrameIndex])
        : 0;

      const updatedWorkspace = {
        ...activeWorkspace,
        currentFrames: serializedFrames,
        currentFrameIndex,
        lastModified: Date.now(),
        currentFrameSize,
        totalSize,
      };

      await saveWorkspaceDB(updatedWorkspace);
      setActiveWorkspace(updatedWorkspace);
    },
    [activeWorkspace]
  );

  return {
    workspaces,
    activeWorkspace,
    activeWorkspaceId: activeWorkspace?.id || null,
    isLoading,
    isCreatingWorkspace,
    isSwitchingWorkspace,
    isClosingWorkspace,
    createWorkspace,
    switchWorkspace,
    closeWorkspace,
    renameWorkspace,
    saveSnapshot,
    undo,
    redo,
    canUndo: activeWorkspace ? activeWorkspace.currentHistoryIndex > 0 : false,
    canRedo: activeWorkspace
      ? activeWorkspace.currentHistoryIndex < activeWorkspace.historyStack.length - 1
      : false,
    savePreview,
    loadPreview,
    clearPreview,
    updateWorkspaceFrames,
  };
}
