interface ViewControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export const ViewControls = ({ zoom, onZoomIn, onZoomOut, onZoomReset }: ViewControlsProps) => {
  return (
    <div className="control-section">
      <h3>View</h3>
      <div className="control-group">
        <label>Zoom: {Math.round(zoom * 100)}%</label>
        <div className="button-group">
          <button onClick={onZoomOut}>-</button>
          <button onClick={onZoomReset}>Reset</button>
          <button onClick={onZoomIn}>+</button>
        </div>
      </div>
    </div>
  );
};
