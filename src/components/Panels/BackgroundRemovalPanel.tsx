import { useState } from 'react';
import type { RemovalMode } from '../../hooks/useBackgroundRemoval';
import type { AIBackgroundRemovalConfig, AIModel, AIDevice, GifFrame } from '../../types/gif.types';
import { getModelInfo } from '../../utils/backgroundRemoval';
import './BackgroundRemovalPanel.css';

interface BackgroundRemovalPanelProps {
  onRemoveBackground: (mode: RemovalMode, frames: 'current' | 'all', config?: AIBackgroundRemovalConfig) => void;
  onEnableManualMode: () => void;
  onApplySelection: (tolerance: number, invert: boolean) => void;
  onPreview: (config: AIBackgroundRemovalConfig) => void;
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
  onPreview,
  isProcessing,
  progress,
  isManualMode,
  isGeneratingPreview,
  aiProgress,
  currentFrame,
}: BackgroundRemovalPanelProps) {
  const [mode, setMode] = useState<RemovalMode>('ai');
  const [tolerance, setTolerance] = useState(32);
  const [invertSelection, setInvertSelection] = useState(false);

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
              <label>
                Model Quality
                <button
                  className="info-button"
                  onClick={() => setShowModelInfo(!showModelInfo)}
                  type="button"
                >
                  ?
                </button>
              </label>
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
