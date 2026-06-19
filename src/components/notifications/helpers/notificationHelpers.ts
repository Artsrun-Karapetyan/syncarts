import type {
  NotificationCounts,
  NotificationItem,
  NotificationTab,
} from "../types/notificationTypes";

export const notificationTabs: Array<{
  id: NotificationTab;
  label: string;
}> = [
  { id: "direct", label: "Direct" },
  { id: "watching", label: "Watching" },
  { id: "all", label: "All" },
];

export function getNotificationCount(
  counts: NotificationCounts,
  tab: NotificationTab,
) {
  return counts[tab] || 0;
}

export function hasUnreadNotifications(counts: NotificationCounts) {
  return counts.all > 0;
}

export function getActorInitial(notification: NotificationItem) {
  return (
    notification.actorName?.trim()?.[0] ||
    notification.title.trim()[0] ||
    "N"
  ).toUpperCase();
}

export function formatNotificationTime(value: string, now = Date.now()) {
  const createdAt = new Date(value).getTime();
  if (Number.isNaN(createdAt)) return "";

  const diffSeconds = Math.max(0, Math.floor((now - createdAt) / 1000));
  if (diffSeconds < 60) return "now";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
