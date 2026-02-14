import type { CropSelection } from '../Panels/CropPanel';
import type { RemovalMode, AIBackgroundRemovalConfig } from '../../utils/backgroundRemoval';
import type { GifEffect } from '../Panels/BackgroundRemovalPanel';
import { EditorSidebar } from './EditorSidebar';
import { EditorMainContent } from './EditorMainContent';
import { EditorRightPanel } from './EditorRightPanel';

interface EditorLayoutProps {
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
  onCanvasClick: (x: number, y: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onManualSave: () => void;
}

export const EditorLayout = ({
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
  onCanvasClick,
  onUndo,
  onRedo,
  onManualSave,
}: EditorLayoutProps) => {
  return (
    <div className="editor-container">
      <EditorSidebar
        onApplyPadding={onApplyPadding}
        onRotate={onRotate}
        onFlip={onFlip}
        onResize={onResize}
        onCrop={onCrop}
        onRemoveBackground={onRemoveBackground}
        onEnableManualMode={onEnableManualMode}
        onApplySelection={onApplySelection}
        onApplyToAllFrames={onApplyToAllFrames}
        onClearSelections={onClearSelections}
        onRemoveLastSelection={onRemoveLastSelection}
        onPreview={onPreview}
      />

      <EditorMainContent onCanvasClick={onCanvasClick} />

      <EditorRightPanel
        onUndo={onUndo}
        onRedo={onRedo}
        onSaveNow={onManualSave}
      />
    </div>
  );
};
