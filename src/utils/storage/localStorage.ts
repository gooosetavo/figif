/**
 * localStorage management for workspace index
 */

import type { WorkspaceIndex, WorkspaceMetadata } from '../../types/workspace.types';

const INDEX_KEY = 'figif-workspace-index';

/**
 * Get the workspace index from localStorage
 */
export function getWorkspaceIndex(): WorkspaceIndex {
  try {
    const stored = localStorage.getItem(INDEX_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load workspace index:', error);
  }

  // Return default index
  return {
    activeWorkspaceId: null,
    workspaceOrder: [],
    workspaces: {},
  };
}

/**
 * Save the workspace index to localStorage
 */
export function saveWorkspaceIndex(index: WorkspaceIndex): void {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch (error) {
    console.error('Failed to save workspace index:', error);
  }
}

/**
 * Add a workspace to the index
 */
export function addWorkspaceToIndex(metadata: WorkspaceMetadata): void {
  const index = getWorkspaceIndex();

  // Add to workspaces map
  index.workspaces[metadata.id] = metadata;

  // Add to order if not already present
  if (!index.workspaceOrder.includes(metadata.id)) {
    index.workspaceOrder.push(metadata.id);
  }

  // Set as active if no active workspace
  if (!index.activeWorkspaceId) {
    index.activeWorkspaceId = metadata.id;
  }

  saveWorkspaceIndex(index);
}

/**
 * Remove a workspace from the index
 */
export function removeWorkspaceFromIndex(id: string): void {
  const index = getWorkspaceIndex();

  // Remove from workspaces map
  delete index.workspaces[id];

  // Remove from order
  index.workspaceOrder = index.workspaceOrder.filter((wId) => wId !== id);

  // Update active workspace if it was deleted
  if (index.activeWorkspaceId === id) {
    index.activeWorkspaceId = index.workspaceOrder[0] || null;
  }

  saveWorkspaceIndex(index);
}

/**
 * Update workspace metadata in the index
 */
export function updateWorkspaceMetadata(metadata: WorkspaceMetadata): void {
  const index = getWorkspaceIndex();

  if (index.workspaces[metadata.id]) {
    index.workspaces[metadata.id] = metadata;
    saveWorkspaceIndex(index);
  }
}

/**
 * Set the active workspace
 */
export function setActiveWorkspace(id: string): void {
  const index = getWorkspaceIndex();

  if (index.workspaces[id]) {
    index.activeWorkspaceId = id;
    saveWorkspaceIndex(index);
  }
}

/**
 * Get the active workspace ID
 */
export function getActiveWorkspaceId(): string | null {
  const index = getWorkspaceIndex();
  return index.activeWorkspaceId;
}

/**
 * Reorder workspaces
 */
export function reorderWorkspaces(newOrder: string[]): void {
  const index = getWorkspaceIndex();

  // Validate all IDs exist
  const validOrder = newOrder.filter((id) => index.workspaces[id]);

  index.workspaceOrder = validOrder;
  saveWorkspaceIndex(index);
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
