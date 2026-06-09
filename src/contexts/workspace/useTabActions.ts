import { useEffect } from 'react';
import { buildSavedRequestFromTab, findSavedRequestByIdInCollections, requestSnapshot } from './tabHelpers';
import type { Collection, Folder, SavedExample, SavedRequest, SavedRequestLocation, TabData, Workspace } from './types';

interface TabActionsArgs {
  activeTab: TabData | undefined;
  activeTabId: string | null;
  activeWorkspaceId: string;
  collections: Collection[];
  currentTabs: TabData[];
  currentWorkspace: Workspace | undefined;
  lastSavedTabSnapshotsRef: React.MutableRefObject<Record<string, string>>;
  saveRequest: (collectionId: string, folderId: string | null, request: SavedRequest) => void;
  setActiveTabIdByWorkspace: (value: Record<string, string | null> | ((prev: Record<string, string | null>) => Record<string, string | null>)) => void;
  setTabsByWorkspace: (value: Record<string, TabData[]> | ((prev: Record<string, TabData[]>) => Record<string, TabData[]>)) => void;
  updateCollection: (id: string, data: Partial<Collection>) => void;
  updateFolder: (collectionId: string, folderId: string, data: Partial<Folder>) => void;
}

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
    updateFolder
  } = args;

  const updateCurrentTabs = (updater: (prev: TabData[]) => TabData[]) => {
    setTabsByWorkspace(prev => ({ ...prev, [activeWorkspaceId]: updater(prev[activeWorkspaceId] || []) }));
  };

  const findSavedRequestById = (requestId?: string): SavedRequestLocation | null => {
    return findSavedRequestByIdInCollections(collections, requestId);
  };

  const resolveTabSavedRequestId = (tab?: TabData) => {
    if (!tab || (tab.type && tab.type !== 'request')) return undefined;
    if (tab.savedRequestId && findSavedRequestById(tab.savedRequestId)) return tab.savedRequestId;
    if (findSavedRequestById(tab.id)) return tab.id;
    return undefined;
  };

  const rememberTabSnapshot = (tabId: string, request: Partial<TabData>) => {
    lastSavedTabSnapshotsRef.current[tabId] = requestSnapshot(request);
  };

  const isTabDirty = (tab?: TabData) => {
    if (!tab || (tab.type && tab.type !== 'request')) return false;
    if (lastSavedTabSnapshotsRef.current[tab.id] === requestSnapshot(tab)) return false;
    const savedRequestId = resolveTabSavedRequestId(tab);
    if (!savedRequestId) return true;
    const saved = findSavedRequestById(savedRequestId);
    if (!saved) return true;
    return requestSnapshot(saved.request) !== requestSnapshot(tab);
  };

  const updateActiveTab = (data: Partial<TabData>) => {
    if (!activeTabId) return;
    let currentTab: TabData | undefined;
    updateCurrentTabs(prev => prev.map(t => {
      if (t.id !== activeTabId) return t;
      const updated = { ...t, ...data };
      currentTab = updated;
      return updated;
    }));

    const { collectionView, ...persistableData } = data;
    void collectionView;

    if (currentTab && currentTab.type === 'collection' && currentTab.collectionId) {
      updateCollection(currentTab.collectionId, persistableData as Partial<Collection>);
    } else if (currentTab && currentTab.type === 'folder' && currentTab.collectionId && currentTab.folderId) {
      updateFolder(currentTab.collectionId, currentTab.folderId, persistableData as Partial<Folder>);
    }
  };

  const syncTabWithSavedRequest = (
    request: SavedRequest,
    collectionId: string,
    folderId: string | null,
    savedRequestId = request.id
  ) => {
    updateActiveTab({
      name: request.name,
      method: request.method,
      url: request.url,
      headers: request.headers,
      authType: request.authType,
      bearerToken: request.bearerToken,
      bodyType: request.bodyType,
      formData: request.formData,
      description: request.description,
      preRequestScript: request.preRequestScript,
      testScript: request.testScript,
      body: request.body,
      collectionId,
      folderId: folderId || undefined,
      savedRequestId,
    });
  };

  const setActiveTabId = (id: string) => {
    setActiveTabIdByWorkspace(prev => ({ ...prev, [activeWorkspaceId]: id }));
  };

  const addTab = (data?: Partial<TabData> & { savedRequestId?: string }) => {
    const isReq = !data?.type || data.type === 'request';
    const newTab: TabData = {
      id: crypto.randomUUID(),
      type: data?.type || 'request',
      name: data?.name || 'Untitled Request',
      method: isReq ? 'GET' : '',
      url: isReq ? '' : '',
      headers: isReq ? [{ key: '', value: '' }] : [],
      bodyType: isReq ? 'raw' : undefined,
      formData: isReq ? [{ id: crypto.randomUUID(), key: '', value: '', enabled: true, type: 'text' }] : undefined,
      body: isReq ? '' : '',
      description: '',
      preRequestScript: '',
      testScript: '',
      response: null,
      ...data
    };
    if (!newTab.savedRequestId && data?.id && data.id !== newTab.id) newTab.savedRequestId = data.id;
    if (newTab.savedRequestId) rememberTabSnapshot(newTab.id, newTab);
    updateCurrentTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (id: string) => {
    let closedIdWasActive = false;
    let newTabsToSet: TabData[] = [];

    updateCurrentTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      closedIdWasActive = activeTabId === id;
      newTabsToSet = newTabs;
      return newTabs;
    });

    if (closedIdWasActive) {
      setActiveTabIdByWorkspace(prev => ({
        ...prev,
        [activeWorkspaceId]: newTabsToSet.length > 0 ? newTabsToSet[newTabsToSet.length - 1].id : null
      }));
    }
    delete lastSavedTabSnapshotsRef.current[id];
  };

  const openCollectionTab = (collectionId: string, view: TabData['collectionView'] = 'overview') => {
    const col = currentWorkspace?.collections.find(c => c.id === collectionId);
    if (!col) return;
    const existing = currentTabs.find(t => t.type === 'collection' && t.collectionId === collectionId);
    if (existing) {
      updateCurrentTabs(prev => prev.map(tab => tab.id === existing.id ? { ...tab, collectionView: view } : tab));
      return setActiveTabId(existing.id);
    }

    addTab({
      type: 'collection',
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
    const col = currentWorkspace?.collections.find(c => c.id === collectionId);
    if (!col) return;
    const folder = findFolder(col.items, folderId);
    if (!folder) return;
    const existing = currentTabs.find(t => t.type === 'folder' && t.folderId === folderId);
    if (existing) return setActiveTabId(existing.id);

    addTab({
      type: 'folder',
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

  const openRequestTab = (collectionId: string, folderId: string | null, requestId: string) => {
    const saved = findSavedRequestById(requestId);
    if (!saved) return;
    const existing = currentTabs.find(t => (t.type === 'request' || !t.type) && (t.savedRequestId === requestId || t.id === requestId));
    if (existing) return setActiveTabId(existing.id);

    const tabId = crypto.randomUUID();
    addTab({
      ...saved.request,
      id: tabId,
      savedRequestId: requestId,
      collectionId,
      folderId: folderId || undefined,
      response: null
    });
  };

  const openExampleTab = (collectionId: string, exampleId: string) => {
    const col = currentWorkspace?.collections.find(c => c.id === collectionId);
    if (!col) return;
    const example = findExample(col.items, exampleId);
    if (!example) return;
    const existing = currentTabs.find(t => t.type === 'example' && t.exampleId === exampleId);
    if (existing) return setActiveTabId(existing.id);

    addTab({
      type: 'example',
      name: example.name,
      collectionId,
      exampleId,
      method: example.originalRequest?.method || 'GET',
      url: example.originalRequest?.url || '',
      body: example.originalRequest?.body || '',
      bodyType: example.originalRequest?.bodyType || 'none',
      formData: example.originalRequest?.formData,
      headers: example.originalRequest?.headers || [],
      response: {
        status: example.code,
        status_text: example.status,
        headers: example.headers.reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}),
        body: example.body,
        time_ms: 0
      }
    });
  };

  const saveActiveRequestInPlace = () => {
    if (!activeTab || (activeTab.type && activeTab.type !== 'request')) return false;
    const savedRequestId = resolveTabSavedRequestId(activeTab);
    if (!savedRequestId) return false;
    const saved = findSavedRequestById(savedRequestId);
    if (!saved) return false;

    const updatedRequest = buildSavedRequestFromTab(activeTab, savedRequestId, saved.request);
    rememberTabSnapshot(activeTab.id, updatedRequest);
    saveRequest(saved.collectionId, saved.folderId, updatedRequest);
    syncTabWithSavedRequest(updatedRequest, saved.collectionId, saved.folderId, savedRequestId);
    return true;
  };

  useEffect(() => {
    if (currentTabs.length === 0) return;
    let changed = false;
    const normalizedTabs = currentTabs.map((tab) => {
      if (tab.type && tab.type !== 'request') return tab;
      const requestId = tab.savedRequestId || tab.id;
      const saved = findSavedRequestById(requestId);
      if (!saved) return tab;
      const savedSnapshot = requestSnapshot(saved.request);
      const tabSnapshot = requestSnapshot(tab);
      const baselineSnapshot = lastSavedTabSnapshotsRef.current[tab.id] || tabSnapshot;
      lastSavedTabSnapshotsRef.current[tab.id] = baselineSnapshot;

      if (tabSnapshot !== baselineSnapshot) return tab;
      if (tab.savedRequestId && savedSnapshot === baselineSnapshot) return tab;

      changed = true;
      lastSavedTabSnapshotsRef.current[tab.id] = savedSnapshot;
      return {
        ...tab,
        ...saved.request,
        id: tab.id,
        type: 'request' as const,
        savedRequestId: requestId,
        collectionId: saved.collectionId,
        folderId: saved.folderId || undefined,
        response: tab.response,
        testResults: tab.testResults,
        consoleLogs: tab.consoleLogs
      };
    });

    if (!changed) return;
    setTabsByWorkspace(prev => ({ ...prev, [activeWorkspaceId]: normalizedTabs }));
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
    setActiveTabId,
    updateActiveTab,
    updateCurrentTabs
  };
}

function findFolder(items: (Folder | SavedRequest)[], folderId: string): Folder | null {
  for (const item of items) {
    if (item.type === 'folder') {
      if (item.id === folderId) return item;
      const found = findFolder(item.items, folderId);
      if (found) return found;
    }
  }
  return null;
}

function findExample(items: (Folder | SavedRequest)[], exampleId: string): SavedExample | null {
  for (const item of items) {
    if (item.type === 'folder') {
      const found = findExample(item.items, exampleId);
      if (found) return found;
    } else if (item.examples) {
      const found = item.examples.find((e) => e.id === exampleId);
      if (found) return found;
    }
  }
  return null;
}
