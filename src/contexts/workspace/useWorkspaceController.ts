import { useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import {
  createDefaultActiveEnvByWorkspace,
  createDefaultActiveTabByWorkspace,
  createDefaultTabsByWorkspace,
  createDefaultWorkspaces
} from './initializers';
import { canSyncWorkspace, getSyncSignature, getWorkspaceSyncPayload } from './syncHelpers';
import type { SavedRequest, TabData, Workspace, WorkspaceContextState } from './types';
import { useCollectionActions } from './useCollectionActions';
import { useEnvironmentActions } from './useEnvironmentActions';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useLegacyWorkspaceMigration } from './useLegacyWorkspaceMigration';
import { useLocalStorage } from './useLocalStorage';
import { useRequestSender } from './useRequestSender';
import { useTabActions } from './useTabActions';
import { useWorkspaceSync } from './useWorkspaceSync';

export function useWorkspaceController(userId: string): WorkspaceContextState {
  const localDefaultWorkspaceId = `local-${userId}`;
  const [workspaces, setWorkspaces] = useLocalStorage<Workspace[]>(
    `syncarts-workspaces-v3-${userId}`,
    createDefaultWorkspaces(userId, localDefaultWorkspaceId)
  );
  const [activeWorkspaceId, setActiveWorkspaceId] = useLocalStorage<string>(
    `syncarts-active-workspace-v3-${userId}`,
    workspaces[0]?.id || localDefaultWorkspaceId
  );
  const [tabsByWorkspace, setTabsByWorkspace] = useLocalStorage<Record<string, TabData[]>>(
    `syncarts-tabs-by-workspace-v3-${userId}`,
    createDefaultTabsByWorkspace(localDefaultWorkspaceId)
  );
  const [activeTabIdByWorkspace, setActiveTabIdByWorkspace] = useLocalStorage<Record<string, string | null>>(
    `syncarts-active-tab-by-workspace-v3-${userId}`,
    createDefaultActiveTabByWorkspace(localDefaultWorkspaceId)
  );
  const [activeEnvIdByWorkspace, setActiveEnvIdByWorkspace] = useLocalStorage<Record<string, string | null>>(
    `syncarts-active-env-by-workspace-v3-${userId}`,
    createDefaultActiveEnvByWorkspace(localDefaultWorkspaceId)
  );

  const dirtyWorkspaceIdsRef = useRef<Set<string>>(new Set());
  const syncingWorkspaceIdsRef = useRef<Set<string>>(new Set());
  const deletedWorkspaceIdsRef = useRef<Set<string>>(new Set());
  const lastSyncedSignaturesRef = useRef<Record<string, string>>({});
  const lastSavedTabSnapshotsRef = useRef<Record<string, string>>({});

  useLegacyWorkspaceMigration({
    activeWorkspaceId,
    localDefaultWorkspaceId,
    setActiveEnvIdByWorkspace,
    setActiveTabIdByWorkspace,
    setActiveWorkspaceId,
    setTabsByWorkspace,
    setWorkspaces,
    userId,
    workspaces
  });

  useEffect(() => {
    if (workspaces.length > 0) return;
    const defaultWorkspace = createDefaultWorkspaces(userId, localDefaultWorkspaceId)[0];

    setWorkspaces([defaultWorkspace]);
    setActiveWorkspaceId(defaultWorkspace.id);
    setTabsByWorkspace(prev => ({
      ...prev,
      [defaultWorkspace.id]: prev[defaultWorkspace.id] || []
    }));
    setActiveTabIdByWorkspace(prev => ({
      ...prev,
      [defaultWorkspace.id]: prev[defaultWorkspace.id] || null
    }));
    setActiveEnvIdByWorkspace(prev => ({
      ...prev,
      [defaultWorkspace.id]: prev[defaultWorkspace.id] || null
    }));
  }, [
    localDefaultWorkspaceId,
    setActiveEnvIdByWorkspace,
    setActiveTabIdByWorkspace,
    setActiveWorkspaceId,
    setTabsByWorkspace,
    setWorkspaces,
    tabsByWorkspace,
    userId,
    workspaces.length
  ]);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
  const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const collections = activeWorkspace?.collections || [];
  const environments = activeWorkspace?.environments || [];
  const activeEnvironmentId = activeEnvIdByWorkspace[activeWorkspaceId] || null;
  const activeEnvironment = environments.find(e => e.id === activeEnvironmentId);
  const globalVariables = currentWorkspace?.globalVariables || [];
  const currentTabs = tabsByWorkspace[activeWorkspaceId] || [];
  const activeTabId = activeTabIdByWorkspace[activeWorkspaceId] || (currentTabs.length > 0 ? currentTabs[0].id : null);
  const activeTab = currentTabs.find(t => t.id === activeTabId) || currentTabs[0];

  const updateWorkspaces = (updater: (prev: Workspace[]) => Workspace[]) => {
    setWorkspaces((prev) => {
      const next = updater(prev);
      const before = prev.find((workspace) => workspace.id === activeWorkspaceId);
      const after = next.find((workspace) => workspace.id === activeWorkspaceId);
      const beforeSignature = getSyncSignature(getWorkspaceSyncPayload(before || after!));
      const afterSignature = after ? getSyncSignature(getWorkspaceSyncPayload(after)) : beforeSignature;

      if (after && canSyncWorkspace(after, userId) && beforeSignature !== afterSignature) {
        dirtyWorkspaceIdsRef.current.add(after.id);
      }

      return next;
    });
  };

  const environmentActions = useEnvironmentActions({
    activeEnvironmentId,
    activeWorkspaceId,
    setActiveEnvIdByWorkspace,
    updateWorkspaces
  });

  const collectionActions = useCollectionActions({
    activeTab,
    activeWorkspaceId,
    setTabsByWorkspace,
    updateWorkspaces
  });

  const tabActions = useTabActions({
    activeTab,
    activeTabId,
    activeWorkspaceId,
    collections,
    currentTabs,
    currentWorkspace,
    lastSavedTabSnapshotsRef,
    saveRequest: collectionActions.saveRequest,
    setActiveTabIdByWorkspace,
    setTabsByWorkspace,
    updateCollection: collectionActions.updateCollection,
    updateFolder: collectionActions.updateFolder
  });

  const requestSender = useRequestSender({
    activeEnvironment,
    activeEnvironmentId,
    activeTab,
    collections,
    environments,
    globalVariables,
    updateActiveTab: tabActions.updateActiveTab,
    updateCollection: collectionActions.updateCollection,
    updateEnvironment: environmentActions.updateEnvironment,
    updateGlobalVariables: environmentActions.updateGlobalVariables
  });

  const { reloadWorkspaces } = useWorkspaceSync({
    activeWorkspaceId,
    deletedWorkspaceIdsRef,
    dirtyWorkspaceIdsRef,
    lastSyncedSignaturesRef,
    localDefaultWorkspaceId,
    setWorkspaces,
    syncingWorkspaceIdsRef,
    userId,
    workspaces
  });

  const createWorkspace = (name: string) => {
    const newWsId = crypto.randomUUID();
    dirtyWorkspaceIdsRef.current.add(newWsId);
    setWorkspaces(prev => [...prev, { id: newWsId, name, collections: [], environments: [] }]);
    setTabsByWorkspace(prev => ({ ...prev, [newWsId]: [] }));
    setActiveTabIdByWorkspace(prev => ({ ...prev, [newWsId]: null }));
    setActiveEnvIdByWorkspace(prev => ({ ...prev, [newWsId]: null }));
    setActiveWorkspaceId(newWsId);
  };

  const switchWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
  };

  const removeWorkspace = async (id: string) => {
    console.log('[SYNC] removeWorkspace called for id:', id);
    const nextWorkspaceId = workspaces.find((workspace) => workspace.id !== id)?.id || localDefaultWorkspaceId;
    deletedWorkspaceIdsRef.current.add(id);
    dirtyWorkspaceIdsRef.current.delete(id);
    syncingWorkspaceIdsRef.current.delete(id);
    delete lastSyncedSignaturesRef.current[id];

    try {
      console.log('[SYNC] Sending DELETE to backend for id:', id);
      await api.delete(`/workspaces/${id}`).catch((err) => {
        if (err.response?.status !== 404) throw err;
        console.log('[SYNC] DELETE returned 404, ignored');
      });
      console.log('[SYNC] DELETE successful or ignored 404');
    } catch (err) {
      console.error('[SYNC] DELETE failed:', err);
      deletedWorkspaceIdsRef.current.delete(id);
      throw err;
    }

    setWorkspaces((prev) => {
      const next = prev.filter((workspace) => workspace.id !== id);
      if (next.length > 0) return next;
      return [{ id: localDefaultWorkspaceId, name: 'My Workspace', ownerId: userId, collections: [], environments: [] }];
    });
    setTabsByWorkspace((prev) => {
      const { [id]: _removedTabs, ...rest } = prev;
      return rest;
    });
    setActiveTabIdByWorkspace((prev) => {
      const { [id]: _removedActiveTab, ...rest } = prev;
      return rest;
    });
    setActiveEnvIdByWorkspace((prev) => {
      const { [id]: _removedActiveEnv, ...rest } = prev;
      return rest;
    });

    if (activeWorkspaceId === id) setActiveWorkspaceId(nextWorkspaceId);
  };

  const createBlankRequestInFolder = (collectionId: string, folderId: string | null) => {
    const newReqId = crypto.randomUUID();
    const newReq: SavedRequest = {
      type: 'request',
      id: newReqId,
      name: 'New Request',
      method: 'GET',
      url: '',
      headers: [{ key: '', value: '' }],
      body: ''
    };
    collectionActions.saveRequest(collectionId, folderId, newReq);
    tabActions.addTab({ ...newReq, id: crypto.randomUUID(), savedRequestId: newReqId, collectionId, folderId: folderId || undefined, response: null });
  };

  useKeyboardShortcuts(activeTabId, tabActions.closeTab);

  return {
    workspaces,
    activeWorkspaceId,
    createWorkspace,
    switchWorkspace,
    removeWorkspace,
    tabs: currentTabs,
    activeTabId,
    activeTab,
    environments,
    activeEnvironmentId,
    activeEnvironment,
    globalVariables,
    ...environmentActions,
    reloadWorkspaces,
    openCollectionTab: tabActions.openCollectionTab,
    openFolderTab: tabActions.openFolderTab,
    openRequestTab: tabActions.openRequestTab,
    openExampleTab: tabActions.openExampleTab,
    updateActiveTab: tabActions.updateActiveTab,
    rememberTabSnapshot: tabActions.rememberTabSnapshot,
    findSavedRequestById: tabActions.findSavedRequestById,
    resolveTabSavedRequestId: tabActions.resolveTabSavedRequestId,
    isTabDirty: tabActions.isTabDirty,
    saveActiveRequestInPlace: tabActions.saveActiveRequestInPlace,
    collections,
    setActiveTabId: tabActions.setActiveTabId,
    addTab: tabActions.addTab,
    closeTab: tabActions.closeTab,
    ...collectionActions,
    createBlankRequestInFolder,
    ...requestSender,
  };
}
