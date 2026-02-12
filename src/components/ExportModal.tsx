import { useState } from 'react';
import './ExportModal.css';

export type ExportFormat = 'gif' | 'png' | 'apng' | 'webp' | 'webm';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  totalFrames: number;
  selectedFramesCount: number;
  isExporting: boolean;
  progress: number;
}

export interface ExportOptions {
  format: ExportFormat;
  quality: number;
  fps?: number;
  useSelectedFrames: boolean;
  loopCount: number; // 0 = infinite, -1 = no loop, >0 = specific count
}

const FORMATS: Array<{
  value: ExportFormat;
  label: string;
  description: string;
  supportsFrames: boolean;
  supportsQuality: boolean;
}> = [
  {
    value: 'gif',
    label: 'GIF',
    description: 'Animated GIF - Universal support, larger file size',
    supportsFrames: true,
    supportsQuality: true,
  },
  {
    value: 'png',
    label: 'PNG',
    description: 'Static PNG - Single frame, lossless',
    supportsFrames: false,
    supportsQuality: false,
  },
  {
    value: 'apng',
    label: 'APNG',
    description: 'Animated PNG - Better quality than GIF, good compression',
    supportsFrames: true,
    supportsQuality: false,
  },
  {
    value: 'webp',
    label: 'WebP',
    description: 'Static WebP - Single frame, excellent compression',
    supportsFrames: false,
    supportsQuality: true,
  },
  {
    value: 'webm',
    label: 'WebM Video',
    description: 'WebM video - Modern browsers, efficient compression',
    supportsFrames: true,
    supportsQuality: true,
  },
];

export const ExportModal = ({
  isOpen,
  onClose,
  onExport,
  totalFrames,
  selectedFramesCount,
  isExporting,
  progress,
}: ExportModalProps) => {
  const [format, setFormat] = useState<ExportFormat>('gif');
  const [quality, setQuality] = useState(10);
  const [fps, setFps] = useState(30);
  const [useSelectedFrames, setUseSelectedFrames] = useState(false);
  const [loopCount, setLoopCount] = useState(0);

  if (!isOpen) return null;

  const selectedFormat = FORMATS.find((f) => f.value === format)!;
  const canUseSelectedFrames = selectedFramesCount > 0 && selectedFormat.supportsFrames;

  const handleExport = () => {
    onExport({
      format,
      quality,
      fps,
      useSelectedFrames: useSelectedFrames && canUseSelectedFrames,
      loopCount,
    });
  };

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h2>Export Options</h2>
          <button className="export-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="export-modal-content">
          {/* Format Selection */}
          <div className="export-section">
            <h3>Format</h3>
            <div className="export-format-grid">
              {FORMATS.map((fmt) => (
                <button
                  key={fmt.value}
                  className={`export-format-option ${format === fmt.value ? 'active' : ''}`}
                  onClick={() => setFormat(fmt.value)}
                  disabled={isExporting}
                >
                  <div className="export-format-label">{fmt.label}</div>
                  <div className="export-format-description">{fmt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Frame Selection */}
          {selectedFormat.supportsFrames && (
            <div className="export-section">
              <h3>Frames</h3>
              <div className="export-options">
                <label className="export-radio-label">
                  <input
                    type="radio"
                    checked={!useSelectedFrames}
                    onChange={() => setUseSelectedFrames(false)}
                    disabled={isExporting}
                  />
                  <span>All frames ({totalFrames})</span>
                </label>
                {selectedFramesCount > 0 && (
                  <label className="export-radio-label">
                    <input
                      type="radio"
                      checked={useSelectedFrames}
                      onChange={() => setUseSelectedFrames(true)}
                      disabled={isExporting}
                    />
                    <span>Selected frames only ({selectedFramesCount})</span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Quality Settings */}
          {selectedFormat.supportsQuality && (
            <div className="export-section">
              <h3>Quality</h3>
              <div className="export-slider-container">
                <label>
                  Quality: {quality}
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    disabled={isExporting}
                    className="export-slider"
                  />
                </label>
                <p className="export-hint">Higher quality = larger file size</p>
              </div>
            </div>
          )}

          {/* FPS Settings (for video) */}
          {format === 'webm' && (
            <div className="export-section">
              <h3>Frame Rate</h3>
              <div className="export-slider-container">
                <label>
                  FPS: {fps}
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={fps}
                    onChange={(e) => setFps(Number(e.target.value))}
                    disabled={isExporting}
                    className="export-slider"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Loop Settings */}
          {selectedFormat.supportsFrames && format !== 'webm' && (
            <div className="export-section">
              <h3>Loop</h3>
              <div className="export-options">
                <label className="export-radio-label">
                  <input
                    type="radio"
                    checked={loopCount === 0}
                    onChange={() => setLoopCount(0)}
                    disabled={isExporting}
                  />
                  <span>Loop forever</span>
                </label>
                <label className="export-radio-label">
                  <input
                    type="radio"
                    checked={loopCount === -1}
                    onChange={() => setLoopCount(-1)}
                    disabled={isExporting}
                  />
                  <span>No loop (play once)</span>
                </label>
                <label className="export-radio-label">
                  <input
                    type="radio"
                    checked={loopCount > 0}
                    onChange={() => setLoopCount(3)}
                    disabled={isExporting}
                  />
                  <span>
                    Custom:
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={loopCount > 0 ? loopCount : 3}
                      onChange={(e) => setLoopCount(Math.max(1, Number(e.target.value)))}
                      disabled={isExporting || loopCount <= 0}
                      className="export-number-input"
                    />
                    times
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Export Progress */}
          {isExporting && (
            <div className="export-progress">
              <div className="export-progress-bar">
                <div
                  className="export-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p>Exporting... {progress}%</p>
            </div>
          )}
        </div>

        <div className="export-modal-footer">
          <button
            className="export-modal-button cancel"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            className="export-modal-button export"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? `Exporting... ${progress}%` : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
};
