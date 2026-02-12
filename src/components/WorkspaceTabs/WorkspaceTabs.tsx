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
}

export function WorkspaceTabs({
  workspaces,
  activeWorkspaceId,
  onSwitchWorkspace,
  onCloseWorkspace,
  onCreateWorkspace,
}: WorkspaceTabsProps) {
  const handleCloseClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent tab switch when clicking close
    onCloseWorkspace(id);
  };

  return (
    <div className="workspace-tabs">
      <div className="workspace-tabs-container">
        {workspaces.map((workspace) => (
          <div
            key={workspace.id}
            className={`workspace-tab ${activeWorkspaceId === workspace.id ? 'active' : ''}`}
            onClick={() => onSwitchWorkspace(workspace.id)}
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
            >
              ×
            </button>
          </div>
        ))}
        <button
          className="workspace-tab-new"
          onClick={onCreateWorkspace}
          aria-label="New workspace"
        >
          + New
        </button>
      </div>
    </div>
  );
}
