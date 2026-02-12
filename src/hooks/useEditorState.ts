import { useState } from 'react';
import type { CropSelection } from '../components/Panels/CropPanel';

export const useEditorState = () => {
  const [zoom, setZoom] = useState(1);
  const [isManualSelectionMode, setIsManualSelectionMode] = useState(false);
  const [selectionMask, setSelectionMask] = useState<Uint8ClampedArray | null>(null);
  const [selectionPoints, setSelectionPoints] = useState<Array<{ x: number; y: number; tolerance: number }>>([]);
  const [manualTolerance, setManualTolerance] = useState(5);
  const [showBackgroundRemoval, setShowBackgroundRemoval] = useState(false);
  const [showResize, setShowResize] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [cropSelection, setCropSelection] = useState<CropSelection | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [isHistoryPanelCollapsed, setIsHistoryPanelCollapsed] = useState(false);
  const [selectedFrames, setSelectedFrames] = useState<Set<number>>(new Set());
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));
  const handleZoomReset = () => setZoom(1);

  return {
    zoom,
    setZoom,
    isManualSelectionMode,
    setIsManualSelectionMode,
    selectionMask,
    setSelectionMask,
    selectionPoints,
    setSelectionPoints,
    manualTolerance,
    setManualTolerance,
    showBackgroundRemoval,
    setShowBackgroundRemoval,
    showResize,
    setShowResize,
    showCrop,
    setShowCrop,
    cropSelection,
    setCropSelection,
    isResizing,
    setIsResizing,
    isCropping,
    setIsCropping,
    isHistoryPanelCollapsed,
    setIsHistoryPanelCollapsed,
    selectedFrames,
    setSelectedFrames,
    showPreviewModal,
    setShowPreviewModal,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
  };
};
