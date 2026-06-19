import { useEffect, useRef, useState } from "react";

import { api } from "../../../lib/api";
import { useCollectionActions } from "../collections/useCollectionActions";
import { useCollectionMoveActions } from "../collections/useCollectionMoveActions";
import { useExampleActions } from "../collections/useExampleActions";
import { useEnvironmentActions } from "../environment/useEnvironmentActions";
import { useRequestSender } from "../requests/useRequestSender";
import {
  createDefaultActiveEnvByWorkspace,
  createDefaultActiveTabByWorkspace,
  createDefaultTabsByWorkspace,
  createDefaultWorkspaces,
} from "../storage/initializers";
import { useLocalStorage } from "../storage/useLocalStorage";
import {
  canSyncWorkspace,
  getSyncSignature,
  getWorkspaceSyncPayload,
} from "../sync/syncHelpers";
import { useLegacyWorkspaceMigration } from "../sync/useLegacyWorkspaceMigration";
import { useWorkspaceSync } from "../sync/useWorkspaceSync";
import { useTabActions } from "../tabs/useTabActions";
import type {
  HttpResponse,
  SavedRequest,
  TabData,
  Workspace,
  WorkspaceContextState,
} from "./types";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

export function useWorkspaceController(userId: string): WorkspaceContextState {
  const localDefaultWorkspaceId = `local-${userId}`;
  const [workspaces, setWorkspaces, workspacesHydrated] = useLocalStorage<
    Workspace[]
  >(
    `syncarts-workspaces-v3-${userId}`,
    createDefaultWorkspaces(userId, localDefaultWorkspaceId),
  );
  const [activeWorkspaceId, setActiveWorkspaceId, activeWorkspaceHydrated] =
    useLocalStorage<string>(
      `syncarts-active-workspace-v3-${userId}`,
      workspaces[0]?.id || localDefaultWorkspaceId,
    );
  const [tabsByWorkspace, setTabsByWorkspace, tabsHydrated] = useLocalStorage<
    Record<string, TabData[]>
  >(
    `syncarts-tabs-by-workspace-v3-${userId}`,
    createDefaultTabsByWorkspace(localDefaultWorkspaceId),
  );
  const [activeTabIdByWorkspace, setActiveTabIdByWorkspace, activeTabHydrated] =
    useLocalStorage<Record<string, string | null>>(
      `syncarts-active-tab-by-workspace-v3-${userId}`,
      createDefaultActiveTabByWorkspace(localDefaultWorkspaceId),
    );
  const [activeEnvIdByWorkspace, setActiveEnvIdByWorkspace, activeEnvHydrated] =
    useLocalStorage<Record<string, string | null>>(
      `syncarts-active-env-by-workspace-v3-${userId}`,
      createDefaultActiveEnvByWorkspace(localDefaultWorkspaceId),
    );

  const [responseCache, setResponseCache] = useState<
    Record<string, HttpResponse>
  >({});
  const updateResponseCache = (id: string, response: HttpResponse) => {
    setResponseCache((prev) => ({ ...prev, [id]: response }));
  };

  const storageHydrated =
    workspacesHydrated &&
    activeWorkspaceHydrated &&
    tabsHydrated &&
    activeTabHydrated &&
    activeEnvHydrated;

  const dirtyWorkspaceIdsRef = useRef<Set<string>>(new Set());
  const syncingWorkspaceIdsRef = useRef<Set<string>>(new Set());
  const deletedWorkspaceIdsRef = useRef<Set<string>>(new Set());
  const lastSyncedSignaturesRef = useRef<Record<string, string>>({});
  const lastSavedTabSnapshotsRef = useRef<Record<string, string>>({});

  useLegacyWorkspaceMigration({
    activeWorkspaceId,
    localDefaultWorkspaceId,
    storageHydrated,
    setActiveEnvIdByWorkspace,
    setActiveTabIdByWorkspace,
    setActiveWorkspaceId,
    setTabsByWorkspace,
    setWorkspaces,
    userId,
    workspaces,
  });

  useEffect(() => {
    if (!storageHydrated) return;
    if (workspaces.length > 0) return;
    const defaultWorkspace = createDefaultWorkspaces(
      userId,
      localDefaultWorkspaceId,
    )[0];

    setWorkspaces([defaultWorkspace]);
    setActiveWorkspaceId(defaultWorkspace.id);
    setTabsByWorkspace((prev) => ({
      ...prev,
      [defaultWorkspace.id]: prev[defaultWorkspace.id] || [],
    }));
    setActiveTabIdByWorkspace((prev) => ({
      ...prev,
      [defaultWorkspace.id]: prev[defaultWorkspace.id] || null,
    }));
    setActiveEnvIdByWorkspace((prev) => ({
      ...prev,
      [defaultWorkspace.id]: prev[defaultWorkspace.id] || null,
    }));
  }, [
    localDefaultWorkspaceId,
    setActiveEnvIdByWorkspace,
    setActiveTabIdByWorkspace,
    setActiveWorkspaceId,
    setTabsByWorkspace,
    setWorkspaces,
    storageHydrated,
    tabsByWorkspace,
    userId,
    workspaces.length,
  ]);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const collections = activeWorkspace?.collections || [];
  const environments = activeWorkspace?.environments || [];
  const activeEnvironmentId = activeEnvIdByWorkspace[activeWorkspaceId] || null;
  const activeEnvironment = environments.find(
    (e) => e.id === activeEnvironmentId,
  );
  const globalVariables = currentWorkspace?.globalVariables || [];
  const currentTabs = tabsByWorkspace[activeWorkspaceId] || [];
  const activeTabId =
    activeTabIdByWorkspace[activeWorkspaceId] ||
    (currentTabs.length > 0 ? currentTabs[0].id : null);
  const activeTab =
    currentTabs.find((t) => t.id === activeTabId) || currentTabs[0];

  const updateWorkspaces = (updater: (prev: Workspace[]) => Workspace[]) => {
    setWorkspaces((prev) => {
      const next = updater(prev);
      const before = prev.find(
        (workspace) => workspace.id === activeWorkspaceId,
      );
      const after = next.find(
        (workspace) => workspace.id === activeWorkspaceId,
      );
      const beforeSignature = getSyncSignature(
        getWorkspaceSyncPayload(before || after!),
      );
      const afterSignature = after
        ? getSyncSignature(getWorkspaceSyncPayload(after))
        : beforeSignature;

      if (
        after &&
        canSyncWorkspace(after, userId) &&
        beforeSignature !== afterSignature
      ) {
        dirtyWorkspaceIdsRef.current.add(after.id);
      }

      return next;
    });
  };
  const updateWorkspacesLocal = (
    updater: (prev: Workspace[]) => Workspace[],
  ) => {
    setWorkspaces(updater);
  };

  const environmentActions = useEnvironmentActions({
    activeEnvironmentId,
    activeWorkspaceId,
    setActiveEnvIdByWorkspace,
    updateWorkspaces,
  });

  const collectionActions = useCollectionActions({
    activeWorkspaceId,
    localDefaultWorkspaceId,
    workspaces,
    setTabsByWorkspace,
    updateWorkspaces,
    updateWorkspacesLocal,
  });
  const collectionMoveActions = useCollectionMoveActions({
    activeWorkspaceId,
    updateWorkspaces,
  });

  const exampleActions = useExampleActions({
    activeTab,
    activeWorkspaceId,
    updateWorkspaces,
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
    updateFolder: collectionActions.updateFolder,
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
    updateFolder: collectionActions.updateFolder,
    updateEnvironment: environmentActions.updateEnvironment,
    updateGlobalVariables: environmentActions.updateGlobalVariables,
    updateResponseCache,
    responseCache,
  });

  const { reloadWorkspaces } = useWorkspaceSync({
    activeWorkspaceId,
    deletedWorkspaceIdsRef,
    dirtyWorkspaceIdsRef,
    lastSyncedSignaturesRef,
    localDefaultWorkspaceId,
    setWorkspaces,
    storageHydrated,
    syncingWorkspaceIdsRef,
    userId,
    workspaces,
  });

  const createWorkspace = (
    name: string,
    collections: any[] = [],
    environments: any[] = [],
  ) => {
    const newWsId = crypto.randomUUID();
    dirtyWorkspaceIdsRef.current.add(newWsId);
    setWorkspaces((prev) => [
      ...prev,
      { id: newWsId, name, collections, environments },
    ]);
    setTabsByWorkspace((prev) => ({ ...prev, [newWsId]: [] }));
    setActiveTabIdByWorkspace((prev) => ({ ...prev, [newWsId]: null }));
    setActiveEnvIdByWorkspace((prev) => ({ ...prev, [newWsId]: null }));
    setActiveWorkspaceId(newWsId);
    return newWsId;
  };

  const switchWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
  };

  const renameWorkspace = (id: string, newName: string) => {
    if (id === localDefaultWorkspaceId) {
      throw new Error("Cannot rename your default workspace.");
    }
    dirtyWorkspaceIdsRef.current.add(id);
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, name: newName } : w)),
    );
  };

  const removeWorkspace = async (id: string) => {
    if (id === localDefaultWorkspaceId) {
      throw new Error("Cannot delete your default workspace.");
    }
    const nextWorkspaceId =
      workspaces.find((workspace) => workspace.id !== id)?.id ||
      localDefaultWorkspaceId;
    deletedWorkspaceIdsRef.current.add(id);
    dirtyWorkspaceIdsRef.current.delete(id);
    syncingWorkspaceIdsRef.current.delete(id);
    delete lastSyncedSignaturesRef.current[id];

    try {
      await api.delete(`/workspaces/${id}`).catch((err) => {
        if (err.response?.status !== 404) throw err;
      });
    } catch (err) {
      console.error("[SYNC] DELETE failed:", err);
      deletedWorkspaceIdsRef.current.delete(id);
      throw err;
    }

    setWorkspaces((prev) => {
      const next = prev.filter((workspace) => workspace.id !== id);
      if (next.length > 0) return next;
      return [
        {
          id: localDefaultWorkspaceId,
          name: "My Workspace",
          ownerId: userId,
          collections: [],
          environments: [],
        },
      ];
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

  const createBlankRequestInFolder = (
    collectionId: string,
    folderId: string | null,
  ) => {
    const newReqId = crypto.randomUUID();
    const newReq: SavedRequest = {
      type: "request",
      id: newReqId,
      name: "New Request",
      method: "GET",
      url: "",
      headers: [{ key: "", value: "", enabled: true }],
      queryParams: [],
      body: "",
    };
    collectionActions.saveRequest(collectionId, folderId, newReq);
    tabActions.addTab({
      ...newReq,
      id: crypto.randomUUID(),
      savedRequestId: newReqId,
      collectionId,
      folderId: folderId || undefined,
      response: null,
    });
  };

  useKeyboardShortcuts({
    addTab: tabActions.addTab,
    activeTabPinned: activeTab?.pinned,
    closeTab: tabActions.closeTab,
    activeTabId,
  });

  return {
    workspaces,
    activeWorkspaceId,
    localDefaultWorkspaceId,
    createWorkspace,
    switchWorkspace,
    renameWorkspace,
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
    ...tabActions,
    collections,
    ...collectionActions,
    ...collectionMoveActions,
    ...exampleActions,
    createBlankRequestInFolder,
    ...requestSender,
    responseCache,
    updateResponseCache,
    userId,
  };
}
