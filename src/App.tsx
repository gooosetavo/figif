import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { CanvasEditor } from './components/CanvasEditor';
import { Timeline } from './components/Timeline';
import { BackgroundRemovalPanel } from './components/Panels/BackgroundRemovalPanel';
import { PreviewModal } from './components/PreviewModal';
import { useGifDecoder } from './hooks/useGifDecoder';
import { useGifEncoder } from './hooks/useGifEncoder';
import { useFrameManager } from './hooks/useFrameManager';
import { useBackgroundRemoval, type RemovalMode } from './hooks/useBackgroundRemoval';
import type { AIBackgroundRemovalConfig } from './types/gif.types';
import './App.css';

function App() {
  const [zoom, setZoom] = useState(1);
  const [isManualSelectionMode, setIsManualSelectionMode] = useState(false);
  const [selectionMask, setSelectionMask] = useState<Uint8ClampedArray | null>(null);
  const [showBackgroundRemoval, setShowBackgroundRemoval] = useState(false);

  // Preview state
  const [previewImageData, setPreviewImageData] = useState<ImageData | null>(null);
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

  const handleFileSelect = async (file: File) => {
    try {
      const decodedGif = await decodeGif(file);
      loadGif(decodedGif);
    } catch (err) {
      console.error('Failed to load GIF:', err);
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
      setPreviewImageData(preview);
      setShowPreviewModal(true);
    } catch (err) {
      console.error('Failed to generate preview:', err);
    }
  };

  const handleApplyPreview = () => {
    if (!previewImageData || !frames[currentFrameIndex]) return;

    try {
      // Create a new frame with the preview image data
      const canvas = document.createElement('canvas');
      canvas.width = previewImageData.width;
      canvas.height = previewImageData.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      ctx.putImageData(previewImageData, 0, 0);

      const processedFrame = {
        ...frames[currentFrameIndex],
        imageData: previewImageData,
        canvas,
      };

      const newFrames = [...frames];
      newFrames[currentFrameIndex] = processedFrame;
      setFrames(newFrames);

      setShowPreviewModal(false);
      setPreviewImageData(null);
    } catch (err) {
      console.error('Failed to apply preview:', err);
    }
  };

  const handleCancelPreview = () => {
    setShowPreviewModal(false);
    setPreviewImageData(null);
  };

  const handleEnableManualMode = () => {
    setIsManualSelectionMode(true);
    setSelectionMask(null);
  };

  const handleCanvasClick = (x: number, y: number) => {
    if (!isManualSelectionMode || !frames[currentFrameIndex]) return;

    const mask = selectWithMagicWand(frames[currentFrameIndex].imageData, x, y, 32);
    setSelectionMask(mask);
  };

  const handleApplySelection = (_tolerance: number, invert: boolean) => {
    if (!selectionMask || !frames[currentFrameIndex]) return;

    try {
      const processedFrame = applyMask(frames[currentFrameIndex], selectionMask, invert);
      const newFrames = [...frames];
      newFrames[currentFrameIndex] = processedFrame;
      setFrames(newFrames);
      setSelectionMask(null);
      setIsManualSelectionMode(false);
    } catch (err) {
      console.error('Failed to apply selection:', err);
    }
  };

  const currentFrame = frames[currentFrameIndex] || null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎨 FIGIF - GIF Editor</h1>
        <p>Edit GIFs in your browser - no upload required</p>
      </header>

      {frames.length === 0 ? (
        <div className="upload-container">
          <FileUpload onFileSelect={handleFileSelect} isLoading={isDecoding} />
          {decodeError && <p className="error-message">{decodeError}</p>}
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
              <div className="control-group">
                <button onClick={() => handleSpeedChange(2)}>2x Faster</button>
                <button onClick={() => handleSpeedChange(0.5)}>2x Slower</button>
              </div>
            </div>

            <div className="control-section">
              <h3>Frames</h3>
              <div className="control-group">
                <button onClick={() => duplicateFrame(currentFrameIndex)}>Duplicate Frame</button>
                <button onClick={() => deleteFrame(currentFrameIndex)} disabled={frames.length <= 1}>
                  Delete Frame
                </button>
                <button onClick={reverseFrames}>Reverse All</button>
              </div>
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
                    onPreview={handlePreview}
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
          Made with ❤️ | All processing happens in your browser |
          <a href="https://github.com" target="_blank" rel="noopener noreferrer"> GitHub</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
