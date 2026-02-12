import { useState } from 'react';

interface FrameControlsProps {
  framesCount: number;
  selectedFramesCount: number;
  onDuplicateFrame: (scope: 'current' | 'selected') => void;
  onDeleteFrame: (scope: 'current' | 'selected') => void;
  onReverseFrames: () => void;
  onRemoveEveryOtherFrame: () => void;
  onDuplicateAllFrames: () => void;
  onKeepEveryNthFrame: (n: number) => void;
  onSpeedChange: (multiplier: number) => void;
}

export const FrameControls = ({
  framesCount,
  selectedFramesCount,
  onDuplicateFrame,
  onDeleteFrame,
  onReverseFrames,
  onRemoveEveryOtherFrame,
  onDuplicateAllFrames,
  onKeepEveryNthFrame,
  onSpeedChange,
}: FrameControlsProps) => {
  const [showFrameControls, setShowFrameControls] = useState(false);

  return (
    <div className="control-section">
      <h3>Frames Controls</h3>
      <div className="control-group">
        <button
          onClick={() => setShowFrameControls(!showFrameControls)}
          className={showFrameControls ? 'active-toggle' : ''}
          title="Show or hide frame and speed controls"
        >
          {showFrameControls ? 'Hide' : 'Show'} Frame Controls
        </button>
      </div>
      {showFrameControls && (
        <div style={{ marginTop: '12px' }}>
          {selectedFramesCount > 0 && (
            <div style={{ marginBottom: '12px', padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              ✓ {selectedFramesCount} frame{selectedFramesCount !== 1 ? 's' : ''} selected
            </div>
          )}
          <div className="control-group">
            <button onClick={() => onDuplicateFrame('current')} title="Create a copy of the current frame">
              Duplicate Current
            </button>
            {selectedFramesCount > 0 && (
              <button onClick={() => onDuplicateFrame('selected')} style={{ background: '#48bb78' }} title="Duplicate all selected frames">
                Duplicate Selected ({selectedFramesCount})
              </button>
            )}
            <button onClick={() => onDeleteFrame('current')} disabled={framesCount <= 1} title="Remove the current frame">
              Delete Current
            </button>
            {selectedFramesCount > 0 && (
              <button
                onClick={() => onDeleteFrame('selected')}
                disabled={framesCount <= selectedFramesCount}
                style={{ background: '#e53e3e' }}
                title="Delete all selected frames"
              >
                Delete Selected ({selectedFramesCount})
              </button>
            )}
            <button onClick={onReverseFrames} title="Reverse the order of all frames">
              Reverse All
            </button>
          </div>
          <div className="control-group" style={{ marginTop: '8px' }}>
            <button onClick={onRemoveEveryOtherFrame} disabled={framesCount <= 1} title="Keep only odd-numbered frames (1, 3, 5, ...)">
              Remove Every Other
            </button>
            <button onClick={onDuplicateAllFrames} disabled={framesCount === 0} title="Duplicate each frame in place (doubles frame count)">
              Duplicate All
            </button>
          </div>
          <div className="control-group" style={{ marginTop: '8px', gap: '4px' }}>
            <button
              onClick={() => onKeepEveryNthFrame(3)}
              disabled={framesCount <= 2}
              title="Keep every 3rd frame (reduces to ~33% of frames)"
              style={{ fontSize: '13px' }}
            >
              Keep 1/3
            </button>
            <button
              onClick={() => onKeepEveryNthFrame(4)}
              disabled={framesCount <= 3}
              title="Keep every 4th frame (reduces to ~25% of frames)"
              style={{ fontSize: '13px' }}
            >
              Keep 1/4
            </button>
            <button
              onClick={() => onKeepEveryNthFrame(5)}
              disabled={framesCount <= 4}
              title="Keep every 5th frame (reduces to ~20% of frames)"
              style={{ fontSize: '13px' }}
            >
              Keep 1/5
            </button>
          </div>

          <div className="control-group" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Animation Speed</label>
            <div className="button-group">
              <button onClick={() => onSpeedChange(0.5)} title="Make animation slower (double frame delay)">
                − Slower
              </button>
              <button onClick={() => onSpeedChange(2)} title="Make animation faster (halve frame delay)">
                + Faster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
