/**
 * CropPanel - Panel for cropping GIF frames
 */

import { useState } from 'react';
import './CropPanel.css';

export interface CropSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropPanelProps {
  imageWidth: number;
  imageHeight: number;
  cropSelection: CropSelection | null;
  onCropSelectionChange: (selection: CropSelection | null) => void;
  onApplyCrop: (selection: CropSelection) => void;
  isProcessing?: boolean;
}

export function CropPanel({
  imageWidth,
  imageHeight,
  cropSelection,
  onCropSelectionChange,
  onApplyCrop,
  isProcessing = false,
}: CropPanelProps) {
  const [isSelectingMode, setIsSelectingMode] = useState(false);

  const handleStartSelection = () => {
    setIsSelectingMode(true);
    // Set default selection to center 50% of image
    const defaultWidth = Math.round(imageWidth * 0.5);
    const defaultHeight = Math.round(imageHeight * 0.5);
    const defaultX = Math.round((imageWidth - defaultWidth) / 2);
    const defaultY = Math.round((imageHeight - defaultHeight) / 2);

    onCropSelectionChange({
      x: defaultX,
      y: defaultY,
      width: defaultWidth,
      height: defaultHeight,
    });
  };

  const handleCancelSelection = () => {
    setIsSelectingMode(false);
    onCropSelectionChange(null);
  };

  const handleApply = () => {
    if (cropSelection) {
      onApplyCrop(cropSelection);
      setIsSelectingMode(false);
      onCropSelectionChange(null);
    }
  };

  const handlePreset = (widthPercent: number, heightPercent: number) => {
    const width = Math.round(imageWidth * widthPercent);
    const height = Math.round(imageHeight * heightPercent);
    const x = Math.round((imageWidth - width) / 2);
    const y = Math.round((imageHeight - height) / 2);

    onCropSelectionChange({ x, y, width, height });
  };

  return (
    <div className="crop-panel">
      {!isSelectingMode ? (
        <>
          <div className="crop-info">
            <p>Select an area to crop from your image</p>
            <div className="crop-current-size">
              Current: {imageWidth} × {imageHeight}px
            </div>
          </div>

          <button
            className="crop-start-button"
            onClick={handleStartSelection}
            disabled={isProcessing}
          >
            Start Crop Selection
          </button>
        </>
      ) : (
        <>
          {cropSelection && (
            <div className="crop-selection-info">
              <div className="crop-label">Selection</div>
              <div className="crop-coords">
                <div>Position: {cropSelection.x}, {cropSelection.y}</div>
                <div>Size: {cropSelection.width} × {cropSelection.height}px</div>
              </div>
            </div>
          )}

          <div className="crop-inputs">
            <div className="crop-input-row">
              <div className="crop-input-group">
                <label htmlFor="crop-x">X</label>
                <input
                  id="crop-x"
                  type="number"
                  min="0"
                  max={imageWidth}
                  value={cropSelection?.x || 0}
                  onChange={(e) => {
                    if (cropSelection) {
                      onCropSelectionChange({
                        ...cropSelection,
                        x: parseInt(e.target.value) || 0,
                      });
                    }
                  }}
                  disabled={isProcessing}
                />
              </div>
              <div className="crop-input-group">
                <label htmlFor="crop-y">Y</label>
                <input
                  id="crop-y"
                  type="number"
                  min="0"
                  max={imageHeight}
                  value={cropSelection?.y || 0}
                  onChange={(e) => {
                    if (cropSelection) {
                      onCropSelectionChange({
                        ...cropSelection,
                        y: parseInt(e.target.value) || 0,
                      });
                    }
                  }}
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div className="crop-input-row">
              <div className="crop-input-group">
                <label htmlFor="crop-width">Width</label>
                <input
                  id="crop-width"
                  type="number"
                  min="1"
                  max={imageWidth}
                  value={cropSelection?.width || 0}
                  onChange={(e) => {
                    if (cropSelection) {
                      onCropSelectionChange({
                        ...cropSelection,
                        width: parseInt(e.target.value) || 1,
                      });
                    }
                  }}
                  disabled={isProcessing}
                />
              </div>
              <div className="crop-input-group">
                <label htmlFor="crop-height">Height</label>
                <input
                  id="crop-height"
                  type="number"
                  min="1"
                  max={imageHeight}
                  value={cropSelection?.height || 0}
                  onChange={(e) => {
                    if (cropSelection) {
                      onCropSelectionChange({
                        ...cropSelection,
                        height: parseInt(e.target.value) || 1,
                      });
                    }
                  }}
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>

          <div className="crop-presets">
            <div className="crop-label">Quick Presets</div>
            <div className="crop-preset-buttons">
              <button onClick={() => handlePreset(1, 1)} disabled={isProcessing}>Full</button>
              <button onClick={() => handlePreset(0.75, 0.75)} disabled={isProcessing}>75%</button>
              <button onClick={() => handlePreset(0.5, 0.5)} disabled={isProcessing}>50%</button>
              <button onClick={() => handlePreset(1, 0.5625)} disabled={isProcessing}>16:9</button>
              <button onClick={() => handlePreset(0.75, 1)} disabled={isProcessing}>3:4</button>
              <button onClick={() => handlePreset(1, 1)} disabled={isProcessing}>1:1</button>
            </div>
          </div>

          <div className="crop-actions">
            <button
              className="crop-cancel-button"
              onClick={handleCancelSelection}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              className="crop-apply-button"
              onClick={handleApply}
              disabled={isProcessing || !cropSelection}
            >
              {isProcessing ? 'Cropping...' : 'Apply Crop'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
