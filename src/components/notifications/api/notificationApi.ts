import type {
  NotificationCounts,
  NotificationItem,
  NotificationTab,
} from "@/components/notifications/types/notificationTypes";
import { api, API_URL, getToken } from "@/lib/api";

export async function fetchNotifications(tab: NotificationTab) {
  const params = new URLSearchParams({ tab, take: "50" });
  const response = await api.get<NotificationItem[]>(
    `/notifications?${params.toString()}`,
  );
  return response.data;
}

export async function fetchNotificationCounts() {
  const response = await api.get<NotificationCounts>("/notifications/counts");
  return response.data;
}

export async function markNotificationRead(id: string, isRead = true) {
  await api.patch(`/notifications/${id}/read`, { isRead });
}

export async function markNotificationsRead(tab: NotificationTab) {
  await api.patch("/notifications/read-all", { tab });
}

export function getNotificationEventsUrl() {
  const token = getToken();
  if (!token) return null;
  const params = new URLSearchParams({ access_token: token });
  return `${API_URL}/notifications/events?${params.toString()}`;
}
