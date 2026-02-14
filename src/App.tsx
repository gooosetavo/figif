import { useEffect, useState } from 'react';
import { WorkspaceTabs } from './components/WorkspaceTabs/WorkspaceTabs';
import { PreviewModal } from './components/PreviewModal';
import { ExportModal } from './components/ExportModal';
import type { CropSelection } from './components/Panels/CropPanel';
import {
  AppHeader,
  AppFooter,
  AppToolbar,
  EmptyState,
  EditorLayout,
} from './components/Layout';
import { useEditor } from './contexts/EditorContext';
import { useWorkspace } from './contexts/WorkspaceContext';
import { useExportOperations } from './hooks/useExportOperations';
import { useFileOperations } from './hooks/useFileOperations';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTransformOperations } from './hooks/useTransformOperations';
import { useBackgroundOperations } from './hooks/useBackgroundOperations';
import { deserializeFrames } from './utils/serialization';
import './App.css';

function App() {
  const [showExportModal, setShowExportModal] = useState(false);

  const {
    setIsManualSelectionMode,
    setSelectionMask,
    setSelectionPoints,
    selectedFrames,
    setSelectedFrames,
    showPreviewModal,
    setCropSelection,
    setIsResizing,
    setIsCropping,
  } = useEditor();

  const {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    isLoading,
    isCreatingWorkspace,
    isSwitchingWorkspace,
    isClosingWorkspace,
    createWorkspace,
    switchWorkspace,
    closeWorkspace,
    saveSnapshot,
    undo,
    redo,
    loadPreview,
    frames,
    currentFrameIndex,
    setCurrentFrameIndex,
    setFrames,
  } = useWorkspace();

  const { handleExportWithOptions, exportProgress } = useExportOperations();
  const { handleFileSelect } = useFileOperations();
  const transformOps = useTransformOperations();
  const bgOps = useBackgroundOperations();

  // Keyboard shortcuts (side effects only)
  useKeyboardShortcuts();

  // Sync workspace frames with frame manager when switching workspaces
  useEffect(() => {
    if (activeWorkspace && activeWorkspace.currentFrames.length > 0) {
      const frames = deserializeFrames(activeWorkspace.currentFrames);
      setFrames(frames);
      setCurrentFrameIndex(activeWorkspace.currentFrameIndex);
    } else if (activeWorkspace && activeWorkspace.currentFrames.length === 0) {
      setFrames([]);
      setCurrentFrameIndex(0);
    } else if (!activeWorkspace) {
      // No active workspace - clear everything
      setFrames([]);
      setCurrentFrameIndex(0);
      setSelectedFrames(new Set());
      setSelectionMask(null);
      setSelectionPoints([]);
      setIsManualSelectionMode(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspace?.id]);

  // Handler wrappers for transform operations
  const handleApplyPadding = transformOps.handleApplyPadding;
  const handleRotate = (clockwise: boolean, scope: 'current' | 'selected' | 'all') =>
    transformOps.handleRotate(clockwise, scope, selectedFrames);
  const handleFlip = (horizontal: boolean, scope: 'current' | 'selected' | 'all') =>
    transformOps.handleFlip(horizontal, scope, selectedFrames);
  const handleSpin = (clockwise: boolean) => transformOps.handleSpin(clockwise);
  const handleResize = (width: number, height: number, maintainAspectRatio: boolean) =>
    transformOps.handleResize(width, height, maintainAspectRatio, setIsResizing);
  const handleCrop = (selection: CropSelection) =>
    transformOps.handleCrop(selection, setIsCropping, setCropSelection);

  // Handler wrappers for background operations
  const handleRemoveBackground = bgOps.handleRemoveBackground;
  const handlePreview = bgOps.handlePreview;
  const handleApplyPreview = bgOps.handleApplyPreview;
  const handleCancelPreview = bgOps.handleCancelPreview;
  const handleEnableManualMode = bgOps.handleEnableManualMode;
  const handleCanvasClick = bgOps.handleCanvasClick;
  const handleClearSelections = bgOps.handleClearSelections;
  const handleRemoveLastSelection = bgOps.handleRemoveLastSelection;
  const handleApplySelection = bgOps.handleApplySelection;
  const handleApplyToAllFrames = bgOps.handleApplyToAllFrames;

  // Undo/Redo handlers
  const handleUndo = async () => {
    const restoredFrames = await undo();
    if (restoredFrames) {
      setFrames(restoredFrames);
      if (activeWorkspace) {
        setCurrentFrameIndex(activeWorkspace.currentFrameIndex);
      }
    }
  };

  const handleRedo = async () => {
    const restoredFrames = await redo();
    if (restoredFrames) {
      setFrames(restoredFrames);
      if (activeWorkspace) {
        setCurrentFrameIndex(activeWorkspace.currentFrameIndex);
      }
    }
  };

  // Manual save handler
  const handleManualSave = async () => {
    if (activeWorkspace && frames.length > 0) {
      await saveSnapshot(
        frames,
        currentFrameIndex,
        'Manual save',
        false
      );
    }
  };

  const currentFrame = frames[currentFrameIndex] || null;
  const previewData = loadPreview();
  const previewImageData = previewData?.previewFrame.imageData || null;

  return (
    <div className="app">
      {/* Header - shows when no workspaces */}
      {workspaces.length === 0 && <AppHeader />}

      {/* Workspace Tabs */}
      {workspaces.length > 0 && (
        <WorkspaceTabs
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSwitchWorkspace={switchWorkspace}
          onCloseWorkspace={closeWorkspace}
          onCreateWorkspace={async () => {
            await createWorkspace(`Workspace ${workspaces.length + 1}`);
          }}
          isCreatingWorkspace={isCreatingWorkspace}
          isSwitchingWorkspace={isSwitchingWorkspace}
          isClosingWorkspace={isClosingWorkspace}
        />
      )}

      {/* Toolbar - shows when workspaces exist and frames are loaded */}
      {workspaces.length > 0 && frames.length > 0 && (
        <AppToolbar onShowExportModal={() => setShowExportModal(true)} />
      )}

      {/* Main content area */}
      {(frames.length === 0 || workspaces.length === 0) && !isLoading ? (
        <EmptyState onFileSelect={handleFileSelect} />
      ) : isLoading ? (
        <div className="upload-container">
          <p>Loading workspace...</p>
        </div>
      ) : (
        <EditorLayout
          onApplyPadding={handleApplyPadding}
          onRotate={handleRotate}
          onFlip={handleFlip}
          onSpin={handleSpin}
          onResize={handleResize}
          onCrop={handleCrop}
          onRemoveBackground={handleRemoveBackground}
          onEnableManualMode={handleEnableManualMode}
          onApplySelection={handleApplySelection}
          onApplyToAllFrames={handleApplyToAllFrames}
          onClearSelections={handleClearSelections}
          onRemoveLastSelection={handleRemoveLastSelection}
          onPreview={handlePreview}
          onCanvasClick={handleCanvasClick}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onManualSave={handleManualSave}
        />
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewImageData && currentFrame && (
        <PreviewModal
          originalFrame={currentFrame}
          previewImageData={previewImageData}
          onApply={handleApplyPreview}
          onCancel={handleCancelPreview}
          isOpen={showPreviewModal}
        />
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={(options) => {
          handleExportWithOptions(options, selectedFrames);
          // Close modal after successful export
          setTimeout(() => {
            setShowExportModal(false);
          }, 1000);
        }}
        totalFrames={frames.length}
        selectedFramesCount={selectedFrames.size}
        isExporting={exportProgress > 0 && exportProgress < 100}
        progress={exportProgress}
      />

      <AppFooter />
    </div>
  );
}

export default App;
