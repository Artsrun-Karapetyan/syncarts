import type {
  WatchEntityType,
  WorkspaceWatch,
} from "@/components/watch/watchTypes";
import { api } from "@/lib/api";

export async function fetchWorkspaceWatches(workspaceId: string) {
  const params = new URLSearchParams({ workspaceId });
  const response = await api.get<WorkspaceWatch[]>(
    `/watches?${params.toString()}`,
  );
  return response.data;
}

export async function setWorkspaceWatch(input: {
  workspaceId: string;
  entityType: WatchEntityType;
  entityId: string;
  enabled: boolean;
}) {
  const response = await api.patch<WorkspaceWatch | { enabled: false }>(
    "/watches",
    input,
  );
  return response.data;
}
