/**
 * HistoryPanel - Version control panel for undo/redo and manual saves
 */

import { useMemo } from 'react';
import type { WorkspaceSnapshot } from '../../types/workspace.types';
import type { GifFrame } from '../../types/gif.types';
import { deserializeFrame } from '../../utils/serialization';
import { formatBytes, estimateGifSize } from '../../utils/storageSize';
import './HistoryPanel.css';

interface HistoryPanelProps {
  historyStack: WorkspaceSnapshot[];
  currentHistoryIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSaveNow: () => void;
  currentFrames: GifFrame[];
  currentFrameIndex: number;
}

export function HistoryPanel({
  historyStack,
  currentHistoryIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSaveNow,
  currentFrames,
}: HistoryPanelProps) {
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const hasUnsavedChanges = currentFrames.length > 0 && historyStack.length === 0;

  // Calculate totals from current snapshot
  const currentSnapshot = historyStack[currentHistoryIndex];
  const totalStats = useMemo(() => {
    if (!currentSnapshot) {
      return null;
    }

    const frameCount = currentSnapshot.frames.length;
    const rawSize = currentSnapshot.totalSize || 0;
    const gifSize = currentSnapshot.originalFileSize ?? estimateGifSize(rawSize);
    const isOriginal = currentSnapshot.originalFileSize !== undefined;
    const snapshotCount = historyStack.length;

    return {
      frameCount,
      rawSize,
      gifSize,
      isOriginal,
      snapshotCount,
    };
  }, [currentSnapshot, historyStack.length]);

  // Generate thumbnails for snapshots
  const snapshotThumbnails = useMemo(() => {
    return historyStack.map((snapshot) => {
      if (snapshot.frames.length === 0) return null;

      try {
        const firstFrame = deserializeFrame(snapshot.frames[snapshot.currentFrameIndex] || snapshot.frames[0]);
        const canvas = document.createElement('canvas');
        const maxSize = 48;
        const aspectRatio = firstFrame.imageData.width / firstFrame.imageData.height;

        let width = maxSize;
        let height = maxSize;
        if (aspectRatio > 1) {
          height = maxSize / aspectRatio;
        } else {
          width = maxSize * aspectRatio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx && firstFrame.canvas) {
          ctx.drawImage(firstFrame.canvas, 0, 0, width, height);
          return canvas.toDataURL('image/png');
        }
      } catch {
        return null;
      }
      return null;
    });
  }, [historyStack]);

  return (
    <div className="history-panel">
      <div className="history-controls">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="history-button"
          title="Undo (Ctrl+Z)"
        >
          ← Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="history-button"
          title="Redo (Ctrl+Shift+Z)"
        >
          Redo →
        </button>
      </div>

      <div className="history-save">
        <button
          onClick={onSaveNow}
          className="history-save-button"
          title="Save current state (Ctrl+S)"
        >
          💾 Save Now
        </button>
        {hasUnsavedChanges && (
          <span className="unsaved-indicator">Unsaved changes</span>
        )}
      </div>

      {historyStack.length > 0 && (
        <div className="history-list">
          <div className="history-list-header">History</div>
          <div className="history-snapshots">
            {historyStack.slice().reverse().map((snapshot, reverseIndex) => {
              const actualIndex = historyStack.length - 1 - reverseIndex;
              const isCurrent = actualIndex === currentHistoryIndex;
              const thumbnail = snapshotThumbnails[actualIndex];

              return (
                <div
                  key={snapshot.id}
                  className={`history-snapshot ${isCurrent ? 'current' : ''} ${
                    actualIndex > currentHistoryIndex ? 'future' : ''
                  }`}
                >
                  {thumbnail && (
                    <div className="history-snapshot-thumbnail">
                      <img src={thumbnail} alt="" />
                    </div>
                  )}
                  <div className="history-snapshot-details">
                    <div className="history-snapshot-description">
                      {snapshot.description}
                      {snapshot.isAutoSave && <span className="auto-save-badge">Auto</span>}
                    </div>
                    <div className="history-snapshot-meta">
                      <span className="history-snapshot-time">
                        {formatTimestamp(snapshot.timestamp)}
                      </span>
                      <span className="history-snapshot-frames">
                        {snapshot.frames.length} frame{snapshot.frames.length !== 1 ? 's' : ''}
                      </span>
                      {snapshot.originalFileSize !== undefined && (
                        <span className="history-snapshot-size" title="Original GIF file size">
                          GIF: {formatBytes(snapshot.originalFileSize)}
                        </span>
                      )}
                      {snapshot.originalFileSize === undefined && snapshot.totalSize !== undefined && (
                        <span className="history-snapshot-size" title="Estimated GIF export size">
                          Est: {formatBytes(estimateGifSize(snapshot.totalSize))}
                        </span>
                      )}
                      {snapshot.totalSize !== undefined && (
                        <span className="history-snapshot-size" title="Raw uncompressed storage">
                          Raw: {formatBytes(snapshot.totalSize)}
                        </span>
                      )}
                    </div>
                  </div>
                  {isCurrent && (
                    <div className="history-snapshot-current-marker">●</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {historyStack.length === 0 && currentFrames.length > 0 && (
        <div className="history-empty">
          <p>No history yet</p>
          <p className="history-empty-hint">Make edits to create version history</p>
        </div>
      )}

      {totalStats && (
        <div className="history-totals">
          <div className="history-totals-header">Current State</div>
          <div className="history-totals-grid">
            <div
              className="history-totals-item"
              title="Total number of animation frames in the current snapshot"
            >
              <span className="history-totals-label">Frames:</span>
              <span className="history-totals-value">{totalStats.frameCount}</span>
            </div>
            <div
              className="history-totals-item"
              title="Number of saved history snapshots (undo/redo states)"
            >
              <span className="history-totals-label">Snapshots:</span>
              <span className="history-totals-value">{totalStats.snapshotCount}</span>
            </div>
            <div
              className="history-totals-item"
              title="Uncompressed RGBA pixel data (4 bytes per pixel). Required for editing but much larger than compressed GIF files."
            >
              <span className="history-totals-label">Raw Storage:</span>
              <span className="history-totals-value">{formatBytes(totalStats.rawSize)}</span>
            </div>
            <div
              className="history-totals-item"
              title={totalStats.isOriginal
                ? "Original GIF file size with LZW compression and palette optimization. This is what you loaded."
                : "Estimated GIF export size (~12x compression). Actual size depends on image complexity and optimization settings."
              }
            >
              <span className="history-totals-label">{totalStats.isOriginal ? 'Original GIF:' : 'Est. GIF:'}</span>
              <span className="history-totals-value">{formatBytes(totalStats.gifSize)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
