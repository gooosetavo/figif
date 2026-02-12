import { useRef, useEffect, useState } from 'react';
import type { GifFrame } from '../types/gif.types';
import './PreviewModal.css';

interface PreviewModalProps {
  originalFrame: GifFrame;
  previewImageData: ImageData;
  onApply: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function PreviewModal({
  originalFrame,
  previewImageData,
  onApply,
  onCancel,
  isOpen,
}: PreviewModalProps) {
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [showComparison, setShowComparison] = useState<'original' | 'preview' | 'split'>('split');

  useEffect(() => {
    if (!isOpen) return;

    // Draw original
    if (originalCanvasRef.current) {
      const ctx = originalCanvasRef.current.getContext('2d');
      if (ctx) {
        originalCanvasRef.current.width = originalFrame.imageData.width;
        originalCanvasRef.current.height = originalFrame.imageData.height;
        ctx.putImageData(originalFrame.imageData, 0, 0);
      }
    }

    // Draw preview
    if (previewCanvasRef.current) {
      const ctx = previewCanvasRef.current.getContext('2d');
      if (ctx) {
        previewCanvasRef.current.width = previewImageData.width;
        previewCanvasRef.current.height = previewImageData.height;
        ctx.putImageData(previewImageData, 0, 0);
      }
    }
  }, [isOpen, originalFrame, previewImageData]);

  if (!isOpen) return null;

  return (
    <div className="preview-modal-overlay" onClick={onCancel}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preview-header">
          <h3>Preview Background Selection</h3>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>

        <div className="preview-controls">
          <button
            className={`view-button ${showComparison === 'original' ? 'active' : ''}`}
            onClick={() => setShowComparison('original')}
          >
            Original
          </button>
          <button
            className={`view-button ${showComparison === 'split' ? 'active' : ''}`}
            onClick={() => setShowComparison('split')}
          >
            Split View
          </button>
          <button
            className={`view-button ${showComparison === 'preview' ? 'active' : ''}`}
            onClick={() => setShowComparison('preview')}
          >
            Preview
          </button>
        </div>

        <div className="preview-content">
          {showComparison === 'original' && (
            <div className="preview-single">
              <canvas ref={originalCanvasRef} className="preview-canvas" />
              <p className="preview-label">Original</p>
            </div>
          )}

          {showComparison === 'preview' && (
            <div className="preview-single">
              <canvas ref={previewCanvasRef} className="preview-canvas" />
              <p className="preview-label">With Background Removed</p>
            </div>
          )}

          {showComparison === 'split' && (
            <div className="preview-split">
              <div className="preview-half">
                <canvas ref={originalCanvasRef} className="preview-canvas" />
                <p className="preview-label">Original</p>
              </div>
              <div className="preview-divider" />
              <div className="preview-half">
                <canvas ref={previewCanvasRef} className="preview-canvas" />
                <p className="preview-label">Preview</p>
              </div>
            </div>
          )}
        </div>

        <div className="preview-actions">
          <button className="modal-button cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-button apply-button" onClick={onApply}>
            Apply to Frame
          </button>
        </div>
      </div>
    </div>
  );
}
