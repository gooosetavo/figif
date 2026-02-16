import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useEditorState } from '../hooks/useEditorState';
import type { CropSelection } from '../components/Panels/CropPanel';
import type { ProcessingMode } from '../services/grpcClient';

interface EditorContextType {
  zoom: number;
  setZoom: (zoom: number) => void;
  isManualSelectionMode: boolean;
  setIsManualSelectionMode: (mode: boolean) => void;
  selectionMask: Uint8ClampedArray | null;
  setSelectionMask: (mask: Uint8ClampedArray | null) => void;
  selectionPoints: Array<{ x: number; y: number; tolerance: number }>;
  setSelectionPoints: (points: Array<{ x: number; y: number; tolerance: number }>) => void;
  manualTolerance: number;
  setManualTolerance: (tolerance: number) => void;
  showBackgroundRemoval: boolean;
  setShowBackgroundRemoval: (show: boolean) => void;
  showResize: boolean;
  setShowResize: (show: boolean) => void;
  showCrop: boolean;
  setShowCrop: (show: boolean) => void;
  cropSelection: CropSelection | null;
  setCropSelection: (selection: CropSelection | null) => void;
  isResizing: boolean;
  setIsResizing: (resizing: boolean) => void;
  isCropping: boolean;
  setIsCropping: (cropping: boolean) => void;
  isHistoryPanelCollapsed: boolean;
  setIsHistoryPanelCollapsed: (collapsed: boolean) => void;
  selectedFrames: Set<number>;
  setSelectedFrames: (frames: Set<number>) => void;
  showPreviewModal: boolean;
  setShowPreviewModal: (show: boolean) => void;
  processingMode: ProcessingMode;
  setProcessingMode: (mode: ProcessingMode) => void;
  isBackendAvailable: boolean;
  setIsBackendAvailable: (available: boolean) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleZoomReset: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const editorState = useEditorState();

  return (
    <EditorContext.Provider value={editorState}>
      {children}
    </EditorContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useEditor = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};
