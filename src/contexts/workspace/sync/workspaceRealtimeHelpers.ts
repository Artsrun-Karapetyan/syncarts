import { updateRequestInItems } from "@/contexts/workspace/collections/collectionItemHelpers";
import type { SavedRequest, Workspace } from "@/contexts/workspace/core/types";
import { findSavedRequestByIdInCollections } from "@/contexts/workspace/tabs/helpers/tabHelpers";
import { API_URL, getToken } from "@/lib/api";

export type WorkspaceRealtimeEvent = {
  type: string;
  workspaceId: string;
  entityType: string;
  entityId?: string;
  parentId?: string;
  version?: number;
  workspaceVersion?: number;
  updatedAt?: string;
};

export function createWorkspaceEventSource(workspaceId: string) {
  const token = getToken();
  if (!token) return null;

  const params = new URLSearchParams({ access_token: token });
  return new EventSource(
    `${API_URL}/workspaces/${workspaceId}/events?${params.toString()}`,
  );
}

export function replaceRealtimeRequest(
  workspaces: Workspace[],
  workspaceId: string,
  request: SavedRequest,
  event: WorkspaceRealtimeEvent,
) {
  const workspace = workspaces.find((item) => item.id === workspaceId);
  if (!workspace) return { workspaces, changed: false, needsReload: true };

  const location = findSavedRequestByIdInCollections(
    workspace.collections,
    request.id,
  );
  if (!location) return { workspaces, changed: false, needsReload: true };

  if (request.collectionId && request.collectionId !== location.collectionId) {
    return { workspaces, changed: false, needsReload: true };
  }

  const requestFolderId = request.folderId ?? null;
  if (request.folderId !== undefined && requestFolderId !== location.folderId) {
    return { workspaces, changed: false, needsReload: true };
  }

  const nextWorkspace = {
    ...workspace,
    updatedAt: event.updatedAt ?? workspace.updatedAt,
    version: event.workspaceVersion ?? workspace.version,
    collections: workspace.collections.map((collection) =>
      collection.id === location.collectionId
        ? {
            ...collection,
            items: updateRequestInItems(collection.items, request),
          }
        : collection,
    ),
  };

  return {
    workspaces: workspaces.map((item) =>
      item.id === workspaceId ? nextWorkspace : item,
    ),
    changed: true,
    needsReload: false,
  };
}
