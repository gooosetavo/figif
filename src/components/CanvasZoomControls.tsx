import './CanvasZoomControls.css';

interface CanvasZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export const CanvasZoomControls = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: CanvasZoomControlsProps) => {
  return (
    <div className="canvas-zoom-controls">
      <button
        className="canvas-zoom-button"
        onClick={onZoomOut}
        title="Zoom Out (- key)"
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        className="canvas-zoom-button zoom-reset"
        onClick={onZoomReset}
        title={`Reset Zoom (${Math.round(zoom * 100)}%) - Ctrl/Cmd+0`}
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        className="canvas-zoom-button"
        onClick={onZoomIn}
        title="Zoom In (+ or = key)"
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  );
};
