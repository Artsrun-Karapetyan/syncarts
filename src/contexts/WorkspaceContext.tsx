import { invoke } from '@tauri-apps/api/core';
import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';
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
  type?: 'request' | 'collection' | 'folder' | 'example';
  name: string;
  method: string;
  url: string;
  headers: HeaderItem[];
  authType?: 'inherit' | 'none' | 'bearer';
  bearerToken?: string;
  bodyType?: BodyType;
  description?: string;
  preRequestScript?: string;
  testScript?: string;
  variables?: EnvironmentVariable[];
  formData?: FormDataItem[];
  body: string;
  response: HttpResponse | null;
  savedRequestId?: string;
  testResults?: TestResult[];
  consoleLogs?: string[];
  collectionId?: string;
  folderId?: string;
  exampleId?: string;
}

export interface SavedExample {
  id: string;
  name: string;
  originalRequest?: Partial<TabData>;
  code: number;
  status: string;
  body: string;
  headers: HeaderItem[];
}

export interface SavedRequest {
  type: 'request';
  id: string;
  name: string;
  method: string;
  url: string;
  headers: HeaderItem[];
  authType?: 'inherit' | 'none' | 'bearer';
  bearerToken?: string;
  bodyType?: BodyType;
  description?: string;
  formData?: FormDataItem[];
  body: string;
  preRequestScript?: string;
  testScript?: string;
  examples?: SavedExample[];
}

export interface Folder {
  type: 'folder';
  id: string;
  name: string;
  items: (Folder | SavedRequest)[];
  authType?: 'inherit' | 'none' | 'bearer';
  bearerToken?: string;
  description?: string;
  preRequestScript?: string;
  testScript?: string;
}

export interface Collection {
  id: string;
  name: string;
  items: (Folder | SavedRequest)[];
  authType?: 'inherit' | 'none' | 'bearer';
  bearerToken?: string;
  description?: string;
  preRequestScript?: string;
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
  ownerId?: string;
  members?: WorkspaceMember[];
  collections: Collection[];
  environments?: Environment[];
  globalVariables?: EnvironmentVariable[];
}

export interface WorkspaceMember {
  userId: string;
  workspaceId: string;
  role: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface WorkspaceContextState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  
  // Workspace Actions
  createWorkspace: (name: string) => void;
  switchWorkspace: (id: string) => void;
  removeWorkspace: (id: string) => Promise<void>;

  // Environment State
  environments: Environment[];
  globalVariables: EnvironmentVariable[];
  activeEnvironmentId: string | null;
  activeEnvironment: Environment | undefined;
  
  // Environment Actions
  setActiveEnvironmentId: (id: string | null) => void;
  createEnvironment: (name: string, variables?: EnvironmentVariable[]) => string;
  updateEnvironment: (id: string, data: Partial<Environment>) => void;
  deleteEnvironment: (id: string) => void;
  updateGlobalVariables: (variables: EnvironmentVariable[]) => void;
  reloadWorkspaces: () => Promise<void>;

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
  openExampleTab: (collectionId: string, exampleId: string) => void;
  updateActiveTab: (data: Partial<TabData>) => void;
  
  // Collection Actions
  addCollection: (name: string) => void;
  updateCollection: (id: string, data: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  deleteItem: (collectionId: string, itemId: string) => void;
  addFolder: (collectionId: string, parentFolderId: string | null, name: string) => void;
  updateFolder: (collectionId: string, folderId: string, data: Partial<Folder>) => void;
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

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue(prev => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    } catch (error) {
      console.error(error);
    }
  }, [key]);

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

export function WorkspaceProvider({ children, userId }: { children: ReactNode, userId: string }) {
  const localDefaultWorkspaceId = `local-${userId}`;

  // Initialize workspaces, migrating from v2 collections if necessary
  const defaultWorkspaces = (() => {
    try {
      const oldV3Item = window.localStorage.getItem('syncarts-workspaces-v3');
      if (oldV3Item) {
        window.localStorage.removeItem('syncarts-workspaces-v3');
        return JSON.parse(oldV3Item);
      }
      const oldCollectionsItem = window.localStorage.getItem('syncarts-collections-v2');
      if (oldCollectionsItem) {
        window.localStorage.removeItem('syncarts-collections-v2');
        const oldCollections = JSON.parse(oldCollectionsItem);
        return [{ id: localDefaultWorkspaceId, name: 'My Workspace', collections: oldCollections }];
      }
    } catch (e) {}
    return [{ id: localDefaultWorkspaceId, name: 'My Workspace', collections: DEFAULT_COLLECTIONS }];
  })();

  const [workspaces, setWorkspaces] = useLocalStorage<Workspace[]>(`syncarts-workspaces-v3-${userId}`, defaultWorkspaces);

  const [activeWorkspaceId, setActiveWorkspaceId] = useLocalStorage<string>(`syncarts-active-workspace-v3-${userId}`, workspaces[0]?.id || localDefaultWorkspaceId);

  // We store a mapping of workspaceId -> tabs
  const defaultTabsByWorkspace = (() => {
    try {
      const oldV3Item = window.localStorage.getItem('syncarts-tabs-by-workspace-v3');
      if (oldV3Item) {
        window.localStorage.removeItem('syncarts-tabs-by-workspace-v3');
        return JSON.parse(oldV3Item);
      }
      const oldTabsItem = window.localStorage.getItem('syncarts-tabs-v2');
      if (oldTabsItem) {
        window.localStorage.removeItem('syncarts-tabs-v2');
        const oldTabs = JSON.parse(oldTabsItem);
        return { [localDefaultWorkspaceId]: oldTabs };
      }
    } catch (e) {}
    return {
      [localDefaultWorkspaceId]: [
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

  const [tabsByWorkspace, setTabsByWorkspace] = useLocalStorage<Record<string, TabData[]>>(`syncarts-tabs-by-workspace-v3-${userId}`, defaultTabsByWorkspace);

  const defaultActiveTabIdByWorkspace = (() => {
    try {
      const oldV3Item = window.localStorage.getItem('syncarts-active-tab-by-workspace-v3');
      if (oldV3Item) {
        window.localStorage.removeItem('syncarts-active-tab-by-workspace-v3');
        return JSON.parse(oldV3Item);
      }
      const oldActiveTabItem = window.localStorage.getItem('syncarts-active-tab-v2');
      if (oldActiveTabItem) {
        window.localStorage.removeItem('syncarts-active-tab-v2');
        const oldActiveTab = JSON.parse(oldActiveTabItem);
        return { [localDefaultWorkspaceId]: oldActiveTab };
      }
    } catch(e) {}
    return { [localDefaultWorkspaceId]: null };
  })();

  const [activeTabIdByWorkspace, setActiveTabIdByWorkspace] = useLocalStorage<Record<string, string | null>>(`syncarts-active-tab-by-workspace-v3-${userId}`, defaultActiveTabIdByWorkspace);

  const defaultActiveEnvByWorkspace = (() => {
    try {
      const oldV3Item = window.localStorage.getItem('syncarts-active-env-by-workspace-v3');
      if (oldV3Item) {
        window.localStorage.removeItem('syncarts-active-env-by-workspace-v3');
        return JSON.parse(oldV3Item);
      }
    } catch (e) {}
    return { [localDefaultWorkspaceId]: null };
  })();

  const [activeEnvIdByWorkspace, setActiveEnvIdByWorkspace] = useLocalStorage<Record<string, string | null>>(`syncarts-active-env-by-workspace-v3-${userId}`, defaultActiveEnvByWorkspace);

  const shouldSkipLegacyDefaultRemote = (remote: any, localWorkspaces: Workspace[]) => {
    const remoteData = remote.data || {};
    const localDefault = localWorkspaces.find((workspace) => workspace.id === localDefaultWorkspaceId);

    return !!localDefault
      && remote.id === 'default'
      && remote.ownerId === userId
      && localDefault.name === remote.name
      && JSON.stringify(localDefault.collections || []) === JSON.stringify(remoteData.collections || []);
  };

  const normalizeLegacyWorkspaces = (items: Workspace[]) => {
    const hasLocalDefault = items.some((workspace) => workspace.id === localDefaultWorkspaceId);
    const seenIds = new Set<string>();

    return items.filter((workspace) => {
      if (seenIds.has(workspace.id)) return false;
      seenIds.add(workspace.id);

      if (!hasLocalDefault || workspace.id === localDefaultWorkspaceId) return true;

      return !(workspace.name === 'My Workspace'
        && (workspace.id === 'default' || !workspace.ownerId || workspace.ownerId === userId));
    });
  };

  const removeUnavailableSharedWorkspaces = (items: Workspace[], remoteIds: Set<string>) => {
    return items.filter((workspace) => {
      const isSharedWorkspace = !!workspace.ownerId && workspace.ownerId !== userId;
      return !isSharedWorkspace || remoteIds.has(workspace.id);
    });
  };

  const mapRemoteWorkspace = (remote: any, local?: Workspace): Workspace => {
    const remoteData = remote.data || { collections: [], environments: [] };
    return {
      ...local,
      id: remote.id,
      name: remote.name,
      ownerId: remote.ownerId,
      members: remote.members || [],
      collections: remoteData.collections || [],
      environments: remoteData.environments || [],
      globalVariables: remoteData.globalVariables || local?.globalVariables || []
    };
  };

  useEffect(() => {
    setWorkspaces((prev) => {
      const normalized = normalizeLegacyWorkspaces(prev);
      if (normalized.length !== prev.length) return normalized;
      if (!prev.some((workspace) => workspace.id === 'default')) return prev;
      if (prev.some((workspace) => workspace.id === localDefaultWorkspaceId)) {
        return prev.filter((workspace) => workspace.id !== 'default');
      }

      return prev.map((workspace) =>
        workspace.id === 'default' ? { ...workspace, id: localDefaultWorkspaceId } : workspace
      );
    });

    setTabsByWorkspace((prev) => {
      if (!prev.default || prev[localDefaultWorkspaceId]) return prev;
      const { default: defaultTabs, ...rest } = prev;
      return { ...rest, [localDefaultWorkspaceId]: defaultTabs };
    });

    setActiveTabIdByWorkspace((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, 'default') || prev[localDefaultWorkspaceId] !== undefined) return prev;
      const { default: defaultActiveTabId, ...rest } = prev;
      return { ...rest, [localDefaultWorkspaceId]: defaultActiveTabId };
    });

    setActiveEnvIdByWorkspace((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, 'default') || prev[localDefaultWorkspaceId] !== undefined) return prev;
      const { default: defaultActiveEnvId, ...rest } = prev;
      return { ...rest, [localDefaultWorkspaceId]: defaultActiveEnvId };
    });

    if (activeWorkspaceId === 'default') {
      setActiveWorkspaceId(localDefaultWorkspaceId);
    }
  }, [activeWorkspaceId, localDefaultWorkspaceId, setActiveWorkspaceId, setActiveEnvIdByWorkspace, setActiveTabIdByWorkspace, setTabsByWorkspace, setWorkspaces]);

  useEffect(() => {
    if (workspaces.length > 0 && !workspaces.some((workspace) => workspace.id === activeWorkspaceId)) {
      setActiveWorkspaceId(workspaces[0].id);
    }
  }, [activeWorkspaceId, setActiveWorkspaceId, workspaces]);

  // Current workspace projections
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
  const collections = activeWorkspace?.collections || [];
  const environments = activeWorkspace?.environments || [];
  
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

  const reloadWorkspaces = async () => {
    try {
      const res: any = await api.get('/workspaces');
      const remoteWorkspaces = res.data || [];
      const remoteIds = new Set<string>(remoteWorkspaces.map((remote: any) => remote.id));

      setWorkspaces((prevLocals) => {
        const nextLocals = [...removeUnavailableSharedWorkspaces(prevLocals, remoteIds)];

        for (const remote of remoteWorkspaces) {
          if (shouldSkipLegacyDefaultRemote(remote, nextLocals)) {
            continue;
          }

          const remoteData = remote.data || { collections: [], environments: [] };
          const localIndex = nextLocals.findIndex((workspace) => workspace.id === remote.id);

          if (localIndex === -1) {
            nextLocals.push({
              ...mapRemoteWorkspace(remote),
              collections: remoteData.collections || [],
              environments: remoteData.environments || []
            });
            continue;
          }

          nextLocals[localIndex] = mapRemoteWorkspace(remote, nextLocals[localIndex]);
        }

        return normalizeLegacyWorkspaces(nextLocals);
      });
    } catch (err) {
      console.error('Failed to reload workspaces', err);
    }
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

  const createEnvironment = (name: string, variables: EnvironmentVariable[] = []) => {
    const newEnv: Environment = {
      id: crypto.randomUUID(),
      name,
      variables
    };
    updateWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId) {
        return { ...w, environments: [...(w.environments || []), newEnv] };
      }
      return w;
    }));
    setActiveEnvironmentId(newEnv.id);
    return newEnv.id;
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

  const removeWorkspace = async (id: string) => {
    const workspaceToRemove = workspaces.find((workspace) => workspace.id === id);
    const nextWorkspaceId = workspaces.find((workspace) => workspace.id !== id)?.id || localDefaultWorkspaceId;

    if (workspaceToRemove?.ownerId || !id.startsWith('local-')) {
      await api.delete(`/workspaces/${id}`);
    }

    setWorkspaces((prev) => {
      const next = prev.filter((workspace) => workspace.id !== id);
      if (next.length > 0) return next;

      return [{
        id: localDefaultWorkspaceId,
        name: 'My Workspace',
        collections: [],
        environments: []
      }];
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

    if (activeWorkspaceId === id) {
      setActiveWorkspaceId(nextWorkspaceId);
    }
  };

  const getRequestAncestors = (): (Collection | Folder)[] => {
    if (!activeTab || !activeTab.collectionId) return [];
    const col = collections.find(c => c.id === activeTab.collectionId);
    if (!col) return [];
    
    const ancestors: (Collection | Folder)[] = [col];
    
    if (activeTab.folderId) {
      const getFolderPath = (items: (Folder | SavedRequest)[], targetId: string): Folder[] | null => {
        for (const item of items) {
          if (item.type === 'folder') {
            if (item.id === targetId) return [item];
            const subPath = getFolderPath(item.items, targetId);
            if (subPath) return [item, ...subPath];
          }
        }
        return null;
      };
      
      const folderPath = getFolderPath(col.items, activeTab.folderId);
      if (folderPath) {
        ancestors.push(...folderPath);
      }
    }
    return ancestors;
  };

  const interpolate = (text: string): string => {
    if (!text) return text;
    
    let result = text;
    const activeVars = activeEnvironment ? activeEnvironment.variables.filter(v => v.enabled && v.key) : [];
    
    // Environment Variables
    for (const v of activeVars) {
      result = result.split(`{{${v.key}}}`).join(v.value);
    }

    // Collection Variables
    const col = activeTab?.collectionId ? collections.find(c => c.id === activeTab.collectionId) : null;
    const colVars = col?.variables?.filter(v => v.enabled && v.key) || [];
    
    const matches = result.match(/\{\{([^}]+)\}\}/g);
    if (matches) {
      for (const match of matches) {
        const key = match.slice(2, -2);
        
        // Try collection variables first
        const colVar = colVars.find(v => v.key === key);
        if (colVar) {
          result = result.split(match).join(colVar.value);
          continue;
        }

        // Try global variables
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

      // Handle Auth Inheritance
      let finalAuthType = activeTab.authType || 'inherit';
      let finalBearerToken = activeTab.bearerToken || '';
      
      if (finalAuthType === 'inherit') {
        const ancestors = getRequestAncestors();
        for (let i = ancestors.length - 1; i >= 0; i--) {
          const ancestor = ancestors[i];
          if (ancestor.authType && ancestor.authType !== 'inherit') {
            finalAuthType = ancestor.authType;
            finalBearerToken = ancestor.bearerToken || '';
            break;
          }
        }
      }
      
      if (finalAuthType === 'bearer' && finalBearerToken) {
        headerMap['Authorization'] = `Bearer ${interpolate(finalBearerToken)}`;
      }

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
      
      let testResults: TestResult[] = [];
      let consoleLogs: string[] = [];
      
      // Setup scripting environment
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
      
      const col = activeTab?.collectionId ? collections.find(c => c.id === activeTab.collectionId) : null;
      
      const sy = {
        environment: {
          set: (key: string, value: string) => {
            if (!activeEnvironmentId || activeEnvironmentId === 'none') return;
            const env = environments.find(e => e.id === activeEnvironmentId);
            if (env) {
              const existingVarIndex = env.variables.findIndex(v => v.key === key);
              const newVars = [...env.variables];
              if (existingVarIndex >= 0) {
                newVars[existingVarIndex] = { ...newVars[existingVarIndex], value, enabled: true };
              } else {
                newVars.push({ id: crypto.randomUUID(), key, value, enabled: true });
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
        collectionVariables: {
          set: (key: string, value: string) => {
            if (!col) return;
            const existingIndex = (col.variables || []).findIndex(v => v.key === key);
            const newVars = [...(col.variables || [])];
            if (existingIndex >= 0) {
              newVars[existingIndex] = { ...newVars[existingIndex], value, enabled: true };
            } else {
              newVars.push({ id: crypto.randomUUID(), key, value, enabled: true });
            }
            updateCollection(col.id, { variables: newVars });
          },
          get: (key: string) => {
            return col?.variables?.find(v => v.key === key)?.value;
          },
          unset: (key: string) => {
            if (!col) return;
            updateCollection(col.id, { variables: (col.variables || []).filter(v => v.key !== key) });
          }
        },
        globals: {
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
          get: (key: string) => globalVariables.find(v => v.key === key)?.value,
          unset: (key: string) => {
            updateGlobalVariables(globalVariables.filter(v => v.key !== key));
          }
        },
        response: null as any,
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
              below: (expected: number) => { if (val >= expected) throw new Error(`Expected ${val} to be below ${expected}`) },
              oneOf: (expectedList: any[]) => { if (!expectedList.includes(val)) throw new Error(`Expected ${val} to be one of ${expectedList}`) }
            },
            include: (expected: any) => { if (typeof val === 'string' && !val.includes(expected)) throw new Error(`Expected ${val} to include ${expected}`) }
          }
        })
      };

      const ancestors = getRequestAncestors();
      const allPreScripts = [...ancestors.map(a => a.preRequestScript), activeTab.preRequestScript].filter(s => s && s.trim());
      const allTestScripts = [...ancestors.map(a => a.testScript), activeTab.testScript].filter(s => s && s.trim());

      // Execute Pre-request Scripts
      for (const script of allPreScripts) {
        try {
          const fn = new Function('sy', 'console', script!);
          fn(sy, customConsole);
        } catch (e: any) {
          consoleLogs.push("[PRE-SCRIPT ERROR] " + (e.message || String(e)));
          console.error("Pre-request script failed:", e);
        }
      }

      // Make the actual HTTP request
      const result = await trigger();
      
      if (result) {
        sy.response = {
          json: () => JSON.parse(result.body),
          text: () => result.body,
          responseTime: result.time_ms,
          code: result.status,
          to: {
            have: {
              status: (code: number | string) => { 
                if (typeof code === 'number' && result.status !== code) throw new Error(`Expected status ${code} but got ${result.status}`);
                // Basic string matching like "Created" isn't fully implemented in our response struct, but this avoids crashes
                if (typeof code === 'string' && result.status !== 200 && result.status !== 201) throw new Error(`Expected status to match ${code}`);
              },
              body: (text: string) => { if (result.body !== text) throw new Error(`Expected body to be ${text}`) },
              header: (key: string) => { if (!Object.keys(result.headers || {}).some(h => h.toLowerCase() === key.toLowerCase())) throw new Error(`Header ${key} not found`) }
            }
          }
        };

        // Execute Post-response Scripts
        for (const script of allTestScripts) {
          try {
            const fn = new Function('sy', 'console', script!);
            fn(sy, customConsole);
          } catch (e: any) {
            consoleLogs.push("[POST-SCRIPT ERROR] " + (e.message || String(e)));
            console.error("Post-response script failed:", e);
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
    let currentTab: TabData | undefined;
    updateCurrentTabs(prev => {
      return prev.map(t => {
        if (t.id === activeTabId) {
          const updated = { ...t, ...data };
          currentTab = updated;
          return updated;
        }
        return t;
      });
    });

    if (currentTab && currentTab.type === 'collection' && currentTab.collectionId) {
      updateCollection(currentTab.collectionId, data as Partial<Collection>);
    } else if (currentTab && currentTab.type === 'folder' && currentTab.collectionId && currentTab.folderId) {
      updateFolder(currentTab.collectionId, currentTab.folderId, data as Partial<Folder>);
    }
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
      authType: folder.authType,
      bearerToken: folder.bearerToken,
      preRequestScript: folder.preRequestScript,
      testScript: folder.testScript,
      description: folder.description,
    });
  };

  const openExampleTab = (collectionId: string, exampleId: string) => {
    const col = currentWorkspace?.collections.find(c => c.id === collectionId);
    if (!col) return;

    const findExample = (items: any[]): SavedExample | null => {
      for (const item of items) {
        if (item.type === 'folder') {
          const found = findExample(item.items);
          if (found) return found;
        } else if (item.type === 'request' && item.examples) {
          const found = item.examples.find((e: SavedExample) => e.id === exampleId);
          if (found) return found;
        }
      }
      return null;
    };
    
    const example = findExample(col.items);
    if (!example) return;

    const existing = currentTabs.find(t => t.type === 'example' && t.exampleId === exampleId);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }

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

  const addCollection = (name: string) => {
    updateWorkspaces(prev => prev.map(ws => {
      if (ws.id !== activeWorkspaceId) return ws;
      return {
        ...ws,
        collections: [...ws.collections, { id: crypto.randomUUID(), name, items: [] }]
      };
    }));
  };

  const updateCollection = (id: string, data: Partial<Collection>) => {
    updateWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId) {
        return {
          ...w,
          collections: w.collections.map(c => c.id === id ? { ...c, ...data } : c)
        };
      }
      return w;
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

  const updateFolder = (collectionId: string, folderId: string, data: Partial<Folder>) => {
    updateWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId) {
        return {
          ...w,
          collections: w.collections.map(c => {
            if (c.id === collectionId) {
              const updateItem = (items: (Folder | SavedRequest)[]): (Folder | SavedRequest)[] => {
                return items.map(item => {
                  if (item.type === 'folder' && item.id === folderId) {
                    return { ...item, ...data } as Folder;
                  }
                  if (item.type === 'folder') {
                    return { ...item, items: updateItem(item.items) };
                  }
                  return item;
                });
              };
              return { ...c, items: updateItem(c.items) };
            }
            return c;
          })
        };
      }
      return w;
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
  const activeTabIdRef = useRef(activeTabId);
  const closeTabRef = useRef(closeTab);

  useEffect(() => {
    activeTabIdRef.current = activeTabId;
    closeTabRef.current = closeTab;
  }, [activeTabId, closeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeTabIdRef.current) {
          closeTabRef.current(activeTabIdRef.current);
          // Restore focus to body to prevent Tauri webview from losing keyboard focus on Mac
          // when the focused element inside the tab is unmounted.
          setTimeout(() => {
            window.focus();
            document.body.focus();
          }, 0);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        window.location.reload();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- BACKGROUND SYNC LOGIC ---

  useEffect(() => {
    let isMounted = true;
    api.get('/workspaces').then((res: any) => {
      if (!isMounted) return;
      const remoteWorkspaces = res.data || [];
      const remoteIds = new Set<string>(remoteWorkspaces.map((remote: any) => remote.id));
      const workspacesToPush: Array<{
        workspaceId: string;
        data: { name: string; ownerId?: string; collections: Collection[]; environments: Environment[]; globalVariables: EnvironmentVariable[] };
      }> = [];
      
      setWorkspaces((prevLocals) => {
        let hasChanges = false;
        const nextLocals = [...removeUnavailableSharedWorkspaces(prevLocals, remoteIds)];
        if (nextLocals.length !== prevLocals.length) {
          hasChanges = true;
        }

        for (const remote of remoteWorkspaces) {
          if (shouldSkipLegacyDefaultRemote(remote, nextLocals)) {
            continue;
          }

          const localIndex = nextLocals.findIndex(w => w.id === remote.id);
          const remoteData = remote.data || { collections: [], environments: [] };
          
          if (localIndex === -1) {
            nextLocals.push({
              ...mapRemoteWorkspace(remote),
              collections: remoteData.collections || [],
              environments: remoteData.environments || []
            });
            hasChanges = true;
          } else {
            const local = nextLocals[localIndex];
            const remoteWorkspace = mapRemoteWorkspace(remote, local);

            if (remote.ownerId && remote.ownerId !== userId) {
              if (JSON.stringify(local) !== JSON.stringify(remoteWorkspace)) {
                nextLocals[localIndex] = remoteWorkspace;
                hasChanges = true;
              }
              continue;
            }

            const localData = {
              name: local.name,
              collections: local.collections,
              environments: local.environments || [],
              globalVariables: local.globalVariables || []
            };
            const localSyncData = {
              ...localData,
              ownerId: local.ownerId
            };
            const remoteName = remote.name || '';
            const remoteCollections = remoteData.collections || [];
            const remoteEnvironments = remoteData.environments || [];
            const remoteGlobalVariables = remoteData.globalVariables || [];
            const localHasData = localData.collections.length > 0 || localData.environments.length > 0 || localData.globalVariables.length > 0;
            const remoteHasData = remoteCollections.length > 0 || remoteEnvironments.length > 0 || remoteGlobalVariables.length > 0;
            const nameChanged = localData.name !== remoteName;

            // Keep local edits on reload, but hydrate empty local workspaces from the backend.
            if (!localHasData && remoteHasData) {
               nextLocals[localIndex] = mapRemoteWorkspace(remote, local);
               hasChanges = true;
            } else if (localHasData && (!remoteHasData || nameChanged)) {
               workspacesToPush.push({ workspaceId: remote.id, data: localSyncData });
            } else if (localHasData && remoteHasData && (nameChanged || JSON.stringify(localData) !== JSON.stringify(remoteData))) {
               workspacesToPush.push({ workspaceId: remote.id, data: localSyncData });
            } else if (JSON.stringify(local.members || []) !== JSON.stringify(remote.members || [])) {
               nextLocals[localIndex] = { ...local, ownerId: remote.ownerId, members: remote.members || [] };
               hasChanges = true;
            }
          }
        }
        if (hasChanges) return normalizeLegacyWorkspaces(nextLocals);
        const normalizedLocals = normalizeLegacyWorkspaces(prevLocals);
        return normalizedLocals.length !== prevLocals.length ? normalizedLocals : prevLocals;
      });

      for (const workspace of workspacesToPush) {
        api.put(`/workspaces/${workspace.workspaceId}/sync`, workspace.data).catch((err: any) => {
          console.error('Failed to sync workspace to backend', err);
        });
      }
    }).catch((err: any) => {
      console.error('Failed to fetch workspaces from backend', err);
    });

    return () => { isMounted = false; };
  }, [setWorkspaces]);

  useEffect(() => {
    if (workspaces.length === 0) return;

    const timeoutId = setTimeout(() => {
      workspaces.forEach((workspace) => {
        const dataPayload = {
          name: workspace.name,
          ownerId: workspace.ownerId,
          collections: workspace.collections,
          environments: workspace.environments || [],
          globalVariables: workspace.globalVariables || []
        };

        if (workspace.ownerId && workspace.ownerId !== userId) {
          return;
        }

        api.put(`/workspaces/${workspace.id}/sync`, dataPayload).catch((err: any) => {
          console.error('Failed to sync workspace to backend', workspace.id, err);
        });
      });
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [workspaces, activeWorkspaceId, userId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      api.get('/workspaces').then((res: any) => {
        const remoteWorkspaces = res.data || [];
        const remoteIds = new Set<string>(remoteWorkspaces.map((remote: any) => remote.id));

        setWorkspaces((prevLocals) => {
          let hasChanges = false;
          const nextLocals = [...removeUnavailableSharedWorkspaces(prevLocals, remoteIds)];
          if (nextLocals.length !== prevLocals.length) {
            hasChanges = true;
          }

          for (const remote of remoteWorkspaces) {
            const localIndex = nextLocals.findIndex((workspace) => workspace.id === remote.id);
            const isOwnedWorkspace = remote.ownerId === userId;
            const remoteWorkspace = mapRemoteWorkspace(remote);

            if (localIndex === -1) {
              nextLocals.push(remoteWorkspace);
              hasChanges = true;
              continue;
            }

            if (isOwnedWorkspace) {
              const local = nextLocals[localIndex];
              if (JSON.stringify(local.members || []) !== JSON.stringify(remote.members || [])) {
                nextLocals[localIndex] = { ...local, ownerId: remote.ownerId, members: remote.members || [] };
                hasChanges = true;
              }
              continue;
            }

            if (JSON.stringify(nextLocals[localIndex]) !== JSON.stringify(remoteWorkspace)) {
              nextLocals[localIndex] = mapRemoteWorkspace(remote, nextLocals[localIndex]);
              hasChanges = true;
            }
          }

          return hasChanges ? normalizeLegacyWorkspaces(nextLocals) : prevLocals;
        });
      }).catch((err: any) => {
        console.error('Failed to refresh shared workspaces', err);
      });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [setWorkspaces, userId]);

  return (
    <WorkspaceContext.Provider
      value={{
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
        
        setActiveEnvironmentId,
        createEnvironment,
        updateEnvironment,
        deleteEnvironment,
        updateGlobalVariables,
        reloadWorkspaces,
        
        openCollectionTab,
        openFolderTab,
        openExampleTab,
        updateActiveTab,
        collections,
        
        setActiveTabId,
        addTab,
        closeTab,
        
        addCollection,
        updateCollection,
        deleteCollection,
        deleteItem,
        addFolder,
        updateFolder,
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
