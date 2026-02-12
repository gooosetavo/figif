interface SpeedControlsProps {
  onSpeedChange: (multiplier: number) => void;
}

export const SpeedControls = ({ onSpeedChange }: SpeedControlsProps) => {
  return (
    <div className="control-section">
      <h3>Speed</h3>
      <div className="button-group">
        <button onClick={() => onSpeedChange(0.5)} title="Slower (2x)">− Slower</button>
        <button onClick={() => onSpeedChange(2)} title="Faster (2x)">+ Faster</button>
      </div>
    </div>
  );
};
