/**
 * Workspace and version control type definitions
 */

/**
 * Serialized representation of a GIF frame for storage
 */
export interface SerializedFrame {
  width: number;
  height: number;
  data: number[]; // Uint8ClampedArray converted to regular array for JSON
  delay: number;
  disposalType: number;
}

/**
 * Snapshot of workspace state for version control
 */
export interface WorkspaceSnapshot {
  id: string;
  timestamp: number;
  frames: SerializedFrame[];
  currentFrameIndex: number;
  description: string;
  isAutoSave: boolean;
  currentFrameSize?: number; // Size of current frame in bytes
  totalSize?: number; // Total size of all frames in bytes
  originalFileSize?: number; // Original file size in bytes (if available)
}

/**
 * Preview data stored in workspace
 */
export interface WorkspacePreviewData {
  originalFrameIndex: number;
  previewFrame: SerializedFrame;
}

/**
 * Complete workspace containing GIF frames and history
 */
export interface Workspace {
  id: string;
  name: string;
  createdAt: number;
  lastModified: number;
  currentFrames: SerializedFrame[];
  currentFrameIndex: number;
  historyStack: WorkspaceSnapshot[];
  currentHistoryIndex: number;
  previewData?: WorkspacePreviewData;
  currentFrameSize?: number; // Size of current frame in bytes
  totalSize?: number; // Total size of all frames in bytes
  originalFileSize?: number; // Original file size in bytes (if available)
}

/**
 * Lightweight workspace metadata for tabs and indexing
 */
export interface WorkspaceMetadata {
  id: string;
  name: string;
  lastModified: number;
  thumbnail?: string; // Data URL of first frame
  frameCount: number;
}

/**
 * localStorage index structure
 */
export interface WorkspaceIndex {
  activeWorkspaceId: string | null;
  workspaceOrder: string[]; // Tab order
  workspaces: Record<string, WorkspaceMetadata>;
}
