export type WatchEntityType = "workspace" | "collection" | "request";

export type WorkspaceWatch = {
  id: string;
  userId: string;
  workspaceId: string;
  entityType: WatchEntityType;
  entityId: string;
  createdAt: string;
};
