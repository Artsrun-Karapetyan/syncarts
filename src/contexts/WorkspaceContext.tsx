import { invoke } from '@tauri-apps/api/core';
import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
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

interface WorkspaceContextState {
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
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
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
  const [tabs, setTabs] = useLocalStorage<TabData[]>('syncarts-tabs-v2', [
    {
      id: crypto.randomUUID(),
      name: 'Get All Posts',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts',
      headers: [{ key: '', value: '' }],
      body: '',
      response: null
    }
  ]);
  const [activeTabId, setActiveTabId] = useLocalStorage<string | null>('syncarts-active-tab-v2', tabs[0]?.id || null);
  const [collections, setCollections] = useLocalStorage<Collection[]>('syncarts-collections-v2', DEFAULT_COLLECTIONS);

  const activeTab = tabs.find(t => t.id === activeTabId);

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
      // Clear previous response before sending
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
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...data } : t));
  };

  const addTab = (data?: Partial<TabData>) => {
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
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (id: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      if (activeTabId === id) {
        setActiveTabId(newTabs[newTabs.length - 1]?.id || null);
      }
      if (newTabs.length === 0) {
        // Create an empty tab if all are closed
        const emptyTab: TabData = {
          id: crypto.randomUUID(),
          name: 'Untitled Request',
          method: 'GET',
          url: '',
          headers: [{ key: '', value: '' }],
          body: '',
          response: null
        };
        setActiveTabId(emptyTab.id);
        return [emptyTab];
      }
      return newTabs;
    });
  };

  const addCollection = (name: string) => {
    const newCollection: Collection = {
      id: crypto.randomUUID(),
      name,
      items: []
    };
    setCollections(prev => [...prev, newCollection]);
  };

  const addFolder = (collectionId: string, parentFolderId: string | null, name: string) => {
    const newFolder: Folder = { type: 'folder', id: crypto.randomUUID(), name, items: [] };
    
    setCollections(prev => {
      return prev.map(col => {
        if (col.id !== collectionId) return col;
        
        if (!parentFolderId) {
          return { ...col, items: [...col.items, newFolder] };
        }
        
        // Deep nested folder logic (we'll keep it simple for now and just append to root collection or implement a recursive finder)
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
    });
  };

  const saveRequest = (collectionId: string, folderId: string | null, request: SavedRequest) => {
    setCollections(prev => {
      return prev.map(col => {
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
    });
  };

  const createBlankRequestInFolder = (collectionId: string, folderId: string | null) => {
    const newReq: SavedRequest = {
      type: 'request',
      id: crypto.randomUUID(),
      name: 'New Request',
      method: 'GET',
      url: '',
      headers: [],
      body: ''
    };
    saveRequest(collectionId, folderId, newReq);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        tabs,
        activeTabId,
        activeTab,
        collections,
        setActiveTabId,
        addTab,
        closeTab,
        updateActiveTab,
        addCollection,
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
