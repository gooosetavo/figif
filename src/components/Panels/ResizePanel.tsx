/**
 * ResizePanel - Panel for resizing GIF dimensions
 */

import { useState, useEffect } from 'react';
import './ResizePanel.css';

interface ResizePanelProps {
  currentWidth: number;
  currentHeight: number;
  onResize: (width: number, height: number, maintainAspectRatio: boolean) => void;
  isProcessing?: boolean;
}

export function ResizePanel({
  currentWidth,
  currentHeight,
  onResize,
  isProcessing = false,
}: ResizePanelProps) {
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const aspectRatio = currentWidth / currentHeight;

  useEffect(() => {
    setWidth(currentWidth);
    setHeight(currentHeight);
  }, [currentWidth, currentHeight]);

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (maintainAspectRatio) {
      setHeight(Math.round(newWidth / aspectRatio));
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (maintainAspectRatio) {
      setWidth(Math.round(newHeight * aspectRatio));
    }
  };

  const handleApply = () => {
    if (width > 0 && height > 0 && (width !== currentWidth || height !== currentHeight)) {
      onResize(width, height, maintainAspectRatio);
    }
  };

  const handlePreset = (scale: number) => {
    const newWidth = Math.round(currentWidth * scale);
    const newHeight = Math.round(currentHeight * scale);
    setWidth(newWidth);
    setHeight(newHeight);
  };

  return (
    <div className="resize-panel">
      <div className="resize-current">
        <div className="resize-label">Current Size</div>
        <div className="resize-value">{currentWidth} × {currentHeight}px</div>
      </div>

      <div className="resize-inputs">
        <div className="resize-input-group">
          <label htmlFor="resize-width">Width</label>
          <input
            id="resize-width"
            type="number"
            min="1"
            max="4000"
            value={width}
            onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
            disabled={isProcessing}
          />
        </div>

        <div className="resize-input-group">
          <label htmlFor="resize-height">Height</label>
          <input
            id="resize-height"
            type="number"
            min="1"
            max="4000"
            value={height}
            onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
            disabled={isProcessing}
          />
        </div>
      </div>

      <div className="resize-aspect-ratio">
        <label>
          <input
            type="checkbox"
            checked={maintainAspectRatio}
            onChange={(e) => setMaintainAspectRatio(e.target.checked)}
            disabled={isProcessing}
          />
          <span>Maintain aspect ratio</span>
        </label>
      </div>

      <div className="resize-presets">
        <div className="resize-label">Quick Presets</div>
        <div className="resize-preset-buttons">
          <button onClick={() => handlePreset(0.5)} disabled={isProcessing}>50%</button>
          <button onClick={() => handlePreset(0.75)} disabled={isProcessing}>75%</button>
          <button onClick={() => handlePreset(1.5)} disabled={isProcessing}>150%</button>
          <button onClick={() => handlePreset(2)} disabled={isProcessing}>200%</button>
        </div>
      </div>

      <button
        className="resize-apply-button"
        onClick={handleApply}
        disabled={isProcessing || (width === currentWidth && height === currentHeight)}
      >
        {isProcessing ? 'Resizing...' : 'Apply Resize'}
      </button>
    </div>
  );
}
