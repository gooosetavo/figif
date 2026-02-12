import { useState } from 'react';

interface PaddingControlsProps {
  framesCount: number;
  onApplyPadding: (scope: 'current' | 'all', left: number, right: number, top: number, bottom: number) => void;
}

export const PaddingControls = ({ framesCount, onApplyPadding }: PaddingControlsProps) => {
  const [showPadding, setShowPadding] = useState(false);
  const [paddingAmount, setPaddingAmount] = useState(10);
  const [paddingTop, setPaddingTop] = useState(true);
  const [paddingRight, setPaddingRight] = useState(true);
  const [paddingBottom, setPaddingBottom] = useState(true);
  const [paddingLeft, setPaddingLeft] = useState(true);

  const handleApply = (scope: 'current' | 'all') => {
    const left = paddingLeft ? paddingAmount : 0;
    const right = paddingRight ? paddingAmount : 0;
    const top = paddingTop ? paddingAmount : 0;
    const bottom = paddingBottom ? paddingAmount : 0;
    onApplyPadding(scope, left, right, top, bottom);
  };

  return (
    <div className="control-section">
      <h3>Add Padding</h3>
      <div className="control-group">
        <button
          onClick={() => setShowPadding(!showPadding)}
          className={showPadding ? 'active-toggle' : ''}
          title="Add transparent padding around frames (useful before applying effects)"
        >
          {showPadding ? 'Hide' : 'Show'} Padding
        </button>
      </div>
      {showPadding && (
        <div style={{ marginTop: '12px' }}>
          <div className="control-item">
            <label>
              Padding Amount: {paddingAmount}px
              <input
                type="range"
                min="1"
                max="100"
                value={paddingAmount}
                onChange={(e) => setPaddingAmount(Number(e.target.value))}
                className="slider"
              />
            </label>
          </div>

          <div className="control-item" style={{ marginTop: '12px' }}>
            <label style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>Apply to borders:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={paddingTop}
                  onChange={(e) => setPaddingTop(e.target.checked)}
                />
                Top
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={paddingBottom}
                  onChange={(e) => setPaddingBottom(e.target.checked)}
                />
                Bottom
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={paddingLeft}
                  onChange={(e) => setPaddingLeft(e.target.checked)}
                />
                Left
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={paddingRight}
                  onChange={(e) => setPaddingRight(e.target.checked)}
                />
                Right
              </label>
            </div>
          </div>

          <div className="button-group-vertical" style={{ marginTop: '12px' }}>
            <button
              onClick={() => handleApply('current')}
              disabled={framesCount === 0 || (!paddingTop && !paddingBottom && !paddingLeft && !paddingRight)}
              className="action-button"
              title="Add padding to the current frame only"
            >
              Apply to Current Frame
            </button>
            <button
              onClick={() => handleApply('all')}
              disabled={framesCount === 0 || (!paddingTop && !paddingBottom && !paddingLeft && !paddingRight)}
              className="action-button warning"
              title="Add padding to all frames in the animation"
            >
              Apply to All Frames
            </button>
          </div>

          <p style={{ fontSize: '12px', color: '#718096', marginTop: '8px', lineHeight: '1.4' }}>
            ℹ️ Adds transparent padding to selected borders. Useful before applying shake or rotation effects.
          </p>
        </div>
      )}
    </div>
  );
};
