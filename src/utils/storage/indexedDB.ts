/**
 * IndexedDB storage layer for workspaces
 */

import type { Workspace, WorkspaceSnapshot } from '../../types/workspace.types';

const DB_NAME = 'figif-workspaces';
const DB_VERSION = 1;
const WORKSPACE_STORE = 'workspaces';
const SNAPSHOT_STORE = 'snapshots';

/**
 * Open the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create workspace store
      if (!db.objectStoreNames.contains(WORKSPACE_STORE)) {
        const workspaceStore = db.createObjectStore(WORKSPACE_STORE, { keyPath: 'id' });
        workspaceStore.createIndex('lastModified', 'lastModified', { unique: false });
      }

      // Create snapshot store
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
        const snapshotStore = db.createObjectStore(SNAPSHOT_STORE, { keyPath: 'id' });
        snapshotStore.createIndex('workspaceId', 'workspaceId', { unique: false });
        snapshotStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Save or update a workspace
 */
export async function saveWorkspace(workspace: Workspace): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([WORKSPACE_STORE], 'readwrite');
    const store = transaction.objectStore(WORKSPACE_STORE);
    const request = store.put(workspace);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Load a workspace by ID
 */
export async function loadWorkspace(id: string): Promise<Workspace | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([WORKSPACE_STORE], 'readonly');
    const store = transaction.objectStore(WORKSPACE_STORE);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Delete a workspace and all its snapshots
 */
export async function deleteWorkspace(id: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([WORKSPACE_STORE, SNAPSHOT_STORE], 'readwrite');

    // Delete workspace
    const workspaceStore = transaction.objectStore(WORKSPACE_STORE);
    const deleteWorkspaceRequest = workspaceStore.delete(id);

    // Delete associated snapshots
    const snapshotStore = transaction.objectStore(SNAPSHOT_STORE);
    const snapshotIndex = snapshotStore.index('workspaceId');
    const snapshotRequest = snapshotIndex.openCursor(IDBKeyRange.only(id));

    snapshotRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    deleteWorkspaceRequest.onerror = () => reject(deleteWorkspaceRequest.error);
    snapshotRequest.onerror = () => reject(snapshotRequest.error);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * List all workspace IDs
 */
export async function listWorkspaceIds(): Promise<string[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([WORKSPACE_STORE], 'readonly');
    const store = transaction.objectStore(WORKSPACE_STORE);
    const request = store.getAllKeys();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as string[]);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Save a snapshot (for external history management if needed)
 */
export async function saveSnapshot(
  workspaceId: string,
  snapshot: WorkspaceSnapshot
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SNAPSHOT_STORE], 'readwrite');
    const store = transaction.objectStore(SNAPSHOT_STORE);

    // Add workspaceId to snapshot for indexing
    const snapshotWithWorkspace = { ...snapshot, workspaceId };
    const request = store.put(snapshotWithWorkspace);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Load snapshots for a workspace
 */
export async function loadSnapshots(workspaceId: string): Promise<WorkspaceSnapshot[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SNAPSHOT_STORE], 'readonly');
    const store = transaction.objectStore(SNAPSHOT_STORE);
    const index = store.index('workspaceId');
    const request = index.getAll(IDBKeyRange.only(workspaceId));

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const snapshots = request.result.map((s: any) => {
        // Remove workspaceId field before returning
        const { workspaceId: _, ...snapshot } = s;
        return snapshot as WorkspaceSnapshot;
      });
      resolve(snapshots);
    };

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}
