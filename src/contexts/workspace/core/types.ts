export interface HeaderItem {
  key: string;
  value: string;
  description?: string;
  enabled?: boolean;
}

export interface HttpResponse {
  status: number;
  status_text: string;
  headers: Record<string, string>;
  body: string;
  time_ms: number;
}

import type { useCollectionActions } from "@/contexts/workspace/collections/useCollectionActions";
import type { useEnvironmentActions } from "@/contexts/workspace/environment/useEnvironmentActions";
import type { useRequestSender } from "@/contexts/workspace/requests/useRequestSender";
import type { useTabActions } from "@/contexts/workspace/tabs/core/useTabActions";

export type TabActions = ReturnType<typeof useTabActions>;
export type CollectionActions = ReturnType<typeof useCollectionActions>;
export type EnvironmentActions = ReturnType<typeof useEnvironmentActions>;
export type RequestSenderActions = ReturnType<typeof useRequestSender>;

export type BodyType = "none" | "form-data" | "x-www-form-urlencoded" | "raw";

export interface FormDataItem {
  id: string;
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
  type?: "text" | "file";
  files?: string[];
}

export interface QueryParamItem {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
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
  type?: "request" | "collection" | "folder" | "example";
  name: string;
  method: string;
  url: string;
  headers: HeaderItem[];
  authType?: "inherit" | "none" | "bearer";
  bearerToken?: string;
  bodyType?: BodyType;
  description?: string;
  pathVariables?: PathVariable[];
  queryParamDescriptions?: Record<string, string>;
  queryParams?: QueryParamItem[];
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
  pinned?: boolean;
  collectionView?:
    | "overview"
    | "authorization"
    | "scripts"
    | "variables"
    | "runs";
}

export interface SavedExample {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  originalRequest?: Partial<TabData>;
  code: number;
  status: string;
  body: string;
  headers: HeaderItem[];
}

export interface SavedRequest {
  type: "request";
  id: string;
  collectionId?: string;
  folderId?: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  method: string;
  url: string;
  headers: HeaderItem[];
  authType?: "inherit" | "none" | "bearer";
  bearerToken?: string;
  bodyType?: BodyType;
  description?: string;
  pathVariables?: PathVariable[];
  queryParamDescriptions?: Record<string, string>;
  queryParams?: QueryParamItem[];
  formData?: FormDataItem[];
  body: string;
  preRequestScript?: string;
  testScript?: string;
  examples?: SavedExample[];
}

export interface Folder {
  type: "folder";
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  items: (Folder | SavedRequest)[];
  authType?: "inherit" | "none" | "bearer";
  bearerToken?: string;
  description?: string;
  preRequestScript?: string;
  testScript?: string;
  variables?: EnvironmentVariable[];
}

export interface ForkMetadata {
  originalWorkspaceId: string;
  originalCollectionId: string;
  forkedAt: number;
}

export interface Collection {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  items: (Folder | SavedRequest)[];
  authType?: "inherit" | "none" | "bearer";
  bearerToken?: string;
  description?: string;
  preRequestScript?: string;
  testScript?: string;
  variables?: EnvironmentVariable[];
  fork?: ForkMetadata;
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  type?: "default" | "secret";
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

export interface Environment {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  variables: EnvironmentVariable[];
}

export interface Workspace {
  id: string;
  name: string;
  type?: "cloud" | "local";
  path?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
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

export type SidebarMoveEntityType =
  | "collection"
  | "folder"
  | "request"
  | "example";
export type SidebarDropPosition = "before" | "after" | "inside";

export interface SidebarMoveEntity {
  type: SidebarMoveEntityType;
  collectionId: string;
  itemId?: string;
  requestId?: string;
}

export interface SidebarMoveTarget extends SidebarMoveEntity {
  position: SidebarDropPosition;
}

export interface SavedRequestLocation {
  collectionId: string;
  folderId: string | null;
  request: SavedRequest;
}

export interface WorkspaceContextState
  extends
    TabActions,
    CollectionActions,
    EnvironmentActions,
    RequestSenderActions {
  responseCache: Record<string, HttpResponse>;
  updateResponseCache: (id: string, response: HttpResponse) => void;
  userId: string;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  localDefaultWorkspaceId: string;
  createWorkspace: (
    name: string,
    collections?: any[],
    environments?: any[],
    type?: "cloud" | "local",
    path?: string,
  ) => string;
  switchWorkspace: (id: string) => void;
  renameWorkspace: (id: string, newName: string) => void;
  removeWorkspace: (id: string) => Promise<void>;
  environments: Environment[];
  globalVariables: EnvironmentVariable[];
  activeEnvironmentId: string | null;
  activeEnvironment: Environment | undefined;
  setActiveEnvironmentId: (id: string | null) => void;
  createEnvironment: (
    name: string,
    variables?: EnvironmentVariable[],
  ) => string;
  updateEnvironment: (id: string, data: Partial<Environment>) => void;
  deleteEnvironment: (id: string) => void;
  updateGlobalVariables: (variables: EnvironmentVariable[]) => void;
  secrets: Record<string, string>;
  updateSecret: (varId: string, value: string) => void;
  reloadWorkspaces: () => Promise<void>;
  tabs: TabData[];
  activeTabId: string | null;
  activeTab: TabData | undefined;
  collections: Collection[];
  setActiveTabId: (id: string) => void;
  addTab: (data?: Partial<TabData> & { savedRequestId?: string }) => void;
  closeTab: (id: string) => void;
  openCollectionTab: (
    collectionId: string,
    view?: TabData["collectionView"],
  ) => void;
  openFolderTab: (collectionId: string, folderId: string) => void;
  openRequestTab: (
    collectionId: string,
    folderId: string | null,
    requestId: string,
  ) => void;
  openExampleTab: (collectionId: string, exampleId: string) => void;
  updateActiveTab: (data: Partial<TabData>) => void;
  rememberTabSnapshot: (tabId: string, request: Partial<TabData>) => void;
  findSavedRequestById: (requestId?: string) => SavedRequestLocation | null;
  resolveTabSavedRequestId: (tab?: TabData) => string | undefined;
  isTabDirty: (tab?: TabData) => boolean;
  saveActiveRequestInPlace: () => boolean;
  saveRequestTabInPlace: (tab: TabData) => boolean;
  addCollection: (name: string) => void;
  forkCollection: (collectionId: string) => void;
  pullCollection: (collectionId: string) => Promise<void>;
  updateCollection: (id: string, data: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  deleteItem: (collectionId: string, itemId: string) => void;
  duplicateCollection: (collectionId: string) => void;
  duplicateItem: (collectionId: string, itemId: string) => void;
  addFolder: (
    collectionId: string,
    parentFolderId: string | null,
    name: string,
  ) => void;
  updateFolder: (
    collectionId: string,
    folderId: string,
    data: Partial<Folder>,
  ) => void;
  saveRequest: (
    collectionId: string,
    folderId: string | null,
    request: SavedRequest,
  ) => void;
  createBlankRequestInFolder: (
    collectionId: string,
    folderId: string | null,
  ) => void;
  importCollection: (collectionData: Omit<Collection, "id">) => void;
  sendRequest: () => Promise<HttpResponse | undefined>;
  isMutating: boolean;
  error: unknown;
  renameItem: (collectionId: string, itemId: string, newName: string) => void;
  moveSidebarItem: (
    source: SidebarMoveEntity,
    target: SidebarMoveTarget,
  ) => void;
  addExample: (
    collectionId: string,
    requestId: string,
    exampleName: string,
    exampleId?: string,
  ) => string;
  duplicateExample: (
    collectionId: string,
    requestId: string,
    exampleId: string,
  ) => void;
  deleteExample: (
    collectionId: string,
    requestId: string,
    exampleId: string,
  ) => void;
  updateExample: (
    collectionId: string,
    requestId: string,
    exampleId: string,
    data: Partial<SavedExample>,
  ) => void;
  sortItems: (
    collectionId: string,
    folderId: string | null,
    type: "default" | "az",
  ) => void;
}
