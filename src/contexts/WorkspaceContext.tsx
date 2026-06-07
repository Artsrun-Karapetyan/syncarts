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

export type BodyType = 'none' | 'form-data' | 'x-www-form-urlencoded' | 'raw';

export interface FormDataItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  type?: 'text' | 'file';
}

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface TabData {
  id: string;
  type?: 'request' | 'collection' | 'folder';
  name: string;
  method: string;
  url: string;
  headers: HeaderItem[];
  authType?: 'inherit' | 'none' | 'bearer';
  bodyType?: BodyType;
  testScript?: string;
  formData?: FormDataItem[];
  body: string;
  response: HttpResponse | null;
  savedRequestId?: string;
  testResults?: TestResult[];
  consoleLogs?: string[];
  collectionId?: string;
  folderId?: string;
}

export interface SavedRequest {
  type: 'request';
  id: string;
  name: string;
  method: string;
  url: string;
  headers: HeaderItem[];
  authType?: 'inherit' | 'none' | 'bearer';
  bodyType?: BodyType;
  formData?: FormDataItem[];
  body: string;
  testScript?: string;
}

export interface Folder {
  type: 'folder';
  id: string;
  name: string;
  items: (Folder | SavedRequest)[];
  authType?: 'inherit' | 'none' | 'bearer';
  testScript?: string;
}

export interface Collection {
  id: string;
  name: string;
  items: (Folder | SavedRequest)[];
  authType?: 'inherit' | 'none' | 'bearer';
  testScript?: string;
  variables?: EnvironmentVariable[];
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
}

export interface Workspace {
  id: string;
  name: string;
  collections: Collection[];
  environments?: Environment[];
  globalVariables?: EnvironmentVariable[];
}

interface WorkspaceContextState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  
  // Workspace Actions
  createWorkspace: (name: string) => void;
  switchWorkspace: (id: string) => void;

  // Environment State
  environments: Environment[];
  globalVariables: EnvironmentVariable[];
  activeEnvironmentId: string | null;
  activeEnvironment: Environment | undefined;
  
  // Environment Actions
  setActiveEnvironmentId: (id: string | null) => void;
  createEnvironment: (name: string) => void;
  updateEnvironment: (id: string, data: Partial<Environment>) => void;
  deleteEnvironment: (id: string) => void;
  updateGlobalVariables: (variables: EnvironmentVariable[]) => void;

  tabs: TabData[];
  activeTabId: string | null;
  activeTab: TabData | undefined;
  collections: Collection[];
  
  // Tab Actions
  setActiveTabId: (id: string) => void;
  addTab: (data?: Partial<TabData> & { savedRequestId?: string }) => void;
  closeTab: (id: string) => void;
  openCollectionTab: (collectionId: string) => void;
  openFolderTab: (collectionId: string, folderId: string) => void;
  updateActiveTab: (data: Partial<TabData>) => void;
  
  // Collection Actions
  addCollection: (name: string) => void;
  deleteCollection: (id: string) => void;
  deleteItem: (collectionId: string, itemId: string) => void;
  addFolder: (collectionId: string, parentFolderId: string | null, name: string) => void;
  saveRequest: (collectionId: string, folderId: string | null, request: SavedRequest) => void;
  createBlankRequestInFolder: (collectionId: string, folderId: string | null) => void;
  importCollection: (collectionData: Omit<Collection, 'id'>) => void;
  
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
            bodyType: 'none',
            formData: [],
            body: ''
          },
          {
            type: 'request',
            id: 'req-2',
            name: 'Create Post',
            method: 'POST',
            url: 'https://jsonplaceholder.typicode.com/posts',
            headers: [{ key: 'Content-type', value: 'application/json; charset=UTF-8' }],
            bodyType: 'raw',
            formData: [],
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
        bodyType: 'none',
        formData: [],
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
          authType: 'inherit',
          bodyType: 'raw',
          formData: [{ id: crypto.randomUUID(), key: '', value: '', enabled: true, type: 'text' }],
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
  const environments = activeWorkspace?.environments || [];

  const defaultActiveEnvByWorkspace = (() => {
    try {
      const item = window.localStorage.getItem('syncarts-active-env-by-workspace-v3');
      if (item) return JSON.parse(item);
    } catch (e) {}
    return { 'default': null };
  })();

  const [activeEnvIdByWorkspace, setActiveEnvIdByWorkspace] = useLocalStorage<Record<string, string | null>>('syncarts-active-env-by-workspace-v3', defaultActiveEnvByWorkspace);
  
  const activeEnvironmentId = activeEnvIdByWorkspace[activeWorkspaceId] || null;
  const activeEnvironment = environments.find(e => e.id === activeEnvironmentId);
  const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const globalVariables: EnvironmentVariable[] = currentWorkspace?.globalVariables || [];
  
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
    setWorkspaces(prev => [...prev, { id: newWsId, name, collections: [], environments: [] }]);
    
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
        bodyType: 'raw',
        formData: [{ id: crypto.randomUUID(), key: '', value: '', enabled: true, type: 'text' }],
        body: '',
        response: null
      }]
    }));
    setActiveTabIdByWorkspace(prev => ({ ...prev, [newWsId]: newTabId }));
    setActiveEnvIdByWorkspace(prev => ({ ...prev, [newWsId]: null }));
    setActiveWorkspaceId(newWsId);
  };

  const setActiveEnvironmentId = (id: string | null) => {
    setActiveEnvIdByWorkspace(prev => ({ ...prev, [activeWorkspaceId]: id }));
  };

  const createEnvironment = (name: string) => {
    const newEnv: Environment = {
      id: crypto.randomUUID(),
      name,
      variables: []
    };
    updateWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId) {
        return { ...w, environments: [...(w.environments || []), newEnv] };
      }
      return w;
    }));
    setActiveEnvironmentId(newEnv.id);
  };

  const updateEnvironment = (id: string, data: Partial<Environment>) => {
    updateWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId) {
        return {
          ...w,
          environments: (w.environments || []).map(e => e.id === id ? { ...e, ...data } : e)
        };
      }
      return w;
    }));
  };

  const deleteEnvironment = (id: string) => {
    updateWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId) {
        return { ...w, environments: (w.environments || []).filter(e => e.id !== id) };
      }
      return w;
    }));
    if (activeEnvironmentId === id) {
      setActiveEnvironmentId(null);
    }
  };

  const updateGlobalVariables = (variables: EnvironmentVariable[]) => {
    updateWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId) {
        return { ...w, globalVariables: variables };
      }
      return w;
    }));
  };

  const switchWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
  };

  const interpolate = (text: string): string => {
    if (!text) return text;
    
    let result = text;
    const activeVars = activeEnvironment ? activeEnvironment.variables.filter(v => v.enabled && v.key) : [];
    
    for (const v of activeVars) {
      result = result.split(`{{${v.key}}}`).join(v.value);
    }

    const matches = result.match(/\{\{([^}]+)\}\}/g);
    if (matches) {
      for (const match of matches) {
        const key = match.slice(2, -2);
        const globalVar = globalVariables.find(v => v.key === key && v.enabled);
        if (globalVar) {
          result = result.split(match).join(globalVar.value);
        }
      }
    }
    
    return result;
  };

  const { trigger, isMutating, error } = useSWRMutation(
    'api-request',
    async () => {
      if (!activeTab) return null;
      
      const headerMap: Record<string, string> = {};
      activeTab.headers.forEach((h) => {
        if (h.key && h.value) {
          headerMap[interpolate(h.key)] = interpolate(h.value);
        }
      });

      let reqBodyPayload: any = { type: 'None' };
      const currentBodyType = activeTab.bodyType || 'raw';
      
      if (currentBodyType === 'raw') {
        let bodyStr = activeTab.body.trim() === '' ? null : activeTab.body;
        if (bodyStr) bodyStr = interpolate(bodyStr);
        if (bodyStr) reqBodyPayload = { type: 'Raw', content: bodyStr };
      } else if (currentBodyType === 'form-data' || currentBodyType === 'x-www-form-urlencoded') {
        const formData = activeTab.formData || [];
        const items = formData.filter(item => item.enabled && item.key).map(item => ({
          key: interpolate(item.key),
          value: interpolate(item.value)
        }));
        
        if (items.length > 0) {
          reqBodyPayload = { 
            type: currentBodyType === 'form-data' ? 'FormData' : 'FormUrlEncoded',
            items
          };
        }
      }

      const reqPayload = {
        url: interpolate(activeTab.url),
        method: activeTab.method,
        headers: headerMap,
        body: reqBodyPayload,
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
        let testResults: TestResult[] = [];
        let consoleLogs: string[] = [];
        
        if (activeTab.testScript?.trim()) {
          try {
            const customConsole = {
              log: (...args: any[]) => {
                consoleLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
                console.log(...args);
              },
              error: (...args: any[]) => {
                consoleLogs.push("[ERROR] " + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
                console.error(...args);
              },
              warn: (...args: any[]) => {
                consoleLogs.push("[WARN] " + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
                console.warn(...args);
              }
            };
            
            const sy = {
              environment: {
                set: (key: string, value: string) => {
                  if (!activeEnvironmentId || activeEnvironmentId === 'none') {
                    console.warn("No active environment to set variable:", key);
                    return;
                  }
                  const env = environments.find(e => e.id === activeEnvironmentId);
                  if (env) {
                    const existingVarIndex = env.variables.findIndex(v => v.key === key);
                    const newVars = [...env.variables];
                    if (existingVarIndex >= 0) {
                      newVars[existingVarIndex] = { ...newVars[existingVarIndex], value, enabled: true };
                    } else {
                      newVars.push({ id: crypto.randomUUID(), key: key, value, enabled: true });
                    }
                    updateEnvironment(env.id, { variables: newVars });
                  }
                },
                get: (key: string) => {
                  if (!activeEnvironmentId || activeEnvironmentId === 'none') return undefined;
                  const env = environments.find(e => e.id === activeEnvironmentId);
                  return env?.variables.find(v => v.key === key)?.value;
                },
                unset: (key: string) => {
                  if (!activeEnvironmentId || activeEnvironmentId === 'none') return;
                  const env = environments.find(e => e.id === activeEnvironmentId);
                  if (env) {
                    updateEnvironment(env.id, { variables: env.variables.filter(v => v.key !== key) });
                  }
                }
              },
              globals: {
                get: (key: string) => globalVariables.find(v => v.key === key)?.value,
                set: (key: string, value: string) => {
                  const existingIndex = globalVariables.findIndex(v => v.key === key);
                  const newVars = [...globalVariables];
                  if (existingIndex >= 0) {
                    newVars[existingIndex] = { ...newVars[existingIndex], value, enabled: true };
                  } else {
                    newVars.push({ id: crypto.randomUUID(), key, value, enabled: true });
                  }
                  updateGlobalVariables(newVars);
                },
                unset: (key: string) => {
                  updateGlobalVariables(globalVariables.filter(v => v.key !== key));
                }
              },
              response: {
                json: () => JSON.parse(result.body),
                text: () => result.body,
                responseTime: result.time_ms,
                to: {
                  have: {
                    status: (code: number) => { if (result.status !== code) throw new Error(`Expected status ${code} but got ${result.status}`) },
                    body: (text: string) => { if (result.body !== text) throw new Error(`Expected body to be ${text}`) }
                  }
                }
              },
              test: (name: string, fn: () => void) => {
                try {
                  fn();
                  testResults.push({ name, passed: true });
                } catch (e: any) {
                  testResults.push({ name, passed: false, error: e.message || String(e) });
                }
              },
              expect: (val: any) => ({
                to: {
                  eql: (expected: any) => { if (val !== expected) throw new Error(`Expected ${val} to equal ${expected}`) },
                  be: {
                    below: (expected: number) => { if (val >= expected) throw new Error(`Expected ${val} to be below ${expected}`) }
                  }
                }
              })
            };
            const fn = new Function('sy', 'console', activeTab.testScript);
            fn(sy, customConsole);
          } catch (e: any) {
            consoleLogs.push("[SCRIPT ERROR] " + (e.message || String(e)));
            console.error("Script execution failed:", e);
          }
        }
        
        updateActiveTab({ response: result, testResults, consoleLogs });
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
      testScript: '',
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

  const openCollectionTab = (collectionId: string) => {
    const col = currentWorkspace?.collections.find(c => c.id === collectionId);
    if (!col) return;
    
    const existing = currentTabs.find(t => t.type === 'collection' && t.collectionId === collectionId);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }

    addTab({
      type: 'collection',
      name: col.name,
      collectionId,
    });
  };

  const openFolderTab = (collectionId: string, folderId: string) => {
    const col = currentWorkspace?.collections.find(c => c.id === collectionId);
    if (!col) return;

    const findFolder = (items: any[]): Folder | null => {
      for (const item of items) {
        if (item.type === 'folder') {
          if (item.id === folderId) return item;
          const found = findFolder(item.items);
          if (found) return found;
        }
      }
      return null;
    };
    
    const folder = findFolder(col.items);
    if (!folder) return;

    const existing = currentTabs.find(t => t.type === 'folder' && t.folderId === folderId);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }

    addTab({
      type: 'folder',
      name: folder.name,
      collectionId,
      folderId,
    });
  };

  const addCollection = (name: string) => {
    updateWorkspaces(prev => prev.map(ws => {
      if (ws.id !== activeWorkspaceId) return ws;
      return {
        ...ws,
        collections: [...ws.collections, { id: crypto.randomUUID(), name, items: [] }]
      };
    }));
  };

  const importCollection = (collectionData: Omit<Collection, 'id'>) => {
    updateWorkspaces(prev => prev.map(ws => {
      if (ws.id !== activeWorkspaceId) return ws;
      return {
        ...ws,
        collections: [...ws.collections, { ...collectionData, id: crypto.randomUUID() }]
      };
    }));
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

  const deleteItem = (collectionId: string, itemId: string) => {
    updateWorkspaces(prev => prev.map(w => {
      if (w.id !== activeWorkspaceId) return w;
      
      const recursivelyFilter = (items: (Folder | SavedRequest)[]): (Folder | SavedRequest)[] => {
        return items
          .filter(item => item.id !== itemId)
          .map(item => {
            if (item.type === 'folder') return { ...item, items: recursivelyFilter(item.items) };
            return item;
          });
      };
      
      return {
        ...w,
        collections: w.collections.map(col => 
          col.id === collectionId ? { ...col, items: recursivelyFilter(col.items) } : col
        )
      };
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeTabId) {
          closeTab(activeTabId);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        window.location.reload();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId]); // Do not include closeTab as it's not wrapped in useCallback


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
        environments,
        activeEnvironmentId,
        activeEnvironment,
        setActiveEnvironmentId,
        createEnvironment,
        updateEnvironment,
        deleteEnvironment,
        updateGlobalVariables,
        globalVariables,
        
        openCollectionTab,
        openFolderTab,
        
        collections,
        
        setActiveTabId,
        addTab,
        closeTab,
        updateActiveTab,
        
        addCollection,
        deleteCollection,
        deleteItem,
        addFolder,
        saveRequest,
        createBlankRequestInFolder,
        importCollection,
        
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
