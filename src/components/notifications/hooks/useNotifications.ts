import { useCallback, useEffect, useState } from "react";

import {
  fetchNotificationCounts,
  fetchNotifications,
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

  const refreshItems = useCallback(async () => {
    if (!isOpen) return;
    try {
      setIsLoading(true);
      setError(null);
      setItems(await fetchNotifications(tab));
    } catch (err) {
      console.error("Failed to fetch notifications", err);
      setError("Could not load notifications.");
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, tab]);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    void refreshItems();
  }, [refreshItems]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshCounts();
      void refreshItems();
    }, 60_000);
    return () => window.clearInterval(interval);
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
