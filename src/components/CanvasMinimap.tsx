import { useEffect, useRef, useState } from 'react';
import type { GifFrame } from '../types/gif.types';
import './CanvasMinimap.css';

interface CanvasMinimapProps {
  frame: GifFrame | null;
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
  scrollLeft: number;
  scrollTop: number;
  onViewportChange: (scrollLeft: number, scrollTop: number) => void;
}

export const CanvasMinimap = ({
  frame,
  zoom,
  viewportWidth,
  viewportHeight,
  scrollLeft,
  scrollTop,
  onViewportChange,
}: CanvasMinimapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const MINIMAP_SIZE = 150;

  useEffect(() => {
    // Don't render if not zoomed in or no frame
    if (zoom <= 1 || !frame) return;
    const canvas = canvasRef.current;
    if (!canvas || !frame) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate scaling to fit image in minimap
    const scale = Math.min(
      MINIMAP_SIZE / frame.imageData.width,
      MINIMAP_SIZE / frame.imageData.height
    );

    canvas.width = frame.imageData.width * scale;
    canvas.height = frame.imageData.height * scale;

    // Draw the miniaturized image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (frame.canvas) {
      ctx.drawImage(frame.canvas, 0, 0, canvas.width, canvas.height);
    }

    // Draw viewport rectangle
    const viewportRect = {
      x: (scrollLeft / zoom) * scale,
      y: (scrollTop / zoom) * scale,
      width: (viewportWidth / zoom) * scale,
      height: (viewportHeight / zoom) * scale,
    };

    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      viewportRect.x,
      viewportRect.y,
      viewportRect.width,
      viewportRect.height
    );

    // Fill with semi-transparent overlay
    ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
    ctx.fillRect(
      viewportRect.x,
      viewportRect.y,
      viewportRect.width,
      viewportRect.height
    );
  }, [frame, zoom, viewportWidth, viewportHeight, scrollLeft, scrollTop]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    handleMouseMove(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging && e.type === 'mousemove') return;
    if (!frame || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert minimap coordinates to main canvas coordinates
    const scale = Math.min(
      MINIMAP_SIZE / frame.imageData.width,
      MINIMAP_SIZE / frame.imageData.height
    );

    const imageX = (x / scale) * zoom;
    const imageY = (y / scale) * zoom;

    // Center the viewport on the clicked position
    const newScrollLeft = imageX - viewportWidth / 2;
    const newScrollTop = imageY - viewportHeight / 2;

    onViewportChange(newScrollLeft, newScrollTop);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Don't show minimap if not zoomed in or no frame
  if (zoom <= 1 || !frame) return null;

  return (
    <div className="canvas-minimap-container">
      <div className="canvas-minimap-label">Minimap</div>
      <canvas
        ref={canvasRef}
        className="canvas-minimap"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};
