import { useState } from 'react';
import type { RemovalMode } from '../../hooks/useBackgroundRemoval';
import type { AIBackgroundRemovalConfig, AIModel, AIDevice, GifFrame } from '../../types/gif.types';
import { getModelInfo } from '../../utils/backgroundRemoval';
import './BackgroundRemovalPanel.css';

export type GifEffect = 'none' | 'intensifies' | 'party' | 'on-drugs';

interface BackgroundRemovalPanelProps {
  onRemoveBackground: (mode: RemovalMode, frames: 'current' | 'all', config?: AIBackgroundRemovalConfig) => void;
  onEnableManualMode: () => void;
  onApplySelection: (tolerance: number, invert: boolean, effect: GifEffect) => void;
  onApplyToAllFrames: (tolerance: number, invert: boolean, effect: GifEffect) => void;
  onClearSelections: () => void;
  onRemoveLastSelection: () => void;
  onPreview: (config: AIBackgroundRemovalConfig) => void;
  tolerance: number;
  onToleranceChange: (tolerance: number) => void;
  selectionCount: number;
  isProcessing: boolean;
  progress: number;
  isManualMode: boolean;
  isGeneratingPreview: boolean;
  aiProgress: { stage: string; current: number; total: number } | null;
  currentFrame: GifFrame | null;
}

export function BackgroundRemovalPanel({
  onRemoveBackground,
  onEnableManualMode,
  onApplySelection,
  onApplyToAllFrames,
  onClearSelections,
  onRemoveLastSelection,
  onPreview,
  tolerance,
  onToleranceChange,
  selectionCount,
  isProcessing,
  progress,
  isManualMode,
  isGeneratingPreview,
  aiProgress,
  currentFrame,
}: BackgroundRemovalPanelProps) {
  const [mode, setMode] = useState<RemovalMode>('ai');
  const [invertSelection, setInvertSelection] = useState(false);
  const [useReapplyMode, setUseReapplyMode] = useState(true);
  const [applyEffect, setApplyEffect] = useState<'none' | 'intensifies' | 'party' | 'on-drugs'>('none');

  // New AI configuration state
  const [selectedModel, setSelectedModel] = useState<AIModel>('isnet_fp16');
  const [selectedDevice, setSelectedDevice] = useState<AIDevice>('cpu');
  const [showModelInfo, setShowModelInfo] = useState(false);

  const modelInfo = getModelInfo(selectedModel);

  const aiConfig: AIBackgroundRemovalConfig = {
    model: selectedModel,
    device: selectedDevice,
  };

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

          {/* AI Model Configuration */}
          <div className="ai-config-section">
            <div className="control-item">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ margin: 0, flex: 1 }}>Model Quality</label>
                <button
                  className="info-button"
                  onClick={() => setShowModelInfo(!showModelInfo)}
                  type="button"
                >
                  ?
                </button>
              </div>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as AIModel)}
                disabled={isProcessing || isGeneratingPreview}
                className="model-select"
              >
                <option value="isnet">High Quality (Slow, ~170 MB)</option>
                <option value="isnet_fp16">Balanced (Medium, ~85 MB)</option>
                <option value="isnet_quint8">Fast (Lower Quality, ~43 MB)</option>
              </select>
            </div>

            {/* Model Information Display */}
            {showModelInfo && (
              <div className="model-info-box">
                <h4>{modelInfo.name}</h4>
                <div className="model-stats">
                  <span className="model-stat">
                    <strong>Size:</strong> {modelInfo.size}
                  </span>
                  <span className="model-stat">
                    <strong>Speed:</strong> {modelInfo.performance}
                  </span>
                  <span className="model-stat">
                    <strong>Quality:</strong> {modelInfo.quality}
                  </span>
                </div>
                <p className="model-description">{modelInfo.description}</p>
              </div>
            )}

            <div className="control-item">
              <label>Processing Device</label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value as AIDevice)}
                disabled={isProcessing || isGeneratingPreview}
                className="device-select"
              >
                <option value="cpu">CPU (Compatible)</option>
                <option value="gpu">GPU (Faster, if available)</option>
              </select>
            </div>
          </div>

          {/* Preview Button */}
          <div className="button-group-vertical">
            <button
              onClick={() => onPreview(aiConfig)}
              disabled={isProcessing || isGeneratingPreview || !currentFrame}
              className="action-button preview-button"
            >
              {isGeneratingPreview
                ? 'Generating Preview...'
                : 'Preview on Current Frame'}
            </button>

            <button
              onClick={() => onRemoveBackground('ai', 'current', aiConfig)}
              disabled={isProcessing || isGeneratingPreview}
              className="action-button"
            >
              {isProcessing && progress > 0 && progress < 100
                ? `Processing... ${progress}%`
                : 'Remove from Current Frame'}
            </button>
            <button
              onClick={() => onRemoveBackground('ai', 'all', aiConfig)}
              disabled={isProcessing || isGeneratingPreview}
              className="action-button warning"
            >
              Remove from All Frames
            </button>
          </div>

          {/* AI Progress Display */}
          {aiProgress && (
            <div className="ai-progress-info">
              <p className="progress-stage">{aiProgress.stage}</p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(aiProgress.current / aiProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Existing progress bar (for multi-frame processing) */}
          {isProcessing && !aiProgress && (
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
                onChange={(e) => onToleranceChange(Number(e.target.value))}
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

          <div className="control-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useReapplyMode}
                onChange={(e) => setUseReapplyMode(e.target.checked)}
              />
              Reapply at same location on each frame (recommended for text GIFs)
            </label>
          </div>

          {isManualMode && (
            <div className="manual-instructions">
              <p>👆 Click on the background area in the canvas above</p>
              {selectionCount > 0 && (
                <p style={{ marginTop: '8px', fontSize: '12px', fontWeight: 'bold', color: '#667eea' }}>
                  ✓ {selectionCount} area{selectionCount !== 1 ? 's' : ''} selected
                </p>
              )}
              {useReapplyMode && selectionCount > 0 && (
                <p style={{ marginTop: '8px', fontSize: '12px' }}>
                  ℹ️ Selection will be reapplied at {selectionCount} location{selectionCount !== 1 ? 's' : ''} on each frame
                </p>
              )}
            </div>
          )}

          {/* Selection management buttons */}
          {isManualMode && selectionCount > 0 && (
            <div className="button-group-vertical" style={{ gap: '4px' }}>
              <button
                onClick={onRemoveLastSelection}
                disabled={isProcessing}
                className="action-button"
                style={{ background: '#ed8936', fontSize: '13px', padding: '6px 12px' }}
              >
                ← Remove Last Selection
              </button>
              <button
                onClick={onClearSelections}
                disabled={isProcessing}
                className="action-button"
                style={{ background: '#e53e3e', fontSize: '13px', padding: '6px 12px' }}
              >
                ✕ Clear All Selections
              </button>
            </div>
          )}

          {/* Effect Selection */}
          <div className="control-item">
            <label>
              Apply Effect (for meme GIFs)
              <select
                value={applyEffect}
                onChange={(e) => setApplyEffect(e.target.value as GifEffect)}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '8px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e0',
                }}
              >
                <option value="none">None</option>
                <option value="intensifies">🔥 Intensifies (shake/vibrate)</option>
                <option value="party">🎉 Party (color cycling)</option>
                <option value="on-drugs">🌀 On-Drugs (chaos mode)</option>
              </select>
            </label>
          </div>

          <button
            onClick={() => onApplySelection(tolerance, invertSelection, applyEffect)}
            disabled={!isManualMode || isProcessing || selectionCount === 0}
            className="action-button"
          >
            Apply to Current Frame
          </button>

          <button
            onClick={() => onApplyToAllFrames(tolerance, invertSelection, applyEffect)}
            disabled={!isManualMode || isProcessing || selectionCount === 0}
            className="action-button warning"
          >
            {useReapplyMode ? 'Reapply to All Frames' : 'Apply to All Frames'}
          </button>
        </div>
      )}
    </div>
  );
}
