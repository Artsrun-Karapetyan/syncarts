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
  files?: string[];
}

export interface PathVariable {
  id: string;
  key: string;
  value: string;
  description?: string;
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
  pathVariables?: PathVariable[];
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
  collectionView?: 'overview' | 'authorization' | 'scripts' | 'variables' | 'runs';
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
  pathVariables?: PathVariable[];
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

export interface SavedRequestLocation {
  collectionId: string;
  folderId: string | null;
  request: SavedRequest;
}

export interface WorkspaceContextState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  createWorkspace: (name: string) => void;
  switchWorkspace: (id: string) => void;
  removeWorkspace: (id: string) => Promise<void>;
  environments: Environment[];
  globalVariables: EnvironmentVariable[];
  activeEnvironmentId: string | null;
  activeEnvironment: Environment | undefined;
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
  setActiveTabId: (id: string) => void;
  addTab: (data?: Partial<TabData> & { savedRequestId?: string }) => void;
  closeTab: (id: string) => void;
  openCollectionTab: (collectionId: string, view?: TabData['collectionView']) => void;
  openFolderTab: (collectionId: string, folderId: string) => void;
  openRequestTab: (collectionId: string, folderId: string | null, requestId: string) => void;
  openExampleTab: (collectionId: string, exampleId: string) => void;
  updateActiveTab: (data: Partial<TabData>) => void;
  rememberTabSnapshot: (tabId: string, request: Partial<TabData>) => void;
  findSavedRequestById: (requestId?: string) => SavedRequestLocation | null;
  resolveTabSavedRequestId: (tab?: TabData) => string | undefined;
  isTabDirty: (tab?: TabData) => boolean;
  saveActiveRequestInPlace: () => boolean;
  addCollection: (name: string) => void;
  updateCollection: (id: string, data: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  deleteItem: (collectionId: string, itemId: string) => void;
  addFolder: (collectionId: string, parentFolderId: string | null, name: string) => void;
  updateFolder: (collectionId: string, folderId: string, data: Partial<Folder>) => void;
  saveRequest: (collectionId: string, folderId: string | null, request: SavedRequest) => void;
  createBlankRequestInFolder: (collectionId: string, folderId: string | null) => void;
  importCollection: (collectionData: Omit<Collection, 'id'>) => void;
  sendRequest: () => Promise<void>;
  isMutating: boolean;
  error: unknown;
  renameItem: (collectionId: string, itemId: string, newName: string) => void;
  addExample: (collectionId: string, requestId: string, exampleName: string) => void;
  deleteExample: (collectionId: string, requestId: string, exampleId: string) => void;
  sortItems: (collectionId: string, folderId: string | null, type: 'default' | 'az') => void;
}
