/**
 * WorkspaceTabs - Browser-style tabs for switching between workspaces
 */

import type { WorkspaceMetadata } from '../../types/workspace.types';
import './WorkspaceTabs.css';

interface WorkspaceTabsProps {
  workspaces: WorkspaceMetadata[];
  activeWorkspaceId: string | null;
  onSwitchWorkspace: (id: string) => void;
  onCloseWorkspace: (id: string) => void;
  onCreateWorkspace: () => void;
  isCreatingWorkspace?: boolean;
  isSwitchingWorkspace?: boolean;
  isClosingWorkspace?: boolean;
}

export function WorkspaceTabs({
  workspaces,
  activeWorkspaceId,
  onSwitchWorkspace,
  onCloseWorkspace,
  onCreateWorkspace,
  isCreatingWorkspace = false,
  isSwitchingWorkspace = false,
  isClosingWorkspace = false,
}: WorkspaceTabsProps) {
  const handleCloseClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent tab switch when clicking close
    onCloseWorkspace(id);
  };

  const isAnyOperation = isCreatingWorkspace || isSwitchingWorkspace || isClosingWorkspace;

  return (
    <div className="workspace-tabs">
      <div className="workspace-tabs-container">
        {workspaces.map((workspace) => (
          <div
            key={workspace.id}
            className={`workspace-tab ${activeWorkspaceId === workspace.id ? 'active' : ''} ${isAnyOperation ? 'loading' : ''}`}
            onClick={() => !isAnyOperation && onSwitchWorkspace(workspace.id)}
            style={{ cursor: isAnyOperation ? 'wait' : 'pointer' }}
          >
            {workspace.thumbnail && (
              <img
                src={workspace.thumbnail}
                alt=""
                className="workspace-tab-thumbnail"
              />
            )}
            <span className="workspace-tab-name" title={workspace.name}>
              {workspace.name}
            </span>
            <span className="workspace-tab-info">
              {workspace.frameCount} frame{workspace.frameCount !== 1 ? 's' : ''}
            </span>
            <button
              className="workspace-tab-close"
              onClick={(e) => handleCloseClick(e, workspace.id)}
              aria-label="Close workspace"
              disabled={isAnyOperation}
            >
              {isClosingWorkspace ? '⏳' : '×'}
            </button>
          </div>
        ))}
        <button
          className="workspace-tab-new"
          onClick={onCreateWorkspace}
          aria-label="New workspace"
          disabled={isAnyOperation}
        >
          {isCreatingWorkspace ? '⏳ Creating...' : '+ New'}
        </button>
      </div>
    </div>
  );
}
