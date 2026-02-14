import { HistoryPanel } from '../Panels/HistoryPanel';
import { useEditor } from '../../contexts/EditorContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';

interface EditorRightPanelProps {
  onUndo: () => void;
  onRedo: () => void;
  onSaveNow: () => void;
}

export const EditorRightPanel = ({ onUndo, onRedo, onSaveNow }: EditorRightPanelProps) => {
  const { isHistoryPanelCollapsed, setIsHistoryPanelCollapsed } = useEditor();
  const { activeWorkspace, canUndo, canRedo, frames, currentFrameIndex } = useWorkspace();

  if (!activeWorkspace) {
    return null;
  }

  return (
    <aside className={`right-panel ${isHistoryPanelCollapsed ? 'collapsed' : ''}`}>
      <button
        className="right-panel-toggle"
        onClick={() => setIsHistoryPanelCollapsed(!isHistoryPanelCollapsed)}
        aria-label={isHistoryPanelCollapsed ? 'Show history' : 'Hide history'}
      >
        {isHistoryPanelCollapsed ? '▶' : '◀'}
      </button>
      <div className="right-panel-header">
        <h3>History & Version Control</h3>
      </div>
      <div className="right-panel-content">
        <HistoryPanel
          historyStack={activeWorkspace.historyStack}
          currentHistoryIndex={activeWorkspace.currentHistoryIndex}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
          onSaveNow={onSaveNow}
          currentFrames={frames}
          currentFrameIndex={currentFrameIndex}
        />
      </div>
    </aside>
  );
};
