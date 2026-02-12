/**
 * CropOverlay - Visual overlay for crop selection on canvas
 */

import { useRef, useEffect, useState } from 'react';
import type { CropSelection } from './Panels/CropPanel';
import './CropOverlay.css';

interface CropOverlayProps {
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  cropSelection: CropSelection | null;
  onCropSelectionChange: (selection: CropSelection) => void;
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'move' | null;

export function CropOverlay({
  canvasWidth,
  canvasHeight,
  zoom,
  cropSelection,
  onCropSelectionChange,
}: CropOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<ResizeHandle>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialSelection, setInitialSelection] = useState<CropSelection | null>(null);

  if (!cropSelection) return null;

  const handleSize = 10;

  const handleMouseDown = (e: React.MouseEvent, handle: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialSelection({ ...cropSelection });
  };

  useEffect(() => {
    if (!isDragging || !initialSelection) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;

      let newSelection = { ...initialSelection };

      switch (dragHandle) {
        case 'move':
          newSelection.x = Math.max(0, Math.min(canvasWidth - newSelection.width, initialSelection.x + dx));
          newSelection.y = Math.max(0, Math.min(canvasHeight - newSelection.height, initialSelection.y + dy));
          break;

        case 'nw':
          newSelection.x = Math.max(0, Math.min(initialSelection.x + initialSelection.width - 10, initialSelection.x + dx));
          newSelection.y = Math.max(0, Math.min(initialSelection.y + initialSelection.height - 10, initialSelection.y + dy));
          newSelection.width = initialSelection.width - (newSelection.x - initialSelection.x);
          newSelection.height = initialSelection.height - (newSelection.y - initialSelection.y);
          break;

        case 'ne':
          newSelection.y = Math.max(0, Math.min(initialSelection.y + initialSelection.height - 10, initialSelection.y + dy));
          newSelection.width = Math.max(10, Math.min(canvasWidth - initialSelection.x, initialSelection.width + dx));
          newSelection.height = initialSelection.height - (newSelection.y - initialSelection.y);
          break;

        case 'sw':
          newSelection.x = Math.max(0, Math.min(initialSelection.x + initialSelection.width - 10, initialSelection.x + dx));
          newSelection.width = initialSelection.width - (newSelection.x - initialSelection.x);
          newSelection.height = Math.max(10, Math.min(canvasHeight - initialSelection.y, initialSelection.height + dy));
          break;

        case 'se':
          newSelection.width = Math.max(10, Math.min(canvasWidth - initialSelection.x, initialSelection.width + dx));
          newSelection.height = Math.max(10, Math.min(canvasHeight - initialSelection.y, initialSelection.height + dy));
          break;

        case 'n':
          newSelection.y = Math.max(0, Math.min(initialSelection.y + initialSelection.height - 10, initialSelection.y + dy));
          newSelection.height = initialSelection.height - (newSelection.y - initialSelection.y);
          break;

        case 's':
          newSelection.height = Math.max(10, Math.min(canvasHeight - initialSelection.y, initialSelection.height + dy));
          break;

        case 'e':
          newSelection.width = Math.max(10, Math.min(canvasWidth - initialSelection.x, initialSelection.width + dx));
          break;

        case 'w':
          newSelection.x = Math.max(0, Math.min(initialSelection.x + initialSelection.width - 10, initialSelection.x + dx));
          newSelection.width = initialSelection.width - (newSelection.x - initialSelection.x);
          break;
      }

      onCropSelectionChange(newSelection);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragHandle(null);
      setInitialSelection(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragHandle, dragStart, initialSelection, zoom, canvasWidth, canvasHeight, onCropSelectionChange]);

  return (
    <div
      ref={overlayRef}
      className="crop-overlay"
      style={{
        width: canvasWidth * zoom,
        height: canvasHeight * zoom,
      }}
    >
      {/* Selection box */}
      <div
        className="crop-selection-box"
        style={{
          left: cropSelection.x * zoom,
          top: cropSelection.y * zoom,
          width: cropSelection.width * zoom,
          height: cropSelection.height * zoom,
        }}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
        {/* Corner handles */}
        <div
          className="crop-handle crop-handle-nw"
          style={{ width: handleSize, height: handleSize }}
          onMouseDown={(e) => handleMouseDown(e, 'nw')}
        />
        <div
          className="crop-handle crop-handle-ne"
          style={{ width: handleSize, height: handleSize }}
          onMouseDown={(e) => handleMouseDown(e, 'ne')}
        />
        <div
          className="crop-handle crop-handle-sw"
          style={{ width: handleSize, height: handleSize }}
          onMouseDown={(e) => handleMouseDown(e, 'sw')}
        />
        <div
          className="crop-handle crop-handle-se"
          style={{ width: handleSize, height: handleSize }}
          onMouseDown={(e) => handleMouseDown(e, 'se')}
        />

        {/* Edge handles */}
        <div
          className="crop-handle crop-handle-n"
          onMouseDown={(e) => handleMouseDown(e, 'n')}
        />
        <div
          className="crop-handle crop-handle-s"
          onMouseDown={(e) => handleMouseDown(e, 's')}
        />
        <div
          className="crop-handle crop-handle-e"
          onMouseDown={(e) => handleMouseDown(e, 'e')}
        />
        <div
          className="crop-handle crop-handle-w"
          onMouseDown={(e) => handleMouseDown(e, 'w')}
        />
      </div>
    </div>
  );
}
