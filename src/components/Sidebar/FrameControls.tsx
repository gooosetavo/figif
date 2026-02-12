interface FrameControlsProps {
  framesCount: number;
  selectedFramesCount: number;
  onDuplicateFrame: (scope: 'current' | 'selected') => void;
  onDeleteFrame: (scope: 'current' | 'selected') => void;
  onReverseFrames: () => void;
  onRemoveEveryOtherFrame: () => void;
  onDuplicateAllFrames: () => void;
  onKeepEveryNthFrame: (n: number) => void;
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
}: FrameControlsProps) => {
  return (
    <div className="control-section">
      <h3>Frames</h3>
      <div className="control-group">
        <button onClick={() => onDuplicateFrame('current')}>Duplicate Current</button>
        {selectedFramesCount > 0 && (
          <button onClick={() => onDuplicateFrame('selected')} style={{ background: '#48bb78' }}>
            Duplicate Selected ({selectedFramesCount})
          </button>
        )}
        <button onClick={() => onDeleteFrame('current')} disabled={framesCount <= 1}>
          Delete Current
        </button>
        {selectedFramesCount > 0 && (
          <button
            onClick={() => onDeleteFrame('selected')}
            disabled={framesCount <= selectedFramesCount}
            style={{ background: '#e53e3e' }}
          >
            Delete Selected ({selectedFramesCount})
          </button>
        )}
        <button onClick={onReverseFrames}>Reverse All</button>
      </div>
      <div className="control-group" style={{ marginTop: '8px' }}>
        <button onClick={onRemoveEveryOtherFrame} disabled={framesCount <= 1}>
          Remove Every Other
        </button>
        <button onClick={onDuplicateAllFrames} disabled={framesCount === 0}>
          Duplicate All
        </button>
      </div>
      <div className="control-group" style={{ marginTop: '8px', gap: '4px' }}>
        <button
          onClick={() => onKeepEveryNthFrame(3)}
          disabled={framesCount <= 2}
          title="Keep every 3rd frame"
          style={{ fontSize: '13px' }}
        >
          Keep 1/3
        </button>
        <button
          onClick={() => onKeepEveryNthFrame(4)}
          disabled={framesCount <= 3}
          title="Keep every 4th frame"
          style={{ fontSize: '13px' }}
        >
          Keep 1/4
        </button>
        <button
          onClick={() => onKeepEveryNthFrame(5)}
          disabled={framesCount <= 4}
          title="Keep every 5th frame"
          style={{ fontSize: '13px' }}
        >
          Keep 1/5
        </button>
      </div>
    </div>
  );
};
