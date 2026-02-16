import { useEffect, useRef, useState, useCallback } from 'react';
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
  onZoomChange?: (zoom: number) => void;
}

export const CanvasMinimap = ({
  frame,
  zoom,
  viewportWidth,
  viewportHeight,
  scrollLeft,
  scrollTop,
  onViewportChange,
  onZoomChange,
}: CanvasMinimapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, zoom: 1, scrollLeft: 0, scrollTop: 0 });
  const isResizingRef = useRef(false);

  const MINIMAP_SIZE = 150;

  // Check if image is larger than viewport (needs minimap)
  const needsMinimap = frame && (
    frame.imageData.width * zoom > viewportWidth ||
    frame.imageData.height * zoom > viewportHeight
  );

  useEffect(() => {
    // Don't render if minimap not needed or no frame
    if (!needsMinimap || !frame) return;
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

    // Calculate where the canvas is positioned in the viewport
    // The canvas is centered by flexbox, then transformed by pan
    const canvasWidth = frame.imageData.width * zoom;
    const canvasHeight = frame.imageData.height * zoom;

    // Canvas top-left position in viewport (accounting for centering and pan)
    const canvasX = viewportWidth / 2 - canvasWidth / 2 + scrollLeft;
    const canvasY = viewportHeight / 2 - canvasHeight / 2 + scrollTop;

    // Calculate visible region in image coordinates
    const visibleX = -canvasX / zoom;
    const visibleY = -canvasY / zoom;
    const visibleWidth = viewportWidth / zoom;
    const visibleHeight = viewportHeight / zoom;

    // Draw viewport rectangle in minimap coordinates
    const viewportRect = {
      x: visibleX * scale,
      y: visibleY * scale,
      width: visibleWidth * scale,
      height: visibleHeight * scale,
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

  const updateViewportFromMouse = useCallback((clientX: number, clientY: number) => {
    if (!frame || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Convert minimap coordinates to image coordinates (unzoomed)
    const scale = Math.min(
      MINIMAP_SIZE / frame.imageData.width,
      MINIMAP_SIZE / frame.imageData.height
    );

    const imageX = x / scale;
    const imageY = y / scale;

    // Calculate canvas dimensions
    const canvasWidth = frame.imageData.width * zoom;
    const canvasHeight = frame.imageData.height * zoom;

    // Center the viewport on the clicked position
    // scrollLeft/Top represent the offset from the centered position
    let newScrollLeft = canvasWidth / 2 - imageX * zoom;
    let newScrollTop = canvasHeight / 2 - imageY * zoom;

    // Constrain scroll to keep image within viewport
    // Allow panning beyond edges, but ensure image stays at least partially visible
    const maxScrollLeft = viewportWidth / 2 + canvasWidth / 2;
    const minScrollLeft = -viewportWidth / 2 - canvasWidth / 2;
    const maxScrollTop = viewportHeight / 2 + canvasHeight / 2;
    const minScrollTop = -viewportHeight / 2 - canvasHeight / 2;

    newScrollLeft = Math.max(minScrollLeft, Math.min(maxScrollLeft, newScrollLeft));
    newScrollTop = Math.max(minScrollTop, Math.min(maxScrollTop, newScrollTop));

    onViewportChange(newScrollLeft, newScrollTop);
  }, [frame, zoom, viewportWidth, viewportHeight, onViewportChange]);

  const handleHandleMouseDown = useCallback((e: React.MouseEvent, handle: 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      zoom,
      scrollLeft,
      scrollTop,
    });
  }, [zoom, scrollLeft, scrollTop]);

  const handleIndicatorMouseDown = useCallback((e: React.MouseEvent) => {
    // Check if clicking on a handle (they will stop propagation)
    if ((e.target as HTMLElement).classList.contains('minimap-handle')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Use existing navigation logic
    setIsDragging(true);
    updateViewportFromMouse(e.clientX, e.clientY);
  }, [updateViewportFromMouse]);

  // Global mouse event handlers for dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      updateViewportFromMouse(e.clientX, e.clientY);
    };

    const handleGlobalMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    if (isDragging) {
      isDraggingRef.current = true;
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, updateViewportFromMouse]);

  // Global resize event handlers
  useEffect(() => {
    if (!isResizing || !resizeHandle || !onZoomChange || !frame) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      e.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;

      // Calculate scale
      const scale = Math.min(
        MINIMAP_SIZE / frame.imageData.width,
        MINIMAP_SIZE / frame.imageData.height
      );

      // Calculate current indicator size at start zoom
      const startVisibleWidth = viewportWidth / resizeStart.zoom;
      const startVisibleHeight = viewportHeight / resizeStart.zoom;
      const startIndicatorWidth = startVisibleWidth * scale;
      const startIndicatorHeight = startVisibleHeight * scale;

      // Calculate new indicator size based on handle
      let newIndicatorWidth = startIndicatorWidth;
      let newIndicatorHeight = startIndicatorHeight;

      switch (resizeHandle) {
        case 'se': // Grow right/down
          newIndicatorWidth = startIndicatorWidth + dx;
          newIndicatorHeight = startIndicatorHeight + dy;
          break;
        case 'nw': // Shrink (drag toward center)
          newIndicatorWidth = startIndicatorWidth - dx;
          newIndicatorHeight = startIndicatorHeight - dy;
          break;
        case 'ne': // Grow right, shrink up
          newIndicatorWidth = startIndicatorWidth + dx;
          newIndicatorHeight = startIndicatorHeight - dy;
          break;
        case 'sw': // Shrink left, grow down
          newIndicatorWidth = startIndicatorWidth - dx;
          newIndicatorHeight = startIndicatorHeight + dy;
          break;
      }

      // Get minimap canvas dimensions for constraints
      const minimapCanvasWidth = frame.imageData.width * scale;
      const minimapCanvasHeight = frame.imageData.height * scale;

      // Constrain indicator size to minimap boundaries
      // Max size = entire minimap (fully zoomed out)
      // Min size = corresponds to max zoom (3.0)
      const minIndicatorWidth = (viewportWidth / 3.0) * scale;
      const minIndicatorHeight = (viewportHeight / 3.0) * scale;

      newIndicatorWidth = Math.max(minIndicatorWidth, Math.min(minimapCanvasWidth, newIndicatorWidth));
      newIndicatorHeight = Math.max(minIndicatorHeight, Math.min(minimapCanvasHeight, newIndicatorHeight));

      // Convert back to image coordinates
      const newVisibleWidth = newIndicatorWidth / scale;
      const newVisibleHeight = newIndicatorHeight / scale;

      // Calculate zoom from visible dimensions (use average)
      const zoomFromWidth = viewportWidth / newVisibleWidth;
      const zoomFromHeight = viewportHeight / newVisibleHeight;
      const newZoom = (zoomFromWidth + zoomFromHeight) / 2;

      // Clamp to zoom bounds
      const clampedZoom = Math.max(0.25, Math.min(3.0, newZoom));

      // Calculate anchor point (opposite corner from the handle being dragged)
      // to maintain its position during resize
      if (clampedZoom !== resizeStart.zoom) {
        const canvasWidth = frame.imageData.width * resizeStart.zoom;
        const canvasHeight = frame.imageData.height * resizeStart.zoom;
        const canvasX = viewportWidth / 2 - canvasWidth / 2 + resizeStart.scrollLeft;
        const canvasY = viewportHeight / 2 - canvasHeight / 2 + resizeStart.scrollTop;

        // Calculate anchor point in image coordinates based on handle
        let anchorImageX: number;
        let anchorImageY: number;

        switch (resizeHandle) {
          case 'se': // Dragging bottom-right, anchor top-left
            anchorImageX = -canvasX / resizeStart.zoom;
            anchorImageY = -canvasY / resizeStart.zoom;
            break;
          case 'nw': // Dragging top-left, anchor bottom-right
            anchorImageX = (-canvasX + viewportWidth) / resizeStart.zoom;
            anchorImageY = (-canvasY + viewportHeight) / resizeStart.zoom;
            break;
          case 'ne': // Dragging top-right, anchor bottom-left
            anchorImageX = -canvasX / resizeStart.zoom;
            anchorImageY = (-canvasY + viewportHeight) / resizeStart.zoom;
            break;
          case 'sw': // Dragging bottom-left, anchor top-right
            anchorImageX = (-canvasX + viewportWidth) / resizeStart.zoom;
            anchorImageY = -canvasY / resizeStart.zoom;
            break;
          default:
            anchorImageX = 0;
            anchorImageY = 0;
        }

        // Calculate new canvas dimensions at new zoom
        const newCanvasWidth = frame.imageData.width * clampedZoom;
        const newCanvasHeight = frame.imageData.height * clampedZoom;

        // Calculate new scroll position to keep anchor point at the same screen position
        // The calculation depends on where the anchor is in screen space
        let newScrollLeft: number;
        let newScrollTop: number;

        switch (resizeHandle) {
          case 'se': { // Anchor is at top-left (0, 0)
            const newCanvasX = -anchorImageX * clampedZoom;
            const newCanvasY = -anchorImageY * clampedZoom;
            newScrollLeft = newCanvasX + newCanvasWidth / 2 - viewportWidth / 2;
            newScrollTop = newCanvasY + newCanvasHeight / 2 - viewportHeight / 2;
            break;
          }
          case 'nw': { // Anchor is at bottom-right (viewportWidth, viewportHeight)
            const newCanvasX = viewportWidth - anchorImageX * clampedZoom;
            const newCanvasY = viewportHeight - anchorImageY * clampedZoom;
            newScrollLeft = newCanvasX + newCanvasWidth / 2 - viewportWidth / 2;
            newScrollTop = newCanvasY + newCanvasHeight / 2 - viewportHeight / 2;
            break;
          }
          case 'ne': { // Anchor is at bottom-left (0, viewportHeight)
            const newCanvasX = -anchorImageX * clampedZoom;
            const newCanvasY = viewportHeight - anchorImageY * clampedZoom;
            newScrollLeft = newCanvasX + newCanvasWidth / 2 - viewportWidth / 2;
            newScrollTop = newCanvasY + newCanvasHeight / 2 - viewportHeight / 2;
            break;
          }
          case 'sw': { // Anchor is at top-right (viewportWidth, 0)
            const newCanvasX = viewportWidth - anchorImageX * clampedZoom;
            const newCanvasY = -anchorImageY * clampedZoom;
            newScrollLeft = newCanvasX + newCanvasWidth / 2 - viewportWidth / 2;
            newScrollTop = newCanvasY + newCanvasHeight / 2 - viewportHeight / 2;
            break;
          }
          default:
            newScrollLeft = resizeStart.scrollLeft;
            newScrollTop = resizeStart.scrollTop;
        }

        // Apply pan constraints
        const maxScrollLeft = viewportWidth / 2 + newCanvasWidth / 2;
        const minScrollLeft = -viewportWidth / 2 - newCanvasWidth / 2;
        const maxScrollTop = viewportHeight / 2 + newCanvasHeight / 2;
        const minScrollTop = -viewportHeight / 2 - newCanvasHeight / 2;

        newScrollLeft = Math.max(minScrollLeft, Math.min(maxScrollLeft, newScrollLeft));
        newScrollTop = Math.max(minScrollTop, Math.min(maxScrollTop, newScrollTop));

        // Update both zoom and viewport position
        onZoomChange(clampedZoom);
        onViewportChange(newScrollLeft, newScrollTop);
      } else {
        onZoomChange(clampedZoom);
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      setIsResizing(false);
      setResizeHandle(null);
    };

    isResizingRef.current = true;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeHandle, resizeStart, onZoomChange, onViewportChange, frame, zoom, viewportWidth, viewportHeight]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    updateViewportFromMouse(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    updateViewportFromMouse(e.clientX, e.clientY);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Calculate viewport indicator position and canvas dimensions for overlay
  let viewportIndicator = { x: 0, y: 0, width: 0, height: 0 };
  let minimapCanvasDimensions = { width: 0, height: 0 };

  if (needsMinimap && frame) {
    const scale = Math.min(
      MINIMAP_SIZE / frame.imageData.width,
      MINIMAP_SIZE / frame.imageData.height
    );

    // Calculate canvas dimensions (same as in the drawing useEffect)
    minimapCanvasDimensions = {
      width: frame.imageData.width * scale,
      height: frame.imageData.height * scale,
    };

    const canvasWidth = frame.imageData.width * zoom;
    const canvasHeight = frame.imageData.height * zoom;
    const canvasX = viewportWidth / 2 - canvasWidth / 2 + scrollLeft;
    const canvasY = viewportHeight / 2 - canvasHeight / 2 + scrollTop;

    const visibleX = -canvasX / zoom;
    const visibleY = -canvasY / zoom;
    const visibleWidth = viewportWidth / zoom;
    const visibleHeight = viewportHeight / zoom;

    viewportIndicator = {
      x: visibleX * scale,
      y: visibleY * scale,
      width: visibleWidth * scale,
      height: visibleHeight * scale,
    };
  }

  // Don't show minimap if not needed or no frame
  if (!needsMinimap || !frame) return null;

  return (
    <div className="canvas-minimap-container" title="Drag handles to zoom, drag box to pan, click to jump">
      <div className="canvas-minimap-label">Minimap</div>
      <div className="canvas-minimap-wrapper">
        <canvas
          ref={canvasRef}
          className="canvas-minimap"
          onMouseDownCapture={handleMouseDown}
          onMouseMoveCapture={handleMouseMove}
          onMouseUpCapture={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* DOM overlay with interactive viewport indicator */}
        {needsMinimap && frame && (
          <div
            className="minimap-overlay"
            style={{
              width: minimapCanvasDimensions.width,
              height: minimapCanvasDimensions.height,
            }}
          >
            <div
              className={`viewport-indicator-box ${isResizing ? 'resizing' : ''}`}
              style={{
                left: `${viewportIndicator.x}px`,
                top: `${viewportIndicator.y}px`,
                width: `${viewportIndicator.width}px`,
                height: `${viewportIndicator.height}px`,
              }}
              onMouseDown={handleIndicatorMouseDown}
            >
              {/* Corner resize handles */}
              <div
                className="minimap-handle minimap-handle-nw"
                onMouseDown={(e) => handleHandleMouseDown(e, 'nw')}
              />
              <div
                className="minimap-handle minimap-handle-ne"
                onMouseDown={(e) => handleHandleMouseDown(e, 'ne')}
              />
              <div
                className="minimap-handle minimap-handle-sw"
                onMouseDown={(e) => handleHandleMouseDown(e, 'sw')}
              />
              <div
                className="minimap-handle minimap-handle-se"
                onMouseDown={(e) => handleHandleMouseDown(e, 'se')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
