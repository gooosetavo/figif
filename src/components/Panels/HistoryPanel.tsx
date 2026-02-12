/**
 * HistoryPanel - Version control panel for undo/redo and manual saves
 */

import type { WorkspaceSnapshot } from '../../types/workspace.types';
import type { GifFrame } from '../../types/gif.types';
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

              return (
                <div
                  key={snapshot.id}
                  className={`history-snapshot ${isCurrent ? 'current' : ''} ${
                    actualIndex > currentHistoryIndex ? 'future' : ''
                  }`}
                >
                  <div className="history-snapshot-icon">
                    {snapshot.isAutoSave ? '🔄' : '💾'}
                  </div>
                  <div className="history-snapshot-details">
                    <div className="history-snapshot-description">
                      {snapshot.description}
                    </div>
                    <div className="history-snapshot-meta">
                      <span className="history-snapshot-time">
                        {formatTimestamp(snapshot.timestamp)}
                      </span>
                      <span className="history-snapshot-frames">
                        {snapshot.frames.length} frames
                      </span>
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
    </div>
  );
}
