import { invoke } from '@tauri-apps/api/core';
import { createContext, ReactNode, useContext, useState } from 'react';
import useSWRMutation from 'swr/mutation';

export interface HeaderItem {
  key: string;
  value: string;
}

export interface HttpResponse {
  status: number;
  status_text: string;
  headers: Record<string, string>;
  body: string;
  time_ms: number;
}

export interface TabData {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: HeaderItem[];
  body: string;
  response: HttpResponse | null;
  savedRequestId?: string;
}

export interface SavedRequest {
  type: 'request';
  id: string;
  name: string;
  method: string;
  url: string;
  headers: HeaderItem[];
  body: string;
}

export interface Folder {
  type: 'folder';
  id: string;
  name: string;
  items: (Folder | SavedRequest)[];
}

export interface Collection {
  id: string;
  name: string;
  items: (Folder | SavedRequest)[];
}

export interface Workspace {
  id: string;
  name: string;
  collections: Collection[];
}

interface WorkspaceContextState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  
  // Workspace Actions
  createWorkspace: (name: string) => void;
  switchWorkspace: (id: string) => void;

  tabs: TabData[];
  activeTabId: string | null;
  activeTab: TabData | undefined;
  collections: Collection[];
  
  // Tab Actions
  setActiveTabId: (id: string) => void;
  addTab: (data?: Partial<TabData>) => void;
  closeTab: (id: string) => void;
  updateActiveTab: (data: Partial<TabData>) => void;
  
  // Collection Actions
  addCollection: (name: string) => void;
  deleteCollection: (id: string) => void;
  addFolder: (collectionId: string, parentFolderId: string | null, name: string) => void;
  saveRequest: (collectionId: string, folderId: string | null, request: SavedRequest) => void;
  createBlankRequestInFolder: (collectionId: string, folderId: string | null) => void;
  
  // Request Actions
  sendRequest: () => Promise<void>;
  isMutating: boolean;
  error: unknown;
}

const WorkspaceContext = createContext<WorkspaceContextState | undefined>(undefined);

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      setStoredValue(prev => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue] as const;
}

const DEFAULT_COLLECTIONS: Collection[] = [
  {
    id: 'col-1',
    name: 'JSONPlaceholder API',
    items: [
      {
        type: 'folder',
        id: 'folder-1',
        name: 'Posts',
        items: [
          {
            type: 'request',
            id: 'req-1',
            name: 'Get All Posts',
            method: 'GET',
            url: 'https://jsonplaceholder.typicode.com/posts',
            headers: [],
            body: ''
          },
          {
            type: 'request',
            id: 'req-2',
            name: 'Create Post',
            method: 'POST',
            url: 'https://jsonplaceholder.typicode.com/posts',
            headers: [{ key: 'Content-type', value: 'application/json; charset=UTF-8' }],
            body: '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}'
          }
        ]
      },
      {
        type: 'request',
        id: 'req-3',
        name: 'Get Users',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/users',
        headers: [],
        body: ''
      }
    ]
  }
];

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  // Initialize workspaces, migrating from v2 collections if necessary
  const defaultWorkspaces = (() => {
    try {
      const oldCollectionsItem = window.localStorage.getItem('syncarts-collections-v2');
      if (oldCollectionsItem) {
        const oldCollections = JSON.parse(oldCollectionsItem);
        return [{ id: 'default', name: 'My Workspace', collections: oldCollections }];
      }
    } catch (e) {}
    return [{ id: 'default', name: 'My Workspace', collections: DEFAULT_COLLECTIONS }];
  })();

  const [workspaces, setWorkspaces] = useLocalStorage<Workspace[]>('syncarts-workspaces-v3', defaultWorkspaces);

  const [activeWorkspaceId, setActiveWorkspaceId] = useLocalStorage<string>('syncarts-active-workspace-v3', workspaces[0]?.id || 'default');

  // We store a mapping of workspaceId -> tabs
  const defaultTabsByWorkspace = (() => {
    try {
      const oldTabsItem = window.localStorage.getItem('syncarts-tabs-v2');
      if (oldTabsItem) {
        const oldTabs = JSON.parse(oldTabsItem);
        return { 'default': oldTabs };
      }
    } catch (e) {}
    return {
      'default': [
        {
          id: crypto.randomUUID(),
          name: 'Untitled Request',
          method: 'GET',
          url: '',
          headers: [{ key: '', value: '' }],
          body: '',
          response: null
        }
      ]
    };
  })();

  const [tabsByWorkspace, setTabsByWorkspace] = useLocalStorage<Record<string, TabData[]>>('syncarts-tabs-by-workspace-v3', defaultTabsByWorkspace);

  const defaultActiveTabIdByWorkspace = (() => {
    try {
      const oldActiveTabItem = window.localStorage.getItem('syncarts-active-tab-v2');
      if (oldActiveTabItem) {
        const oldActiveTab = JSON.parse(oldActiveTabItem);
        return { 'default': oldActiveTab };
      }
    } catch(e) {}
    return { 'default': null };
  })();

  const [activeTabIdByWorkspace, setActiveTabIdByWorkspace] = useLocalStorage<Record<string, string | null>>('syncarts-active-tab-by-workspace-v3', defaultActiveTabIdByWorkspace);

  // Current workspace projections
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
  const collections = activeWorkspace?.collections || [];
  
  // Tabs projection
  const currentTabs = tabsByWorkspace[activeWorkspaceId] || [];
  const activeTabId = activeTabIdByWorkspace[activeWorkspaceId] || (currentTabs.length > 0 ? currentTabs[0].id : null);
  const activeTab = currentTabs.find(t => t.id === activeTabId) || currentTabs[0];

  const updateWorkspaces = (updater: (prev: Workspace[]) => Workspace[]) => {
    setWorkspaces(updater);
  };

  const updateCurrentTabs = (updater: (prev: TabData[]) => TabData[]) => {
    setTabsByWorkspace(prev => ({
      ...prev,
      [activeWorkspaceId]: updater(prev[activeWorkspaceId] || [])
    }));
  };

  const createWorkspace = (name: string) => {
    const newWsId = crypto.randomUUID();
    setWorkspaces(prev => [...prev, { id: newWsId, name, collections: [] }]);
    
    // Initialize tabs for new workspace
    const newTabId = crypto.randomUUID();
    setTabsByWorkspace(prev => ({
      ...prev,
      [newWsId]: [{
        id: newTabId,
        name: 'Untitled Request',
        method: 'GET',
        url: '',
        headers: [{ key: '', value: '' }],
        body: '',
        response: null
      }]
    }));
    setActiveTabIdByWorkspace(prev => ({ ...prev, [newWsId]: newTabId }));
    setActiveWorkspaceId(newWsId);
  };

  const switchWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
  };

  const { trigger, isMutating, error } = useSWRMutation(
    'api-request',
    async () => {
      if (!activeTab) return null;
      
      const headerMap: Record<string, string> = {};
      activeTab.headers.forEach((h) => {
        if (h.key && h.value) headerMap[h.key] = h.value;
      });

      const reqPayload = {
        url: activeTab.url,
        method: activeTab.method,
        headers: headerMap,
        body: activeTab.body.trim() === '' ? null : activeTab.body,
      };

      const res: HttpResponse = await invoke('make_request', { request: reqPayload });
      return res;
    }
  );

  const sendRequest = async () => {
    if (!activeTab) return;
    try {
      updateActiveTab({ response: null });
      const result = await trigger();
      if (result) {
        updateActiveTab({ response: result });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateActiveTab = (data: Partial<TabData>) => {
    if (!activeTabId) return;
    updateCurrentTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...data } : t));
  };

  const setActiveTabId = (id: string) => {
    setActiveTabIdByWorkspace(prev => ({ ...prev, [activeWorkspaceId]: id }));
  };

  const addTab = (data?: Partial<TabData> & { savedRequestId?: string }) => {
    const newTab: TabData = {
      id: crypto.randomUUID(),
      name: 'Untitled Request',
      method: 'GET',
      url: '',
      headers: [{ key: '', value: '' }],
      body: '',
      response: null,
      ...data
    };
    if (!newTab.savedRequestId && data?.id && data.id !== newTab.id) {
       newTab.savedRequestId = data.id;
    }
    updateCurrentTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (id: string) => {
    let closedIdWasActive = false;
    let newTabsToSet: TabData[] = [];
    
    updateCurrentTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      closedIdWasActive = activeTabId === id;
      
      if (newTabs.length === 0) {
        const emptyTab: TabData = {
          id: crypto.randomUUID(),
          name: 'Untitled Request',
          method: 'GET',
          url: '',
          headers: [{ key: '', value: '' }],
          body: '',
          response: null
        };
        newTabsToSet = [emptyTab];
        return [emptyTab];
      }
      newTabsToSet = newTabs;
      return newTabs;
    });

    if (closedIdWasActive && newTabsToSet.length > 0) {
      setActiveTabId(newTabsToSet[newTabsToSet.length - 1].id);
    }
  };

  const addCollection = (name: string) => {
    const newCollection: Collection = { id: crypto.randomUUID(), name, items: [] };
    updateWorkspaces(prev => prev.map(w => w.id === activeWorkspaceId ? { ...w, collections: [...w.collections, newCollection] } : w));
  };

  const deleteCollection = (id: string) => {
    updateWorkspaces(prev => prev.map(w => 
      w.id === activeWorkspaceId ? { ...w, collections: w.collections.filter(c => c.id !== id) } : w
    ));
  };

  const addFolder = (collectionId: string, parentFolderId: string | null, name: string) => {
    const newFolder: Folder = { type: 'folder', id: crypto.randomUUID(), name, items: [] };
    
    updateWorkspaces(prev => prev.map(w => {
      if (w.id !== activeWorkspaceId) return w;
      
      const updatedCollections = w.collections.map(col => {
        if (col.id !== collectionId) return col;
        
        if (!parentFolderId) {
          return { ...col, items: [...col.items, newFolder] };
        }
        
        const recursivelyAddFolder = (items: (Folder | SavedRequest)[]): (Folder | SavedRequest)[] => {
          return items.map(item => {
            if (item.type === 'folder') {
              if (item.id === parentFolderId) {
                return { ...item, items: [...item.items, newFolder] };
              }
              return { ...item, items: recursivelyAddFolder(item.items) };
            }
            return item;
          });
        };
        
        return { ...col, items: recursivelyAddFolder(col.items) };
      });
      return { ...w, collections: updatedCollections };
    }));
  };

  const saveRequest = (collectionId: string, folderId: string | null, request: SavedRequest) => {
    updateWorkspaces(prev => prev.map(w => {
      if (w.id !== activeWorkspaceId) return w;
      
      const removeRequest = (items: (Folder | SavedRequest)[]): (Folder | SavedRequest)[] => {
        return items.filter(item => {
          if (item.type === 'request' && item.id === request.id) return false;
          return true;
        }).map(item => {
          if (item.type === 'folder') return { ...item, items: removeRequest(item.items) };
          return item;
        });
      };
      
      let newCollections = w.collections.map(col => ({ ...col, items: removeRequest(col.items) }));

      newCollections = newCollections.map(col => {
        if (col.id !== collectionId) return col;
        
        if (!folderId) {
          return { ...col, items: [...col.items, request] };
        }
        
        const recursivelyAddRequest = (items: (Folder | SavedRequest)[]): (Folder | SavedRequest)[] => {
          return items.map(item => {
            if (item.type === 'folder') {
              if (item.id === folderId) {
                return { ...item, items: [...item.items, request] };
              }
              return { ...item, items: recursivelyAddRequest(item.items) };
            }
            return item;
          });
        };
        
        return { ...col, items: recursivelyAddRequest(col.items) };
      });

      return { ...w, collections: newCollections };
    }));
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
    saveRequest(collectionId, folderId, newReq);
    addTab({ ...newReq, id: crypto.randomUUID(), savedRequestId: newReqId, response: null });
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspaceId,
        createWorkspace,
        switchWorkspace,
        
        tabs: currentTabs,
        activeTabId,
        activeTab,
        collections,
        
        setActiveTabId,
        addTab,
        closeTab,
        updateActiveTab,
        
        addCollection,
        deleteCollection,
        addFolder,
        saveRequest,
        createBlankRequestInFolder,
        
        sendRequest,
        isMutating,
        error,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
}
