import type {
  SavedRequest,
  SavedRequestLocation,
  TabData,
  Workspace,
} from "@/contexts/workspace/core/types";
import { buildSavedRequestFromTab } from "@/contexts/workspace/tabs/helpers/tabHelpers";
import { api } from "@/lib/api";

type SaveRequest = (
  collectionId: string,
  folderId: string | null,
  request: SavedRequest,
  options?: { markDirty?: boolean },
) => void;

interface RequestEntitySaveArgs {
  activeWorkspaceId: string;
  currentWorkspace: Workspace | undefined;
  findSavedRequestById: (requestId?: string) => SavedRequestLocation | null;
  rememberTabSnapshot: (tabId: string, request: Partial<TabData>) => void;
  resolveTabSavedRequestId: (tab?: TabData) => string | undefined;
  saveRequest: SaveRequest;
}

interface SavedRequestSaveResult {
  collectionId: string;
  folderId: string | null;
  request: SavedRequest;
  savedRequestId: string;
}

export function useRequestEntitySave(args: RequestEntitySaveArgs) {
  const saveSavedRequestTab = (tab: TabData): SavedRequestSaveResult | null => {
    const savedRequestId = args.resolveTabSavedRequestId(tab);
    if (!savedRequestId) return null;

    const saved = args.findSavedRequestById(savedRequestId);
    if (!saved) return null;

    const updatedRequest = buildSavedRequestFromTab(
      tab,
      savedRequestId,
      saved.request,
    );
    args.rememberTabSnapshot(tab.id, updatedRequest);
    args.saveRequest(saved.collectionId, saved.folderId, updatedRequest, {
      markDirty: args.currentWorkspace?.type === "local",
    });
    void syncRequestEntity(args, {
      collectionId: saved.collectionId,
      folderId: saved.folderId,
      request: updatedRequest,
    });

    return {
      collectionId: saved.collectionId,
      folderId: saved.folderId,
      request: updatedRequest,
      savedRequestId,
    };
  };

  return { saveSavedRequestTab };
}

async function syncRequestEntity(
  args: RequestEntitySaveArgs,
  payload: {
    collectionId: string;
    folderId: string | null;
    request: SavedRequest;
  },
) {
  if (!args.currentWorkspace?.ownerId) return;

  try {
    await api.patch(
      `/workspaces/${args.activeWorkspaceId}/requests/${payload.request.id}`,
      {
        ...payload.request,
        collectionId: payload.collectionId,
        folderId: payload.folderId,
      },
    );
  } catch (error) {
    console.error("Failed to sync request entity", error);
  }
}
