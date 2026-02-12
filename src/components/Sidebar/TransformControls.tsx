import { useState } from 'react';

interface TransformControlsProps {
  framesCount: number;
  selectedFramesCount: number;
  onRotate: (clockwise: boolean, scope: 'current' | 'selected' | 'all') => void;
  onFlip: (horizontal: boolean, scope: 'current' | 'selected' | 'all') => void;
}

export const TransformControls = ({
  framesCount,
  selectedFramesCount,
  onRotate,
  onFlip,
}: TransformControlsProps) => {
  const [showTransform, setShowTransform] = useState(false);

  return (
    <div className="control-section">
      <h3>Rotate & Flip</h3>
      <div className="control-group">
        <button
          onClick={() => setShowTransform(!showTransform)}
          className={showTransform ? 'active-toggle' : ''}
          title="Rotate or flip frames 90 degrees"
        >
          {showTransform ? 'Hide' : 'Show'} Transform
        </button>
      </div>
      {showTransform && (
        <div style={{ marginTop: '12px' }}>
          {selectedFramesCount > 0 && (
            <div style={{ marginBottom: '12px', padding: '8px', background: '#edf2f7', borderRadius: '6px', fontSize: '13px', color: '#4a5568' }}>
              ✓ {selectedFramesCount} frame{selectedFramesCount !== 1 ? 's' : ''} selected
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', display: 'block' }}>Rotate 90°</label>
            <div className="button-group-vertical" style={{ gap: '4px' }}>
              <button
                onClick={() => onRotate(false, 'current')}
                disabled={framesCount === 0}
                className="action-button"
                style={{ fontSize: '13px', padding: '8px' }}
                title="Rotate current frame 90° counter-clockwise"
              >
                ↺ Rotate Left (Current)
              </button>
              <button
                onClick={() => onRotate(true, 'current')}
                disabled={framesCount === 0}
                className="action-button"
                style={{ fontSize: '13px', padding: '8px' }}
                title="Rotate current frame 90° clockwise"
              >
                ↻ Rotate Right (Current)
              </button>
              {selectedFramesCount > 0 && (
                <>
                  <button
                    onClick={() => onRotate(false, 'selected')}
                    disabled={framesCount === 0}
                    className="action-button"
                    style={{ fontSize: '13px', padding: '8px', background: '#48bb78' }}
                  >
                    ↺ Rotate Left (Selected {selectedFramesCount})
                  </button>
                  <button
                    onClick={() => onRotate(true, 'selected')}
                    disabled={framesCount === 0}
                    className="action-button"
                    style={{ fontSize: '13px', padding: '8px', background: '#48bb78' }}
                  >
                    ↻ Rotate Right (Selected {selectedFramesCount})
                  </button>
                </>
              )}
              <button
                onClick={() => onRotate(false, 'all')}
                disabled={framesCount === 0}
                className="action-button warning"
                style={{ fontSize: '13px', padding: '8px' }}
              >
                ↺ Rotate Left (All)
              </button>
              <button
                onClick={() => onRotate(true, 'all')}
                disabled={framesCount === 0}
                className="action-button warning"
                style={{ fontSize: '13px', padding: '8px' }}
              >
                ↻ Rotate Right (All)
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', display: 'block' }}>Flip</label>
            <div className="button-group-vertical" style={{ gap: '4px' }}>
              <button
                onClick={() => onFlip(true, 'current')}
                disabled={framesCount === 0}
                className="action-button"
                style={{ fontSize: '13px', padding: '8px' }}
                title="Mirror current frame horizontally (left-right flip)"
              >
                ↔ Flip Horizontal (Current)
              </button>
              <button
                onClick={() => onFlip(false, 'current')}
                disabled={framesCount === 0}
                className="action-button"
                style={{ fontSize: '13px', padding: '8px' }}
                title="Mirror current frame vertically (upside-down flip)"
              >
                ↕ Flip Vertical (Current)
              </button>
              {selectedFramesCount > 0 && (
                <>
                  <button
                    onClick={() => onFlip(true, 'selected')}
                    disabled={framesCount === 0}
                    className="action-button"
                    style={{ fontSize: '13px', padding: '8px', background: '#48bb78' }}
                  >
                    ↔ Flip Horizontal (Selected {selectedFramesCount})
                  </button>
                  <button
                    onClick={() => onFlip(false, 'selected')}
                    disabled={framesCount === 0}
                    className="action-button"
                    style={{ fontSize: '13px', padding: '8px', background: '#48bb78' }}
                  >
                    ↕ Flip Vertical (Selected {selectedFramesCount})
                  </button>
                </>
              )}
              <button
                onClick={() => onFlip(true, 'all')}
                disabled={framesCount === 0}
                className="action-button warning"
                style={{ fontSize: '13px', padding: '8px' }}
              >
                ↔ Flip Horizontal (All)
              </button>
              <button
                onClick={() => onFlip(false, 'all')}
                disabled={framesCount === 0}
                className="action-button warning"
                style={{ fontSize: '13px', padding: '8px' }}
              >
                ↕ Flip Vertical (All)
              </button>
            </div>
          </div>

          <p style={{ fontSize: '12px', color: '#718096', marginTop: '12px', lineHeight: '1.4' }}>
            💡 Ctrl/Cmd+Click frames in timeline to select multiple. Shift+Click to select range.
          </p>
        </div>
      )}
    </div>
  );
};
