import { useEffect, useRef, useState } from 'react';
import type { GifFrame } from '../types/gif.types';
import './Timeline.css';

interface TimelineProps {
  frames: GifFrame[];
  currentFrameIndex: number;
  isPlaying: boolean;
  selectedFrames?: Set<number>;
  onFrameSelect: (index: number) => void;
  onFrameMultiSelect?: (indices: Set<number>) => void;
  onReorderFrames?: (fromIndex: number, toIndex: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function Timeline({
  frames,
  currentFrameIndex,
  isPlaying,
  selectedFrames = new Set<number>(),
  onFrameSelect,
  onFrameMultiSelect,
  onReorderFrames,
  onPlay,
  onPause,
  onNext,
  onPrevious,
}: TimelineProps) {
  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastSelectedIndex = useRef<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    // Scroll current frame into view
    thumbnailRefs.current[currentFrameIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [currentFrameIndex]);

  const handleFrameClick = (index: number, event: React.MouseEvent) => {
    if (!onFrameMultiSelect) {
      // No multi-select support, use regular select
      onFrameSelect(index);
      return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

    if (event.shiftKey && lastSelectedIndex.current !== null) {
      // Shift+Click: Select range from last selected to current
      const start = Math.min(lastSelectedIndex.current, index);
      const end = Math.max(lastSelectedIndex.current, index);
      const newSelection = new Set(selectedFrames);
      for (let i = start; i <= end; i++) {
        newSelection.add(i);
      }
      onFrameMultiSelect(newSelection);
    } else if (ctrlKey) {
      // Ctrl/Cmd+Click: Toggle selection
      const newSelection = new Set(selectedFrames);
      if (newSelection.has(index)) {
        newSelection.delete(index);
      } else {
        newSelection.add(index);
      }
      onFrameMultiSelect(newSelection);
      lastSelectedIndex.current = index;
    } else {
      // Regular click: Select single frame
      onFrameSelect(index);
      onFrameMultiSelect(new Set([index]));
      lastSelectedIndex.current = index;
    }
  };

  const handleDragStart = (index: number, event: React.DragEvent) => {
    setDraggedIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', ''); // Required for Firefox
  };

  const handleDragOver = (index: number, event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (toIndex: number, event: React.DragEvent) => {
    event.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex && onReorderFrames) {
      onReorderFrames(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const renderThumbnail = (frame: GifFrame, _index: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Calculate scaling to fit thumbnail
      const scale = Math.min(80 / frame.imageData.width, 60 / frame.imageData.height);
      const scaledWidth = frame.imageData.width * scale;
      const scaledHeight = frame.imageData.height * scale;
      const offsetX = (80 - scaledWidth) / 2;
      const offsetY = (60 - scaledHeight) / 2;

      // Create a temporary canvas with original size
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = frame.imageData.width;
      tempCanvas.height = frame.imageData.height;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        tempCtx.putImageData(frame.imageData, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, offsetX, offsetY, scaledWidth, scaledHeight);
      }
    }

    return canvas.toDataURL();
  };

  if (frames.length === 0) {
    return null;
  }

  const fps = frames[currentFrameIndex] ? Math.round(1000 / frames[currentFrameIndex].delay) : 0;

  return (
    <div className="timeline">
      <div className="timeline-controls">
        <button onClick={onPrevious} title="Previous frame">
          &#9664;
        </button>
        <button onClick={isPlaying ? onPause : onPlay} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={onNext} title="Next frame">
          &#9654;
        </button>
        <span className="frame-info">
          Frame {currentFrameIndex + 1} / {frames.length}
        </span>
        <span className="fps-info">{fps} FPS</span>
      </div>

      <div className="timeline-frames">
        {frames.map((frame, index) => {
          const isActive = index === currentFrameIndex;
          const isSelected = selectedFrames.has(index);
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;
          return (
            <div
              key={index}
              ref={(el) => { thumbnailRefs.current[index] = el; }}
              className={`timeline-frame ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
              onClick={(e) => handleFrameClick(index, e)}
              draggable={!!onReorderFrames}
              onDragStart={(e) => handleDragStart(index, e)}
              onDragOver={(e) => handleDragOver(index, e)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(index, e)}
              onDragEnd={handleDragEnd}
            >
              <img src={renderThumbnail(frame, index)} alt={`Frame ${index + 1}`} />
              <span className="frame-number">{index + 1}</span>
              <span className="frame-delay">{frame.delay}ms</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
