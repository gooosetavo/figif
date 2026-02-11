import { useEffect, useRef } from 'react';
import type { GifFrame } from '../types/gif.types';
import './Timeline.css';

interface TimelineProps {
  frames: GifFrame[];
  currentFrameIndex: number;
  isPlaying: boolean;
  onFrameSelect: (index: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function Timeline({
  frames,
  currentFrameIndex,
  isPlaying,
  onFrameSelect,
  onPlay,
  onPause,
  onNext,
  onPrevious,
}: TimelineProps) {
  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Scroll current frame into view
    thumbnailRefs.current[currentFrameIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [currentFrameIndex]);

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
        {frames.map((frame, index) => (
          <div
            key={index}
            ref={(el) => { thumbnailRefs.current[index] = el; }}
            className={`timeline-frame ${index === currentFrameIndex ? 'active' : ''}`}
            onClick={() => onFrameSelect(index)}
          >
            <img src={renderThumbnail(frame, index)} alt={`Frame ${index + 1}`} />
            <span className="frame-number">{index + 1}</span>
            <span className="frame-delay">{frame.delay}ms</span>
          </div>
        ))}
      </div>
    </div>
  );
}
