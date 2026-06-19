export const WatchEntityTypes = {
  Collection: "collection",
  Request: "request",
  Workspace: "workspace",
} as const;

export type WatchEntityType =
  (typeof WatchEntityTypes)[keyof typeof WatchEntityTypes];

export type WatchInput = {
  workspaceId: string;
  entityType: WatchEntityType;
  entityId: string;
};

export type WatchNotificationInput = {
  workspaceId: string;
  actorId: string;
  entityType: WatchEntityType;
  entityId: string;
  collectionId?: string | null;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
};
