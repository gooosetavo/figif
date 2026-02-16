import { useEffect, useRef, useState } from 'react';
import type { GifFrame } from '../types/gif.types';
import { CropOverlay } from './CropOverlay';
import { CanvasZoomControls } from './CanvasZoomControls';
import { CanvasMinimap } from './CanvasMinimap';
import { StorageIndicator } from './StorageIndicator';
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
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onZoomChange?: (zoom: number) => void;
  currentFrameSize?: number;
  totalSize?: number;
  originalFileSize?: number;
}

export function CanvasEditor({
  frame,
  zoom,
  selectionMode = false,
  selectionMask = null,
  cropSelection = null,
  onCropSelectionChange,
  onCanvasClick,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomChange,
  currentFrameSize,
  totalSize,
  originalFileSize,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [viewportDimensions, setViewportDimensions] = useState({ width: 0, height: 0 });

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

  const handleViewportChange = (scrollLeft: number, scrollTop: number) => {
    // Update pan based on minimap interaction
    setPan({
      x: scrollLeft,
      y: scrollTop,
    });
  };

  // Track viewport dimensions for minimap
  useEffect(() => {
    const updateDimensions = () => {
      if (viewportRef.current) {
        setViewportDimensions({
          width: viewportRef.current.clientWidth,
          height: viewportRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Keyboard shortcuts for zoom and pan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      const PAN_STEP = 50;

      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          onZoomIn?.();
          break;
        case '-':
        case '_':
          e.preventDefault();
          onZoomOut?.();
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onZoomReset?.();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setPan(p => ({ x: p.x, y: p.y + PAN_STEP }));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setPan(p => ({ x: p.x, y: p.y - PAN_STEP }));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setPan(p => ({ x: p.x + PAN_STEP, y: p.y }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setPan(p => ({ x: p.x - PAN_STEP, y: p.y }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onZoomIn, onZoomOut, onZoomReset]);

  if (!frame) {
    return (
      <div className="canvas-editor empty">
        <p>No frame to display</p>
      </div>
    );
  }

  return (
    <div
      ref={editorRef}
      className={`canvas-editor ${isPanning ? 'panning' : ''} ${selectionMode ? 'selection-mode' : ''}`}
    >
      {/* Interactive Canvas Area */}
      <div
        ref={viewportRef}
        className="canvas-viewport"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={containerRef}
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

      {/* UI Overlay - Fixed position widgets */}
      <div className="canvas-ui-overlay">
        {/* Zoom Controls */}
        {onZoomIn && onZoomOut && onZoomReset && (
          <CanvasZoomControls
            zoom={zoom}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onZoomReset={onZoomReset}
          />
        )}

        {/* Minimap */}
        <CanvasMinimap
          frame={frame}
          zoom={zoom}
          viewportWidth={viewportDimensions.width}
          viewportHeight={viewportDimensions.height}
          scrollLeft={pan.x}
          scrollTop={pan.y}
          onViewportChange={handleViewportChange}
          onZoomChange={onZoomChange}
        />

        {/* Storage Indicator */}
        <StorageIndicator
          currentFrameSize={currentFrameSize}
          totalSize={totalSize}
          originalFileSize={originalFileSize}
        />
      </div>
    </div>
  );
}
