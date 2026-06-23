import type { MutableRefObject } from "react";

import type {
  Collection,
  Folder,
  SavedRequest,
  TabData,
  Workspace,
} from "@/contexts/workspace/core/types";

export interface TabActionsArgs {
  activeTab: TabData | undefined;
  activeTabId: string | null;
  activeWorkspaceId: string;
  collections: Collection[];
  currentTabs: TabData[];
  currentWorkspace: Workspace | undefined;
  lastSavedTabSnapshotsRef: MutableRefObject<Record<string, string>>;
  saveRequest: (
    collectionId: string,
    folderId: string | null,
    request: SavedRequest,
    options?: { markDirty?: boolean },
  ) => void;
  setActiveTabIdByWorkspace: (
    value:
      | Record<string, string | null>
      | ((
          prev: Record<string, string | null>,
        ) => Record<string, string | null>),
  ) => void;
  setTabsByWorkspace: (
    value:
      | Record<string, TabData[]>
      | ((prev: Record<string, TabData[]>) => Record<string, TabData[]>),
  ) => void;
  updateCollection: (id: string, data: Partial<Collection>) => void;
  updateFolder: (
    collectionId: string,
    folderId: string,
    data: Partial<Folder>,
  ) => void;
}
