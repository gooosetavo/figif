import { useEffect, useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { CanvasEditor } from './components/CanvasEditor';
import { Timeline } from './components/Timeline';
import { BackgroundRemovalPanel, type GifEffect } from './components/Panels/BackgroundRemovalPanel';
import { HistoryPanel } from './components/Panels/HistoryPanel';
import { ResizePanel } from './components/Panels/ResizePanel';
import { CropPanel, type CropSelection } from './components/Panels/CropPanel';
import { PreviewModal } from './components/PreviewModal';
import { ExportModal } from './components/ExportModal';
import { WorkspaceTabs } from './components/WorkspaceTabs/WorkspaceTabs';
import { FrameControls } from './components/Sidebar/FrameControls';
import { PaddingControls } from './components/Sidebar/PaddingControls';
import { TransformControls } from './components/Sidebar/TransformControls';
import { useGifDecoder } from './hooks/useGifDecoder';
import { useBackgroundRemoval, type RemovalMode } from './hooks/useBackgroundRemoval';
import { useTheme } from './contexts/ThemeContext';
import { useEditor } from './contexts/EditorContext';
import { useWorkspace } from './contexts/WorkspaceContext';
import { useFrameOperations } from './hooks/useFrameOperations';
import { useExportOperations } from './hooks/useExportOperations';
import { useFileOperations } from './hooks/useFileOperations';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { deserializeFrames } from './utils/serialization';
import { resizeFrames, cropFrames } from './utils/imageTransform';
import { applyIntensifiesEffect, applyPartyEffect, applyOnDrugsEffect, addCustomPadding, rotate90, flipFrame } from './utils/gifEffects';
import type { AIBackgroundRemovalConfig } from './types/gif.types';
import './App.css';

function App() {
  const { theme, toggleTheme } = useTheme();

  // Use the editor context
  const {
    zoom,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
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
  } = useEditor();

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);

  const { isDecoding, error: decodeError } = useGifDecoder();

  // Use the workspace context (includes both workspace and frame management)
  const workspaceManager = useWorkspace();
  const {
    frames,
    currentFrameIndex,
    isPlaying,
    setCurrentFrameIndex,
    goToNextFrame,
    goToPreviousFrame,
    play,
    pause,
    setFrames,
  } = workspaceManager;

  const {
    removeBackgroundFromFrame,
    removeBackgroundFromFrames,
    previewBackgroundRemoval,
    selectWithMagicWand,
    applyMask,
    isProcessing: isBgProcessing,
    isGeneratingPreview,
    progress: bgProgress,
    aiProgress,
  } = useBackgroundRemoval();

  // Use custom hooks for operations
  const frameOps = useFrameOperations();
  const { handleExport, handleExportWithOptions, exportProgress, isEncoding, progress } = useExportOperations();
  const { handleFileSelect } = useFileOperations();

  // Keyboard shortcuts (side effects only)
  useKeyboardShortcuts();

  // Sync workspace frames with frame manager when switching workspaces
  useEffect(() => {
    if (workspaceManager.activeWorkspace && workspaceManager.activeWorkspace.currentFrames.length > 0) {
      const frames = deserializeFrames(workspaceManager.activeWorkspace.currentFrames);
      setFrames(frames);
      setCurrentFrameIndex(workspaceManager.activeWorkspace.currentFrameIndex);
    } else if (workspaceManager.activeWorkspace && workspaceManager.activeWorkspace.currentFrames.length === 0) {
      setFrames([]);
      setCurrentFrameIndex(0);
    } else if (!workspaceManager.activeWorkspace) {
      // No active workspace - clear everything
      setFrames([]);
      setCurrentFrameIndex(0);
      setSelectedFrames(new Set());
      setSelectionMask(null);
      setSelectionPoints([]);
      setIsManualSelectionMode(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceManager.activeWorkspace?.id]);

  // Wrapper functions for frame operations
  const handleDeleteFrame = (scope: 'current' | 'selected' = 'current') => {
    frameOps.handleDeleteFrame(scope, selectedFrames).then(() => {
      if (scope === 'selected') {
        setSelectedFrames(new Set());
      }
    });
  };

  const handleDuplicateFrame = (scope: 'current' | 'selected' = 'current') => {
    frameOps.handleDuplicateFrame(scope, selectedFrames);
  };

  const handleReverseFrames = () => {
    frameOps.handleReverseFrames();
  };

  const handleRemoveEveryOtherFrame = () => {
    frameOps.handleRemoveEveryOtherFrame();
  };

  const handleDuplicateAllFrames = () => {
    frameOps.handleDuplicateAllFrames();
  };

  const handleKeepEveryNthFrame = (n: number) => {
    frameOps.handleKeepEveryNthFrame(n);
  };

  const handleReorderFrames = (fromIndex: number, toIndex: number) => {
    frameOps.handleReorderFrames(fromIndex, toIndex, selectedFrames, setSelectedFrames);
  };

  const handleSpeedChange = (multiplier: number) => {
    frameOps.handleSpeedChange(multiplier);
  };

  // Transform operations (still in App.tsx for now)
  const handleApplyPadding = async (scope: 'current' | 'all', left: number, right: number, top: number, bottom: number) => {
    if (frames.length === 0) return;

    try {
      if (scope === 'current') {
        const paddedFrame = addCustomPadding(frames[currentFrameIndex], left, right, top, bottom);
        const newFrames = [...frames];
        newFrames[currentFrameIndex] = paddedFrame;
        setFrames(newFrames);

        if (workspaceManager.activeWorkspace) {
          await workspaceManager.saveSnapshot(
            newFrames,
            currentFrameIndex,
            `Applied padding to current frame (L:${left} R:${right} T:${top} B:${bottom})`,
            true
          );
        }
      } else {
        const paddedFrames = frames.map((frame: typeof frames[0]) => addCustomPadding(frame, left, right, top, bottom));
        setFrames(paddedFrames);

        if (workspaceManager.activeWorkspace) {
          await workspaceManager.saveSnapshot(
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

  const handleRotate = async (clockwise: boolean, scope: 'current' | 'selected' | 'all') => {
    if (frames.length === 0) return;

    try {
      const newFrames = [...frames];
      const framesToRotate = scope === 'all'
        ? Array.from({ length: frames.length }, (_, i) => i)
        : scope === 'selected'
        ? Array.from(selectedFrames)
        : [currentFrameIndex];

      for (const index of framesToRotate) {
        newFrames[index] = rotate90(frames[index], clockwise);
      }

      setFrames(newFrames);

      if (workspaceManager.activeWorkspace) {
        const direction = clockwise ? 'clockwise' : 'counterclockwise';
        const scopeText = scope === 'all'
          ? 'all frames'
          : scope === 'selected'
          ? `${framesToRotate.length} selected frame${framesToRotate.length !== 1 ? 's' : ''}`
          : 'current frame';

        await workspaceManager.saveSnapshot(
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

  const handleFlip = async (horizontal: boolean, scope: 'current' | 'selected' | 'all') => {
    if (frames.length === 0) return;

    try {
      const newFrames = [...frames];
      const framesToFlip = scope === 'all'
        ? Array.from({ length: frames.length }, (_, i) => i)
        : scope === 'selected'
        ? Array.from(selectedFrames)
        : [currentFrameIndex];

      for (const index of framesToFlip) {
        newFrames[index] = flipFrame(frames[index], horizontal);
      }

      setFrames(newFrames);

      if (workspaceManager.activeWorkspace) {
        const direction = horizontal ? 'horizontally' : 'vertically';
        const scopeText = scope === 'all'
          ? 'all frames'
          : scope === 'selected'
          ? `${framesToFlip.length} selected frame${framesToFlip.length !== 1 ? 's' : ''}`
          : 'current frame';

        await workspaceManager.saveSnapshot(
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

  const handleRemoveBackground = async (
    mode: RemovalMode,
    target: 'current' | 'all',
    config?: AIBackgroundRemovalConfig
  ) => {
    if (frames.length === 0) return;

    try {
      if (target === 'current') {
        const processedFrame = await removeBackgroundFromFrame(
          frames[currentFrameIndex],
          mode,
          config
        );
        const newFrames = [...frames];
        newFrames[currentFrameIndex] = processedFrame;
        setFrames(newFrames);

        // Auto-save
        if (workspaceManager.activeWorkspace) {
          await workspaceManager.saveSnapshot(
            newFrames,
            currentFrameIndex,
            `Background removed (${mode})`,
            true
          );
        }
      } else {
        const processedFrames = await removeBackgroundFromFrames(
          frames,
          mode,
          config,
          (progress) => {
            console.log(`Processing: ${progress}%`);
          }
        );
        setFrames(processedFrames);

        // Auto-save
        if (workspaceManager.activeWorkspace) {
          await workspaceManager.saveSnapshot(
            processedFrames,
            currentFrameIndex,
            `Background removed from all frames (${mode})`,
            true
          );
        }
      }
      setSelectionMask(null);
    } catch (err) {
      console.error('Failed to remove background:', err);
    }
  };

  const handlePreview = async (config: AIBackgroundRemovalConfig) => {
    if (!frames[currentFrameIndex]) return;

    try {
      const preview = await previewBackgroundRemoval(frames[currentFrameIndex], config);

      // Create a preview frame with the preview image data
      const canvas = document.createElement('canvas');
      canvas.width = preview.width;
      canvas.height = preview.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      ctx.putImageData(preview, 0, 0);

      const previewFrame = {
        ...frames[currentFrameIndex],
        imageData: preview,
        canvas,
      };

      // Save preview to workspace
      if (workspaceManager.activeWorkspace) {
        await workspaceManager.savePreview(currentFrameIndex, previewFrame);
      }

      setShowPreviewModal(true);
    } catch (err) {
      console.error('Failed to generate preview:', err);
    }
  };

  const handleApplyPreview = async () => {
    if (!frames[currentFrameIndex]) return;

    try {
      const previewData = workspaceManager.loadPreview();
      if (!previewData) {
        console.error('No preview data available');
        return;
      }

      const processedFrame = previewData.previewFrame;

      const newFrames = [...frames];
      newFrames[currentFrameIndex] = processedFrame;
      setFrames(newFrames);

      // Save snapshot
      if (workspaceManager.activeWorkspace) {
        await workspaceManager.saveSnapshot(
          newFrames,
          currentFrameIndex,
          'Applied background removal preview',
          false
        );
      }

      setShowPreviewModal(false);
      await workspaceManager.clearPreview();
    } catch (err) {
      console.error('Failed to apply preview:', err);
    }
  };

  const handleCancelPreview = async () => {
    setShowPreviewModal(false);
    await workspaceManager.clearPreview();
  };

  const handleEnableManualMode = () => {
    setIsManualSelectionMode(true);
    handleClearSelections();
  };

  const handleCanvasClick = (x: number, y: number) => {
    if (!isManualSelectionMode || !frames[currentFrameIndex]) return;

    const newMask = selectWithMagicWand(frames[currentFrameIndex].imageData, x, y, manualTolerance);

    // Combine with existing mask if there is one
    const combinedMask = selectionMask
      ? combineMasks(selectionMask, newMask)
      : newMask;

    setSelectionMask(combinedMask);
    setSelectionPoints([...selectionPoints, { x, y, tolerance: manualTolerance }]);
  };

  // Helper to combine two masks (OR operation)
  const combineMasks = (mask1: Uint8ClampedArray, mask2: Uint8ClampedArray): Uint8ClampedArray => {
    const combined = new Uint8ClampedArray(mask1.length);
    for (let i = 0; i < mask1.length; i++) {
      combined[i] = mask1[i] === 255 || mask2[i] === 255 ? 255 : 0;
    }
    return combined;
  };

  const handleClearSelections = () => {
    setSelectionMask(null);
    setSelectionPoints([]);
  };

  const handleRemoveLastSelection = () => {
    if (selectionPoints.length === 0) return;

    const newPoints = selectionPoints.slice(0, -1);
    setSelectionPoints(newPoints);

    // Rebuild mask from remaining points
    if (newPoints.length === 0) {
      setSelectionMask(null);
    } else if (frames[currentFrameIndex]) {
      let combinedMask: Uint8ClampedArray | null = null;
      for (const point of newPoints) {
        const mask = selectWithMagicWand(
          frames[currentFrameIndex].imageData,
          point.x,
          point.y,
          point.tolerance
        );
        combinedMask = combinedMask ? combineMasks(combinedMask, mask) : mask;
      }
      setSelectionMask(combinedMask);
    }
  };

  const handleApplySelection = async (_tolerance: number, invert: boolean, effect: GifEffect) => {
    if (!selectionMask || !frames[currentFrameIndex]) return;

    try {
      const processedFrame = applyMask(frames[currentFrameIndex], selectionMask, invert);
      const newFrames = [...frames];
      newFrames[currentFrameIndex] = processedFrame;
      setFrames(newFrames);
      handleClearSelections();
      // Keep manual mode active so user can continue selecting

      // Auto-save
      if (workspaceManager.activeWorkspace) {
        await workspaceManager.saveSnapshot(
          newFrames,
          currentFrameIndex,
          `Applied manual selection (${selectionPoints.length} area${selectionPoints.length !== 1 ? 's' : ''})${effect !== 'none' ? ` + ${effect}` : ''}`,
          true
        );
      }
    } catch (err) {
      console.error('Failed to apply selection:', err);
    }
  };

  const handleApplyToAllFrames = async (_tolerance: number, invert: boolean, effect: GifEffect) => {
    if (selectionPoints.length === 0 || frames.length === 0) {
      console.error('No selection points saved. Click on the background first.');
      return;
    }

    try {
      let processedFrames: typeof frames = [];

      for (const frame of frames) {
        // Reapply magic wand at all saved locations and combine masks
        // Note: Using each point's stored tolerance value, not the current tolerance slider
        let combinedMask: Uint8ClampedArray | null = null;

        for (const point of selectionPoints) {
          const mask = selectWithMagicWand(frame.imageData, point.x, point.y, point.tolerance);
          combinedMask = combinedMask ? combineMasks(combinedMask, mask) : mask;
        }

        if (combinedMask) {
          const processedFrame = applyMask(frame, combinedMask, invert);
          processedFrames.push(processedFrame);
        }
      }

      // Apply effects if selected
      if (effect === 'intensifies') {
        processedFrames = applyIntensifiesEffect(processedFrames);
      } else if (effect === 'party') {
        processedFrames = applyPartyEffect(processedFrames);
      } else if (effect === 'on-drugs') {
        processedFrames = applyOnDrugsEffect(processedFrames);
      }

      setFrames(processedFrames);
      handleClearSelections();
      // Keep manual mode active so user can continue selecting

      // Auto-save
      if (workspaceManager.activeWorkspace) {
        await workspaceManager.saveSnapshot(
          processedFrames,
          currentFrameIndex,
          `Applied manual selection to all frames (${selectionPoints.length} area${selectionPoints.length !== 1 ? 's' : ''})${effect !== 'none' ? ` + ${effect}` : ''}`,
          true
        );
      }
    } catch (err) {
      console.error('Failed to apply selection to all frames:', err);
    }
  };


  // Manual save handler
  const handleManualSave = async () => {
    if (workspaceManager.activeWorkspace && frames.length > 0) {
      await workspaceManager.saveSnapshot(
        frames,
        currentFrameIndex,
        'Manual save',
        false
      );
    }
  };

  // Undo/Redo handlers
  const handleUndo = async () => {
    const restoredFrames = await workspaceManager.undo();
    if (restoredFrames) {
      setFrames(restoredFrames);
      if (workspaceManager.activeWorkspace) {
        setCurrentFrameIndex(workspaceManager.activeWorkspace.currentFrameIndex);
      }
    }
  };

  const handleRedo = async () => {
    const restoredFrames = await workspaceManager.redo();
    if (restoredFrames) {
      setFrames(restoredFrames);
      if (workspaceManager.activeWorkspace) {
        setCurrentFrameIndex(workspaceManager.activeWorkspace.currentFrameIndex);
      }
    }
  };

  // Resize handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleResize = async (width: number, height: number, _maintainAspectRatio: boolean) => {
    if (frames.length === 0) return;

    setIsResizing(true);
    try {
      const resizedFrames = resizeFrames(frames, width, height);
      setFrames(resizedFrames);

      // Auto-save
      if (workspaceManager.activeWorkspace) {
        await workspaceManager.saveSnapshot(
          resizedFrames,
          currentFrameIndex,
          `Resized to ${width}×${height}`,
          false
        );
      }
    } catch (err) {
      console.error('Failed to resize frames:', err);
    } finally {
      setIsResizing(false);
    }
  };

  // Crop handler
  const handleCrop = async (selection: CropSelection) => {
    if (frames.length === 0) return;

    setIsCropping(true);
    try {
      const croppedFrames = cropFrames(
        frames,
        selection.x,
        selection.y,
        selection.width,
        selection.height
      );
      setFrames(croppedFrames);

      // Auto-save
      if (workspaceManager.activeWorkspace) {
        await workspaceManager.saveSnapshot(
          croppedFrames,
          currentFrameIndex,
          `Cropped to ${selection.width}×${selection.height}`,
          false
        );
      }

      // Clear crop selection
      setCropSelection(null);
    } catch (err) {
      console.error('Failed to crop frames:', err);
    } finally {
      setIsCropping(false);
    }
  };

  const currentFrame = frames[currentFrameIndex] || null;

  // Get preview data for modal
  const previewData = workspaceManager.loadPreview();
  const previewImageData = previewData?.previewFrame.imageData || null;

  return (
    <div className="app">
      {/* Header - shows when no workspaces */}
      {workspaceManager.workspaces.length === 0 && (
        <header className="app-header">
          <h1>🎨 FIGIF - Image & GIF Editor</h1>
          <p>Edit GIFs and images in your browser - no upload required</p>
        </header>
      )}

      {/* Workspace Tabs */}
      {workspaceManager.workspaces.length > 0 && (
        <WorkspaceTabs
          workspaces={workspaceManager.workspaces}
          activeWorkspaceId={workspaceManager.activeWorkspaceId}
          onSwitchWorkspace={workspaceManager.switchWorkspace}
          onCloseWorkspace={workspaceManager.closeWorkspace}
          onCreateWorkspace={async () => {
            await workspaceManager.createWorkspace(`Workspace ${workspaceManager.workspaces.length + 1}`);
          }}
          isCreatingWorkspace={workspaceManager.isCreatingWorkspace}
          isSwitchingWorkspace={workspaceManager.isSwitchingWorkspace}
          isClosingWorkspace={workspaceManager.isClosingWorkspace}
        />
      )}

      {/* Toolbar - shows when workspaces exist */}
      {workspaceManager.workspaces.length > 0 && frames.length > 0 && (
        <div className="toolbar">
          <div className="toolbar-content">
            <button onClick={handleExport} disabled={isEncoding} className="toolbar-button export-button">
              {isEncoding ? `Exporting... ${progress}%` : '💾 Download GIF'}
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              disabled={isEncoding || exportProgress > 0}
              className="toolbar-button"
            >
              📤 Export As...
            </button>
            <button onClick={() => window.location.reload()} className="toolbar-button">
              📂 Load New Image
            </button>
            <button
              onClick={toggleTheme}
              className="toolbar-button"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </div>
      )}

      {(frames.length === 0 || workspaceManager.workspaces.length === 0) && !workspaceManager.isLoading ? (
        <div className="upload-container">
          <FileUpload
            onFileSelect={handleFileSelect}
            isLoading={isDecoding || workspaceManager.isCreatingWorkspace}
          />
          {decodeError && <p className="error-message">{decodeError}</p>}
        </div>
      ) : workspaceManager.isLoading ? (
        <div className="upload-container">
          <p>Loading workspace...</p>
        </div>
      ) : (
        <div className="editor-container">
          <aside className="sidebar">
            <FrameControls
              framesCount={frames.length}
              selectedFramesCount={selectedFrames.size}
              onDuplicateFrame={handleDuplicateFrame}
              onDeleteFrame={handleDeleteFrame}
              onReverseFrames={handleReverseFrames}
              onRemoveEveryOtherFrame={handleRemoveEveryOtherFrame}
              onDuplicateAllFrames={handleDuplicateAllFrames}
              onKeepEveryNthFrame={handleKeepEveryNthFrame}
              onSpeedChange={handleSpeedChange}
            />

            <PaddingControls
              framesCount={frames.length}
              onApplyPadding={handleApplyPadding}
            />

            <TransformControls
              framesCount={frames.length}
              selectedFramesCount={selectedFrames.size}
              onRotate={handleRotate}
              onFlip={handleFlip}
            />

            <div className="control-section">
              <h3>Resize</h3>
              <div className="control-group">
                <button
                  onClick={() => setShowResize(!showResize)}
                  className={showResize ? 'active-toggle' : ''}
                >
                  {showResize ? 'Hide' : 'Show'} Resize
                </button>
              </div>
              {showResize && currentFrame && (
                <div style={{ marginTop: '12px' }}>
                  <ResizePanel
                    currentWidth={currentFrame.imageData.width}
                    currentHeight={currentFrame.imageData.height}
                    onResize={handleResize}
                    isProcessing={isResizing}
                  />
                </div>
              )}
            </div>

            <div className="control-section">
              <h3>Crop</h3>
              <div className="control-group">
                <button
                  onClick={() => {
                    setShowCrop(!showCrop);
                    if (showCrop) {
                      setCropSelection(null);
                    }
                  }}
                  className={showCrop ? 'active-toggle' : ''}
                >
                  {showCrop ? 'Hide' : 'Show'} Crop
                </button>
              </div>
              {showCrop && currentFrame && (
                <div style={{ marginTop: '12px' }}>
                  <CropPanel
                    imageWidth={currentFrame.imageData.width}
                    imageHeight={currentFrame.imageData.height}
                    cropSelection={cropSelection}
                    onCropSelectionChange={setCropSelection}
                    onApplyCrop={handleCrop}
                    isProcessing={isCropping}
                  />
                </div>
              )}
            </div>

            <div className="control-section">
              <h3>Background Selection</h3>
              <div className="control-group">
                <button
                  onClick={() => setShowBackgroundRemoval(!showBackgroundRemoval)}
                  className={showBackgroundRemoval ? 'active-toggle' : ''}
                >
                  {showBackgroundRemoval ? 'Hide' : 'Show'} Background Selection
                </button>
              </div>
              {showBackgroundRemoval && (
                <div style={{ marginTop: '12px' }}>
                  <BackgroundRemovalPanel
                    onRemoveBackground={handleRemoveBackground}
                    onEnableManualMode={handleEnableManualMode}
                    onApplySelection={handleApplySelection}
                    onApplyToAllFrames={handleApplyToAllFrames}
                    onClearSelections={handleClearSelections}
                    onRemoveLastSelection={handleRemoveLastSelection}
                    onPreview={handlePreview}
                    tolerance={manualTolerance}
                    onToleranceChange={setManualTolerance}
                    selectionCount={selectionPoints.length}
                    isProcessing={isBgProcessing}
                    progress={bgProgress}
                    isManualMode={isManualSelectionMode}
                    isGeneratingPreview={isGeneratingPreview}
                    aiProgress={aiProgress}
                    currentFrame={currentFrame}
                  />
                </div>
              )}
            </div>

          </aside>

          <main className="main-content">
            <CanvasEditor
              frame={currentFrame}
              zoom={zoom}
              selectionMode={isManualSelectionMode}
              selectionMask={selectionMask}
              cropSelection={cropSelection}
              onCropSelectionChange={setCropSelection}
              onCanvasClick={handleCanvasClick}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onZoomReset={handleZoomReset}
            />
            <Timeline
              frames={frames}
              currentFrameIndex={currentFrameIndex}
              isPlaying={isPlaying}
              selectedFrames={selectedFrames}
              onFrameSelect={setCurrentFrameIndex}
              onFrameMultiSelect={setSelectedFrames}
              onReorderFrames={handleReorderFrames}
              onPlay={play}
              onPause={pause}
              onNext={goToNextFrame}
              onPrevious={goToPreviousFrame}
            />
          </main>

          {/* Right Panel - History */}
          {workspaceManager.activeWorkspace && (
            <aside className={`right-panel ${isHistoryPanelCollapsed ? 'collapsed' : ''}`}>
              <button
                className="right-panel-toggle"
                onClick={() => setIsHistoryPanelCollapsed(!isHistoryPanelCollapsed)}
                aria-label={isHistoryPanelCollapsed ? 'Show history' : 'Hide history'}
              >
                {isHistoryPanelCollapsed ? '▶' : '◀'}
              </button>
              <div className="right-panel-header">
                <h3>History & Version Control</h3>
              </div>
              <div className="right-panel-content">
                <HistoryPanel
                  historyStack={workspaceManager.activeWorkspace.historyStack}
                  currentHistoryIndex={workspaceManager.activeWorkspace.currentHistoryIndex}
                  canUndo={workspaceManager.canUndo}
                  canRedo={workspaceManager.canRedo}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onSaveNow={handleManualSave}
                  currentFrames={frames}
                  currentFrameIndex={currentFrameIndex}
                />
              </div>
            </aside>
          )}
        </div>
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

      <footer className="app-footer">
        <p>
          Made with ❤️ | All processing happens in your browser
          {import.meta.env.VITE_GITHUB_URL && (
            <>
              {' | '}
              <a
                href={import.meta.env.VITE_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Source Code
              </a>
              {' | '}
              <a
                href={`${import.meta.env.VITE_GITHUB_URL}/issues`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Report Issue
              </a>
            </>
          )}
        </p>
        {import.meta.env.VITE_COMMIT_SHA && (
          <p className="build-info">
            Build:{' '}
            {import.meta.env.VITE_GITHUB_URL ? (
              <a
                href={`${import.meta.env.VITE_GITHUB_URL}/commit/${import.meta.env.VITE_COMMIT_SHA}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {import.meta.env.VITE_COMMIT_SHA.substring(0, 7)}
              </a>
            ) : (
              import.meta.env.VITE_COMMIT_SHA.substring(0, 7)
            )}
            {import.meta.env.VITE_BUILD_DATE && (
              <> • {new Date(import.meta.env.VITE_BUILD_DATE).toLocaleDateString()}</>
            )}
          </p>
        )}
      </footer>
    </div>
  );
}

export default App;
