import { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { CanvasEditor } from './components/CanvasEditor';
import { Timeline } from './components/Timeline';
import { BackgroundRemovalPanel } from './components/Panels/BackgroundRemovalPanel';
import { HistoryPanel } from './components/Panels/HistoryPanel';
import { ResizePanel } from './components/Panels/ResizePanel';
import { CropPanel, type CropSelection } from './components/Panels/CropPanel';
import { PreviewModal } from './components/PreviewModal';
import { WorkspaceTabs } from './components/WorkspaceTabs/WorkspaceTabs';
import { useGifDecoder } from './hooks/useGifDecoder';
import { useGifEncoder } from './hooks/useGifEncoder';
import { useFrameManager } from './hooks/useFrameManager';
import { useBackgroundRemoval, type RemovalMode } from './hooks/useBackgroundRemoval';
import { useWorkspaceManager } from './hooks/useWorkspaceManager';
import { deserializeFrames } from './utils/serialization';
import { isGifFile, convertImageToGif } from './utils/imageToGif';
import { resizeFrames, cropFrames } from './utils/imageTransform';
import type { AIBackgroundRemovalConfig } from './types/gif.types';
import './App.css';

function App() {
  const [zoom, setZoom] = useState(1);
  const [isManualSelectionMode, setIsManualSelectionMode] = useState(false);
  const [selectionMask, setSelectionMask] = useState<Uint8ClampedArray | null>(null);
  const [selectionPoints, setSelectionPoints] = useState<Array<{ x: number; y: number; tolerance: number }>>([]);
  const [manualTolerance, setManualTolerance] = useState(50);
  const [showBackgroundRemoval, setShowBackgroundRemoval] = useState(false);
  const [showResize, setShowResize] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [cropSelection, setCropSelection] = useState<CropSelection | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [isHistoryPanelCollapsed, setIsHistoryPanelCollapsed] = useState(false);

  // Preview state
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const { decodeGif, isDecoding, error: decodeError } = useGifDecoder();
  const { downloadGif, isEncoding, progress } = useGifEncoder();
  const {
    frames,
    currentFrameIndex,
    isPlaying,
    setCurrentFrameIndex,
    goToNextFrame,
    goToPreviousFrame,
    play,
    pause,
    loadGif,
    setFrames,
    deleteFrame,
    duplicateFrame,
    reverseFrames,
    updateAllFrameDelays,
  } = useFrameManager();
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

  // Workspace manager
  const workspaceManager = useWorkspaceManager();

  // Sync workspace frames with frame manager when switching workspaces
  useEffect(() => {
    if (workspaceManager.activeWorkspace && workspaceManager.activeWorkspace.currentFrames.length > 0) {
      const frames = deserializeFrames(workspaceManager.activeWorkspace.currentFrames);
      setFrames(frames);
      setCurrentFrameIndex(workspaceManager.activeWorkspace.currentFrameIndex);
    } else if (workspaceManager.activeWorkspace && workspaceManager.activeWorkspace.currentFrames.length === 0) {
      setFrames([]);
      setCurrentFrameIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceManager.activeWorkspace?.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const isMac = navigator.userAgent.indexOf('Mac') !== -1;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl/Cmd + Z
      if (ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (workspaceManager.canUndo) {
          const restoredFrames = await workspaceManager.undo();
          if (restoredFrames) {
            setFrames(restoredFrames);
            if (workspaceManager.activeWorkspace) {
              setCurrentFrameIndex(workspaceManager.activeWorkspace.currentFrameIndex);
            }
          }
        }
      }

      // Redo: Ctrl/Cmd + Shift + Z
      if (ctrlKey && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (workspaceManager.canRedo) {
          const restoredFrames = await workspaceManager.redo();
          if (restoredFrames) {
            setFrames(restoredFrames);
            if (workspaceManager.activeWorkspace) {
              setCurrentFrameIndex(workspaceManager.activeWorkspace.currentFrameIndex);
            }
          }
        }
      }

      // Save: Ctrl/Cmd + S
      if (ctrlKey && e.key === 's') {
        e.preventDefault();
        if (workspaceManager.activeWorkspace && frames.length > 0) {
          await workspaceManager.saveSnapshot(
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
  }, [workspaceManager, frames, currentFrameIndex, setFrames, setCurrentFrameIndex]);

  const handleFileSelect = async (file: File) => {
    try {
      let decodedGif;

      // Check if file is a GIF or needs conversion
      if (isGifFile(file)) {
        decodedGif = await decodeGif(file);
      } else {
        // Convert static image to GIF
        decodedGif = await convertImageToGif(file);
      }

      // Create or load into workspace
      if (!workspaceManager.activeWorkspace) {
        const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        await workspaceManager.createWorkspace(fileName, decodedGif);
      } else {
        loadGif(decodedGif);
        const description = isGifFile(file) ? 'GIF loaded' : 'Image loaded';
        await workspaceManager.saveSnapshot(decodedGif.frames, 0, description, true);
      }
    } catch (err) {
      console.error('Failed to load image:', err);
    }
  };

  const handleExport = async () => {
    if (frames.length === 0) return;

    try {
      await downloadGif(frames, 'edited.gif', {
        quality: 10,
        loopCount: 0,
      });
    } catch (err) {
      console.error('Failed to export GIF:', err);
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));
  const handleZoomReset = () => setZoom(1);

  const handleSpeedChange = (multiplier: number) => {
    if (frames.length === 0) return;
    const newDelay = Math.max(10, Math.round(frames[currentFrameIndex].delay / multiplier));
    updateAllFrameDelays(newDelay);
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
    setSelectionPoints(prev => [...prev, { x, y, tolerance: manualTolerance }]);
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

  const handleApplySelection = async (_tolerance: number, invert: boolean) => {
    if (!selectionMask || !frames[currentFrameIndex]) return;

    try {
      const processedFrame = applyMask(frames[currentFrameIndex], selectionMask, invert);
      const newFrames = [...frames];
      newFrames[currentFrameIndex] = processedFrame;
      setFrames(newFrames);
      handleClearSelections();
      setIsManualSelectionMode(false);

      // Auto-save
      if (workspaceManager.activeWorkspace) {
        await workspaceManager.saveSnapshot(
          newFrames,
          currentFrameIndex,
          `Applied manual selection (${selectionPoints.length} area${selectionPoints.length !== 1 ? 's' : ''})`,
          true
        );
      }
    } catch (err) {
      console.error('Failed to apply selection:', err);
    }
  };

  const handleApplyToAllFrames = async (_tolerance: number, invert: boolean) => {
    if (selectionPoints.length === 0 || frames.length === 0) {
      console.error('No selection points saved. Click on the background first.');
      return;
    }

    try {
      const processedFrames: typeof frames = [];

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

      setFrames(processedFrames);
      handleClearSelections();
      setIsManualSelectionMode(false);

      // Auto-save
      if (workspaceManager.activeWorkspace) {
        await workspaceManager.saveSnapshot(
          processedFrames,
          currentFrameIndex,
          `Applied manual selection to all frames (${selectionPoints.length} area${selectionPoints.length !== 1 ? 's' : ''})`,
          true
        );
      }
    } catch (err) {
      console.error('Failed to apply selection to all frames:', err);
    }
  };

  // Enhanced frame operations with auto-save
  const handleDeleteFrame = async (index: number) => {
    if (frames.length <= 1) return;
    deleteFrame(index);

    // Auto-save after state updates
    setTimeout(async () => {
      if (workspaceManager.activeWorkspace && frames.length > 1) {
        const newFrames = frames.filter((_f, i) => i !== index);
        await workspaceManager.saveSnapshot(
          newFrames,
          Math.min(index, newFrames.length - 1),
          'Deleted frame',
          true
        );
      }
    }, 100);
  };

  const handleDuplicateFrame = async (index: number) => {
    duplicateFrame(index);

    // Auto-save after state updates
    setTimeout(async () => {
      if (workspaceManager.activeWorkspace) {
        await workspaceManager.saveSnapshot(
          frames,
          currentFrameIndex,
          'Duplicated frame',
          true
        );
      }
    }, 100);
  };

  const handleReverseFrames = async () => {
    reverseFrames();

    // Auto-save after state updates
    setTimeout(async () => {
      if (workspaceManager.activeWorkspace) {
        await workspaceManager.saveSnapshot(
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
      if (workspaceManager.activeWorkspace) {
        await workspaceManager.saveSnapshot(
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
      if (workspaceManager.activeWorkspace) {
        await workspaceManager.saveSnapshot(
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
      if (workspaceManager.activeWorkspace) {
        await workspaceManager.saveSnapshot(
          filteredFrames,
          newIndex,
          `Kept every ${n}th frame (${frames.length} → ${filteredFrames.length})`,
          true
        );
      }
    }, 100);
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
      <header className="app-header">
        <h1>🎨 FIGIF - Image & GIF Editor</h1>
        <p>Edit GIFs and images in your browser - no upload required</p>
      </header>

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

      {frames.length === 0 && !workspaceManager.isLoading ? (
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
            <div className="control-section">
              <h3>View</h3>
              <div className="control-group">
                <label>Zoom: {Math.round(zoom * 100)}%</label>
                <div className="button-group">
                  <button onClick={handleZoomOut}>-</button>
                  <button onClick={handleZoomReset}>Reset</button>
                  <button onClick={handleZoomIn}>+</button>
                </div>
              </div>
            </div>

            <div className="control-section">
              <h3>Speed</h3>
              <div className="button-group">
                <button onClick={() => handleSpeedChange(0.5)} title="Slower (2x)">− Slower</button>
                <button onClick={() => handleSpeedChange(2)} title="Faster (2x)">+ Faster</button>
              </div>
            </div>

            <div className="control-section">
              <h3>Frames</h3>
              <div className="control-group">
                <button onClick={() => handleDuplicateFrame(currentFrameIndex)}>Duplicate Frame</button>
                <button onClick={() => handleDeleteFrame(currentFrameIndex)} disabled={frames.length <= 1}>
                  Delete Frame
                </button>
                <button onClick={handleReverseFrames}>Reverse All</button>
              </div>
              <div className="control-group" style={{ marginTop: '8px' }}>
                <button onClick={handleRemoveEveryOtherFrame} disabled={frames.length <= 1}>
                  Remove Every Other
                </button>
                <button onClick={handleDuplicateAllFrames} disabled={frames.length === 0}>
                  Duplicate All
                </button>
              </div>
              <div className="control-group" style={{ marginTop: '8px', gap: '4px' }}>
                <button
                  onClick={() => handleKeepEveryNthFrame(3)}
                  disabled={frames.length <= 2}
                  title="Keep every 3rd frame"
                  style={{ fontSize: '13px' }}
                >
                  Keep 1/3
                </button>
                <button
                  onClick={() => handleKeepEveryNthFrame(4)}
                  disabled={frames.length <= 3}
                  title="Keep every 4th frame"
                  style={{ fontSize: '13px' }}
                >
                  Keep 1/4
                </button>
                <button
                  onClick={() => handleKeepEveryNthFrame(5)}
                  disabled={frames.length <= 4}
                  title="Keep every 5th frame"
                  style={{ fontSize: '13px' }}
                >
                  Keep 1/5
                </button>
              </div>
            </div>

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
              <h3>Background Removal</h3>
              <div className="control-group">
                <button
                  onClick={() => setShowBackgroundRemoval(!showBackgroundRemoval)}
                  className={showBackgroundRemoval ? 'active-toggle' : ''}
                >
                  {showBackgroundRemoval ? 'Hide' : 'Enable'} Background Removal
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

            <div className="control-section">
              <h3>Export</h3>
              <div className="control-group">
                <button onClick={handleExport} disabled={isEncoding} className="export-button">
                  {isEncoding ? `Exporting... ${progress}%` : 'Download GIF'}
                </button>
              </div>
            </div>

            <div className="control-section">
              <h3>File</h3>
              <div className="control-group">
                <button onClick={() => window.location.reload()}>Load New GIF</button>
              </div>
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
            />
            <Timeline
              frames={frames}
              currentFrameIndex={currentFrameIndex}
              isPlaying={isPlaying}
              onFrameSelect={setCurrentFrameIndex}
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
                {isHistoryPanelCollapsed ? '◀' : '▶'}
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
            Build: {import.meta.env.VITE_COMMIT_SHA.substring(0, 7)}
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
