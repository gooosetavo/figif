import type { CropSelection } from '../Panels/CropPanel';
import type { RemovalMode, AIBackgroundRemovalConfig } from '../../utils/backgroundRemoval';
import { FrameControls } from '../Sidebar/FrameControls';
import { PaddingControls } from '../Sidebar/PaddingControls';
import { TransformControls } from '../Sidebar/TransformControls';
import { ResizePanel } from '../Panels/ResizePanel';
import { CropPanel } from '../Panels/CropPanel';
import { BackgroundRemovalPanel, type GifEffect } from '../Panels/BackgroundRemovalPanel';
import { useEditor } from '../../contexts/EditorContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useBackgroundRemoval } from '../../hooks/useBackgroundRemoval';
import { useFrameOperations } from '../../hooks/useFrameOperations';

interface EditorSidebarProps {
  onApplyPadding: (scope: 'current' | 'all', left: number, right: number, top: number, bottom: number) => Promise<void>;
  onRotate: (clockwise: boolean, scope: 'current' | 'selected' | 'all') => Promise<void>;
  onFlip: (horizontal: boolean, scope: 'current' | 'selected' | 'all') => Promise<void>;
  onResize: (width: number, height: number, maintainAspectRatio: boolean) => Promise<void>;
  onCrop: (selection: CropSelection) => Promise<void>;
  onRemoveBackground: (mode: RemovalMode, target: 'current' | 'all', config?: AIBackgroundRemovalConfig) => Promise<void>;
  onEnableManualMode: () => void;
  onApplySelection: (tolerance: number, invert: boolean, effect: GifEffect) => Promise<void>;
  onApplyToAllFrames: (tolerance: number, invert: boolean, effect: GifEffect) => Promise<void>;
  onClearSelections: () => void;
  onRemoveLastSelection: () => void;
  onPreview: (config: AIBackgroundRemovalConfig) => Promise<void>;
}

export const EditorSidebar = ({
  onApplyPadding,
  onRotate,
  onFlip,
  onResize,
  onCrop,
  onRemoveBackground,
  onEnableManualMode,
  onApplySelection,
  onApplyToAllFrames,
  onClearSelections,
  onRemoveLastSelection,
  onPreview,
}: EditorSidebarProps) => {
  const {
    showBackgroundRemoval,
    setShowBackgroundRemoval,
    showResize,
    setShowResize,
    showCrop,
    setShowCrop,
    cropSelection,
    setCropSelection,
    isResizing,
    isCropping,
    selectedFrames,
    selectionPoints,
    manualTolerance,
    setManualTolerance,
    isManualSelectionMode,
  } = useEditor();

  const { frames, currentFrameIndex } = useWorkspace();
  const { handleDuplicateFrame, handleDeleteFrame, handleReverseFrames, handleRemoveEveryOtherFrame, handleDuplicateAllFrames, handleKeepEveryNthFrame, handleSpeedChange } = useFrameOperations();
  const { isBgProcessing, bgProgress, isGeneratingPreview, aiProgress } = useBackgroundRemoval();

  const currentFrame = frames[currentFrameIndex] || null;

  return (
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
        onApplyPadding={onApplyPadding}
      />

      <TransformControls
        framesCount={frames.length}
        selectedFramesCount={selectedFrames.size}
        onRotate={onRotate}
        onFlip={onFlip}
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
              onResize={onResize}
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
              onApplyCrop={onCrop}
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
              onRemoveBackground={onRemoveBackground}
              onEnableManualMode={onEnableManualMode}
              onApplySelection={onApplySelection}
              onApplyToAllFrames={onApplyToAllFrames}
              onClearSelections={onClearSelections}
              onRemoveLastSelection={onRemoveLastSelection}
              onPreview={onPreview}
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
  );
};
