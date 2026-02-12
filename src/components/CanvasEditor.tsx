import { useEffect, useRef, useState } from 'react';
import type { GifFrame } from '../types/gif.types';
import { CropOverlay } from './CropOverlay';
import type { CropSelection } from './Panels/CropPanel';
import './CanvasEditor.css';

interface CanvasEditorProps {
  frame: GifFrame | null;
  zoom: number;
  selectionMode?: boolean;
  selectionMask?: Uint8ClampedArray | null;
  cropSelection?: CropSelection | null;
  onCropSelectionChange?: (selection: CropSelection) => void;
  onCanvasClick?: (x: number, y: number) => void;
}

export function CanvasEditor({
  frame,
  zoom,
  selectionMode = false,
  selectionMask = null,
  cropSelection = null,
  onCropSelectionChange,
  onCanvasClick
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!frame || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match frame
    canvas.width = frame.imageData.width;
    canvas.height = frame.imageData.height;

    // Draw the frame
    ctx.putImageData(frame.imageData, 0, 0);
  }, [frame]);

  // Draw selection mask overlay
  useEffect(() => {
    if (!overlayCanvasRef.current || !frame) return;

    const overlay = overlayCanvasRef.current;
    const ctx = overlay.getContext('2d');

    if (!ctx) return;

    overlay.width = frame.imageData.width;
    overlay.height = frame.imageData.height;

    // Clear overlay first
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Draw semi-transparent selection only if mask exists
    if (selectionMask) {
      const imageData = ctx.createImageData(frame.imageData.width, frame.imageData.height);
      for (let i = 0; i < selectionMask.length; i++) {
        const dataIndex = i * 4;
        if (selectionMask[i] === 255) {
          imageData.data[dataIndex] = 102; // R
          imageData.data[dataIndex + 1] = 126; // G
          imageData.data[dataIndex + 2] = 234; // B (purple)
          imageData.data[dataIndex + 3] = 128; // Alpha (semi-transparent)
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }
  }, [selectionMask, frame]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectionMode && onCanvasClick && canvasRef.current) {
      // Calculate click position on canvas
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / zoom);
      const y = Math.floor((e.clientY - rect.top) / zoom);

      onCanvasClick(x, y);
      return;
    }

    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
  };

  if (!frame) {
    return (
      <div className="canvas-editor empty">
        <p>No frame to display</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`canvas-editor ${isPanning ? 'panning' : ''} ${selectionMode ? 'selection-mode' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="canvas-container"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <canvas ref={canvasRef} />
        <canvas ref={overlayCanvasRef} className="overlay-canvas" />
        {cropSelection && onCropSelectionChange && (
          <CropOverlay
            canvasWidth={frame.imageData.width}
            canvasHeight={frame.imageData.height}
            zoom={1}
            cropSelection={cropSelection}
            onCropSelectionChange={onCropSelectionChange}
          />
        )}
      </div>
    </div>
  );
}
