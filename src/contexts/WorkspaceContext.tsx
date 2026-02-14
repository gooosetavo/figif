import { createContext, useContext, ReactNode } from 'react';
import { useWorkspaceManager, type UseWorkspaceManagerReturn } from '../hooks/useWorkspaceManager';
import { useFrameManager } from '../hooks/useFrameManager';
import type { GifFrame, DecodedGif } from '../types/gif.types';
import type { WorkspaceMetadata, Workspace } from '../types/workspace.types';

interface WorkspaceContextType {
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

  // Frame manager
  frames: GifFrame[];
  currentFrameIndex: number;
  isPlaying: boolean;
  setFrames: (frames: GifFrame[]) => void;
  setCurrentFrameIndex: (index: number) => void;
  goToNextFrame: () => void;
  goToPreviousFrame: () => void;
  play: () => void;
  pause: () => void;
  addFrame: (index: number, frame?: GifFrame) => void;
  deleteFrame: (index: number) => void;
  duplicateFrame: (index: number) => void;
  reorderFrame: (fromIndex: number, toIndex: number) => void;
  reverseFrames: () => void;
  updateFrameDelay: (index: number, delay: number) => void;
  updateAllFrameDelays: (delay: number) => void;
  loadGif: (gif: DecodedGif) => void;
  clearFrames: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const workspaceManager = useWorkspaceManager();
  const frameManager = useFrameManager();

  const value: WorkspaceContextType = {
    ...workspaceManager,
    ...frameManager,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
