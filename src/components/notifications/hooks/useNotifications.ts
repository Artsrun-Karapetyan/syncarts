import { useCallback, useEffect, useState } from "react";

import {
  fetchNotificationCounts,
  fetchNotifications,
  getNotificationEventsUrl,
  markNotificationRead,
  markNotificationsRead,
} from "../api/notificationApi";
import type {
  NotificationCounts,
  NotificationItem,
  NotificationTab,
} from "../types/notificationTypes";

const emptyCounts: NotificationCounts = { direct: 0, watching: 0, all: 0 };

export function useNotifications(isOpen: boolean, tab: NotificationTab) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>(emptyCounts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCounts = useCallback(async () => {
    try {
      setCounts(await fetchNotificationCounts());
    } catch (err) {
      console.error("Failed to fetch notification counts", err);
    }
  }, []);

  const refreshItems = useCallback(
    async (showLoader = false) => {
      if (!isOpen) return;
      try {
        if (showLoader) setIsLoading(true);
        setError(null);
        const nextItems = await fetchNotifications(tab);
        setItems((current) =>
          areNotificationListsEqual(current, nextItems) ? current : nextItems,
        );
      } catch (err) {
        console.error("Failed to fetch notifications", err);
        setError("Could not load notifications.");
      } finally {
        setIsLoading(false);
      }
    },
    [isOpen, tab],
  );

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    void refreshItems(items.length === 0);
  }, [refreshItems]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshCounts();
      void refreshItems(false);
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [refreshCounts, refreshItems]);

  useEffect(() => {
    const url = getNotificationEventsUrl();
    if (!url) return;

    const source = new EventSource(url);
    source.onmessage = () => {
      void refreshCounts();
      void refreshItems(false);
    };
    source.addEventListener("notifications_changed", () => {
      void refreshCounts();
      void refreshItems(false);
    });
    source.onerror = (error) => {
      console.error("Notification realtime connection failed", error);
    };

    return () => source.close();
  }, [refreshCounts, refreshItems]);

  const markRead = async (id: string) => {
    await markNotificationRead(id);
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, isRead: true } : item,
      ),
    );
    await refreshCounts();
  };

  const markAllRead = async () => {
    await markNotificationsRead(tab);
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    await refreshCounts();
  };

  return {
    counts,
    error,
    isLoading,
    items,
    markAllRead,
    markRead,
    refreshItems,
  };
}

function areNotificationListsEqual(
  current: NotificationItem[],
  next: NotificationItem[],
) {
  if (current.length !== next.length) return false;

  return current.every((item, index) => {
    const nextItem = next[index];
    return (
      nextItem &&
      item.id === nextItem.id &&
      item.isRead === nextItem.isRead &&
      item.title === nextItem.title &&
      item.message === nextItem.message &&
      item.createdAt === nextItem.createdAt
    );
  });
}
