import "./Notifications.css";

import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { hasUnreadNotifications } from "./helpers/notificationHelpers";
import { useNotifications } from "./hooks/useNotifications";
import { NotificationsPanel } from "./NotificationsPanel";
import type {
  NotificationItem,
  NotificationTab,
} from "./types/notificationTypes";

export function NotificationCenter() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<NotificationTab>("direct");
  const rootRef = useRef<HTMLDivElement>(null);
  const notifications = useNotifications(isOpen, tab);

  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  const handleAction = async (item: NotificationItem) => {
    await notifications.markRead(item.id);
    setIsOpen(false);
    if (item.actionUrl) navigate({ to: item.actionUrl as any });
  };

  return (
    <div ref={rootRef} className="notification-center">
      <button
        className="notification-bell tooltip-trigger"
        data-tooltip="Notifications"
        onClick={() => setIsOpen((value) => !value)}
      >
        <Bell size={17} />
        {hasUnreadNotifications(notifications.counts) && (
          <span>{Math.min(notifications.counts.all, 99)}</span>
        )}
      </button>

      {isOpen && (
        <NotificationsPanel
          counts={notifications.counts}
          error={notifications.error}
          isLoading={notifications.isLoading}
          items={notifications.items}
          tab={tab}
          onAction={handleAction}
          onClose={() => setIsOpen(false)}
          onMarkAllRead={notifications.markAllRead}
          onMarkRead={notifications.markRead}
          onTabChange={setTab}
        />
      )}
    </div>
  );
}
