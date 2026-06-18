import { useEffect } from "react";

import type {
  Collection,
  Folder,
  SavedRequest,
  SavedRequestLocation,
  TabData,
} from "../core/types";
import { createExampleTabData } from "./exampleTabData";
import { createSavedRequestTabUpdate } from "./savedRequestTabUpdate";
import { createTab } from "./tabFactory";
import {
  findSavedRequestByIdInCollections,
  requestSnapshot,
} from "./tabHelpers";
import { normalizeTabsWithSavedRequests } from "./tabSyncHelpers";
import { findExample, findFolder } from "./tabTreeFinders";
import { useRequestEntitySave } from "./useRequestEntitySave";
import type { TabActionsArgs } from "./useTabActionsTypes";

export function useTabActions(args: TabActionsArgs) {
  const {
    activeTab,
    activeTabId,
    activeWorkspaceId,
    collections,
    currentTabs,
    currentWorkspace,
    lastSavedTabSnapshotsRef,
    saveRequest,
    setActiveTabIdByWorkspace,
    setTabsByWorkspace,
    updateCollection,
    updateFolder,
  } = args;

  const updateCurrentTabs = (updater: (prev: TabData[]) => TabData[]) => {
    setTabsByWorkspace((prev) => ({
      ...prev,
      [activeWorkspaceId]: updater(prev[activeWorkspaceId] || []),
    }));
  };

  const findSavedRequestById = (
    requestId?: string,
  ): SavedRequestLocation | null => {
    return findSavedRequestByIdInCollections(collections, requestId);
  };

  const resolveTabSavedRequestId = (tab?: TabData) => {
    if (!tab || (tab.type && tab.type !== "request")) return undefined;
    if (tab.savedRequestId && findSavedRequestById(tab.savedRequestId))
      return tab.savedRequestId;
    if (findSavedRequestById(tab.id)) return tab.id;
    return undefined;
  };

  const rememberTabSnapshot = (tabId: string, request: Partial<TabData>) => {
    lastSavedTabSnapshotsRef.current[tabId] = requestSnapshot(request);
  };
  const { saveSavedRequestTab } = useRequestEntitySave({
    activeWorkspaceId,
    currentWorkspace,
    findSavedRequestById,
    rememberTabSnapshot,
    resolveTabSavedRequestId,
    saveRequest,
  });

  const isTabDirty = (tab?: TabData) => {
    if (!tab || (tab.type && tab.type !== "request")) return false;
    if (lastSavedTabSnapshotsRef.current[tab.id] === requestSnapshot(tab))
      return false;
    const savedRequestId = resolveTabSavedRequestId(tab);
    if (!savedRequestId) return true;
    const saved = findSavedRequestById(savedRequestId);
    if (!saved) return true;
    return requestSnapshot(saved.request) !== requestSnapshot(tab);
  };

  const updateActiveTab = (data: Partial<TabData>) => {
    if (!activeTabId) return;
    let currentTab: TabData | undefined;
    updateCurrentTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTabId) return t;
        const updated = { ...t, ...data };
        currentTab = updated;
        return updated;
      }),
    );

    const { collectionView, ...persistableData } = data;
    void collectionView;

    if (
      currentTab &&
      currentTab.type === "collection" &&
      currentTab.collectionId
    ) {
      updateCollection(
        currentTab.collectionId,
        persistableData as Partial<Collection>,
      );
    } else if (
      currentTab &&
      currentTab.type === "folder" &&
      currentTab.collectionId &&
      currentTab.folderId
    ) {
      updateFolder(
        currentTab.collectionId,
        currentTab.folderId,
        persistableData as Partial<Folder>,
      );
    }
  };

  const syncTabWithSavedRequest = (
    request: SavedRequest,
    collectionId: string,
    folderId: string | null,
    savedRequestId = request.id,
  ) => {
    updateActiveTab(
      createSavedRequestTabUpdate(
        request,
        collectionId,
        folderId,
        savedRequestId,
      ),
    );
  };

  const setActiveTabId = (id: string) => {
    setActiveTabIdByWorkspace((prev) => ({ ...prev, [activeWorkspaceId]: id }));
  };

  const addTab = (data?: Partial<TabData> & { savedRequestId?: string }) => {
    const newTab = createTab(data);
    if (newTab.savedRequestId) rememberTabSnapshot(newTab.id, newTab);
    updateCurrentTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (id: string) => {
    let closedIdWasActive = false;
    let newTabsToSet: TabData[] = [];

    updateCurrentTabs((prev) => {
      const newTabs = prev.filter((t) => t.id !== id);
      closedIdWasActive = activeTabId === id;
      newTabsToSet = newTabs;
      return newTabs;
    });

    if (closedIdWasActive) {
      setActiveTabIdByWorkspace((prev) => ({
        ...prev,
        [activeWorkspaceId]:
          newTabsToSet.length > 0
            ? newTabsToSet[newTabsToSet.length - 1].id
            : null,
      }));
    }
    delete lastSavedTabSnapshotsRef.current[id];
  };

  const openCollectionTab = (
    collectionId: string,
    view: TabData["collectionView"] = "overview",
  ) => {
    const col = currentWorkspace?.collections.find(
      (c) => c.id === collectionId,
    );
    if (!col) return;
    const existing = currentTabs.find(
      (t) => t.type === "collection" && t.collectionId === collectionId,
    );
    if (existing) {
      updateCurrentTabs((prev) =>
        prev.map((tab) =>
          tab.id === existing.id ? { ...tab, collectionView: view } : tab,
        ),
      );
      return setActiveTabId(existing.id);
    }

    addTab({
      type: "collection",
      name: col.name,
      collectionId,
      collectionView: view,
      authType: col.authType,
      bearerToken: col.bearerToken,
      preRequestScript: col.preRequestScript,
      testScript: col.testScript,
      variables: col.variables,
      description: col.description,
    });
  };

  const openFolderTab = (collectionId: string, folderId: string) => {
    const col = currentWorkspace?.collections.find(
      (c) => c.id === collectionId,
    );
    if (!col) return;
    const folder = findFolder(col.items, folderId);
    if (!folder) return;
    const existing = currentTabs.find(
      (t) => t.type === "folder" && t.folderId === folderId,
    );
    if (existing) return setActiveTabId(existing.id);

    addTab({
      type: "folder",
      name: folder.name,
      collectionId,
      folderId,
      authType: folder.authType,
      bearerToken: folder.bearerToken,
      preRequestScript: folder.preRequestScript,
      testScript: folder.testScript,
      description: folder.description,
    });
  };

  const openRequestTab = (
    collectionId: string,
    folderId: string | null,
    requestId: string,
  ) => {
    const saved = findSavedRequestById(requestId);
    if (!saved) return;
    const existing = currentTabs.find(
      (t) =>
        (t.type === "request" || !t.type) &&
        (t.savedRequestId === requestId || t.id === requestId),
    );
    if (existing) return setActiveTabId(existing.id);

    const tabId = crypto.randomUUID();
    addTab({
      ...saved.request,
      id: tabId,
      savedRequestId: requestId,
      collectionId,
      folderId: folderId || undefined,
      response: null,
    });
  };

  const openExampleTab = (collectionId: string, exampleId: string) => {
    const col = currentWorkspace?.collections.find(
      (c) => c.id === collectionId,
    );
    if (!col) return;
    const example = findExample(col.items, exampleId);
    if (!example) return;
    const existing = currentTabs.find(
      (t) => t.type === "example" && t.exampleId === exampleId,
    );
    if (existing) return setActiveTabId(existing.id);

    addTab(createExampleTabData(collectionId, example));
  };

  const saveActiveRequestInPlace = () => {
    if (!activeTab || (activeTab.type && activeTab.type !== "request"))
      return false;
    return saveRequestTabInPlace(activeTab);
  };

  function saveRequestTabInPlace(tab: TabData) {
    if (!tab || (tab.type && tab.type !== "request")) return false;
    const saved = saveSavedRequestTab(tab);
    if (!saved) return false;

    if (activeTab?.id === tab.id) {
      syncTabWithSavedRequest(
        saved.request,
        saved.collectionId,
        saved.folderId,
        saved.savedRequestId,
      );
    }
    return true;
  }

  useEffect(() => {
    if (currentTabs.length === 0) return;
    const { changed, normalizedTabs } = normalizeTabsWithSavedRequests({
      currentTabs,
      findSavedRequestById,
      lastSavedTabSnapshots: lastSavedTabSnapshotsRef.current,
    });

    if (!changed) return;
    setTabsByWorkspace((prev) => ({
      ...prev,
      [activeWorkspaceId]: normalizedTabs,
    }));
  }, [activeWorkspaceId, collections, currentTabs, setTabsByWorkspace]);

  return {
    addTab,
    closeTab,
    findSavedRequestById,
    isTabDirty,
    openCollectionTab,
    openExampleTab,
    openFolderTab,
    openRequestTab,
    rememberTabSnapshot,
    resolveTabSavedRequestId,
    saveActiveRequestInPlace,
    saveRequestTabInPlace,
    setActiveTabId,
    updateActiveTab,
    updateCurrentTabs,
  };
}
