export const NotificationAudience = {
  All: "ALL",
  Direct: "DIRECT",
  Watching: "WATCHING",
} as const;

export type NotificationAudienceValue =
  (typeof NotificationAudience)[keyof typeof NotificationAudience];

export type CreateNotificationInput = {
  userId: string;
  workspaceId?: string | null;
  type: string;
  audience?: NotificationAudienceValue;
  title: string;
  message: string;
  entityType: string;
  entityId?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  actorAvatarUrl?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  metadata?: unknown;
};
