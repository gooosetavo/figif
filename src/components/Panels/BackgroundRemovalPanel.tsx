import { useState } from 'react';
import type { RemovalMode } from '../../hooks/useBackgroundRemoval';
import './BackgroundRemovalPanel.css';

interface BackgroundRemovalPanelProps {
  onRemoveBackground: (mode: RemovalMode, frames: 'current' | 'all') => void;
  onEnableManualMode: () => void;
  onApplySelection: (tolerance: number, invert: boolean) => void;
  isProcessing: boolean;
  progress: number;
  isManualMode: boolean;
}

export function BackgroundRemovalPanel({
  onRemoveBackground,
  onEnableManualMode,
  onApplySelection,
  isProcessing,
  progress,
  isManualMode,
}: BackgroundRemovalPanelProps) {
  const [mode, setMode] = useState<RemovalMode>('ai');
  const [tolerance, setTolerance] = useState(32);
  const [invertSelection, setInvertSelection] = useState(false);

  return (
    <div className="bg-removal-panel">
      <div className="mode-selector">
        <button
          className={`mode-button ${mode === 'ai' ? 'active' : ''}`}
          onClick={() => setMode('ai')}
          disabled={isProcessing}
        >
          AI Auto
        </button>
        <button
          className={`mode-button ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => {
            setMode('manual');
            onEnableManualMode();
          }}
          disabled={isProcessing}
        >
          Manual
        </button>
      </div>

      {mode === 'ai' ? (
        <div className="ai-mode">
          <p className="mode-description">
            Uses an in-browser model to automatically detect and remove backgrounds. Works best with photos and clear subjects.
          </p>
          <div className="button-group-vertical">
            <button
              onClick={() => onRemoveBackground('ai', 'current')}
              disabled={isProcessing}
              className="action-button"
            >
              {isProcessing && progress > 0 && progress < 100
                ? `Processing... ${progress}%`
                : 'Remove from Current Frame'}
            </button>
            <button
              onClick={() => onRemoveBackground('ai', 'all')}
              disabled={isProcessing}
              className="action-button warning"
            >
              Remove from All Frames
            </button>
          </div>
          {isProcessing && (
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          )}
          <p className="warning-text">
            ⚠️ Processing all frames may take several seconds per frame
          </p>
        </div>
      ) : (
        <div className="manual-mode">
          <p className="mode-description">
            Click on the background in the canvas to select it. Adjust tolerance to select more or less similar colors.
          </p>

          <div className="control-item">
            <label>
              Tolerance: {tolerance}
              <input
                type="range"
                min="1"
                max="100"
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="slider"
              />
            </label>
          </div>

          <div className="control-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={invertSelection}
                onChange={(e) => setInvertSelection(e.target.checked)}
              />
              Invert selection (keep background, remove subject)
            </label>
          </div>

          {isManualMode && (
            <div className="manual-instructions">
              <p>👆 Click on the background area in the canvas above</p>
            </div>
          )}

          <button
            onClick={() => onApplySelection(tolerance, invertSelection)}
            disabled={!isManualMode || isProcessing}
            className="action-button"
          >
            Apply to Current Frame
          </button>

          <button
            onClick={() => onRemoveBackground('manual', 'all')}
            disabled={!isManualMode || isProcessing}
            className="action-button warning"
          >
            Apply to All Frames
          </button>
        </div>
      )}
    </div>
  );
}
