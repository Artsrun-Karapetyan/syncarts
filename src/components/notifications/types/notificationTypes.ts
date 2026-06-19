export type NotificationTab = "direct" | "watching" | "all";

export type NotificationItem = {
  id: string;
  userId: string;
  workspaceId?: string | null;
  type: string;
  audience: "DIRECT" | "WATCHING" | "ALL";
  title: string;
  message: string;
  entityType:
    | "workspace"
    | "collection"
    | "request"
    | "merge_request"
    | "invite"
    | "app_update";
  entityId?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  actorAvatarUrl?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  isArchived: boolean;
  createdAt: string;
  readAt?: string | null;
};

export type NotificationCounts = {
  direct: number;
  watching: number;
  all: number;
};
