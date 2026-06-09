import { DEFAULT_COLLECTIONS, createEmptyRequestTab } from './defaults';
import type { TabData, Workspace } from './types';

export function createDefaultWorkspaces(userId: string, localDefaultWorkspaceId: string): Workspace[] {
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
      return [{ id: localDefaultWorkspaceId, name: 'My Workspace', ownerId: userId, collections: oldCollections }];
    }
  } catch {}

  return [{ id: localDefaultWorkspaceId, name: 'My Workspace', ownerId: userId, collections: DEFAULT_COLLECTIONS }];
}

export function createDefaultTabsByWorkspace(localDefaultWorkspaceId: string): Record<string, TabData[]> {
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
  } catch {}

  return { [localDefaultWorkspaceId]: [createEmptyRequestTab()] };
}

export function createDefaultActiveTabByWorkspace(localDefaultWorkspaceId: string): Record<string, string | null> {
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
  } catch {}

  return { [localDefaultWorkspaceId]: null };
}

export function createDefaultActiveEnvByWorkspace(localDefaultWorkspaceId: string): Record<string, string | null> {
  try {
    const oldV3Item = window.localStorage.getItem('syncarts-active-env-by-workspace-v3');
    if (oldV3Item) {
      window.localStorage.removeItem('syncarts-active-env-by-workspace-v3');
      return JSON.parse(oldV3Item);
    }
  } catch {}

  return { [localDefaultWorkspaceId]: null };
}
