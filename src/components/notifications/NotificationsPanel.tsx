import { CheckCheck, Settings, X } from "lucide-react";

import {
  getNotificationCount,
  notificationTabs,
} from "./helpers/notificationHelpers";
import { NotificationListItem } from "./NotificationListItem";
import type {
  NotificationCounts,
  NotificationItem,
  NotificationTab,
} from "./types/notificationTypes";

type NotificationsPanelProps = {
  counts: NotificationCounts;
  error: string | null;
  isLoading: boolean;
  items: NotificationItem[];
  tab: NotificationTab;
  onAction: (item: NotificationItem) => void;
  onClose: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onTabChange: (tab: NotificationTab) => void;
};

export function NotificationsPanel(props: NotificationsPanelProps) {
  const {
    counts,
    error,
    isLoading,
    items,
    tab,
    onAction,
    onClose,
    onMarkAllRead,
    onMarkRead,
    onTabChange,
  } = props;

  return (
    <aside className="notifications-panel">
      <header className="notifications-header">
        <h2>Notifications</h2>
        <div className="notifications-header-actions">
          <button
            className="tooltip-trigger"
            data-tooltip="Mark all read"
            onClick={onMarkAllRead}
          >
            <CheckCheck size={16} />
          </button>
          <button
            className="tooltip-trigger"
            data-tooltip="Notification settings"
          >
            <Settings size={16} />
          </button>
          <button
            className="tooltip-trigger"
            data-tooltip="Close"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
      </header>

      <div className="notification-tabs" role="tablist">
        {notificationTabs.map((item) => (
          <button
            key={item.id}
            className={item.id === tab ? "is-active" : ""}
            onClick={() => onTabChange(item.id)}
            role="tab"
          >
            <span>{item.label}</span>
            {getNotificationCount(counts, item.id) > 0 && (
              <b>{getNotificationCount(counts, item.id)}</b>
            )}
          </button>
        ))}
      </div>

      <div className="notifications-list">
        {error && <div className="notifications-state">{error}</div>}
        {!error && isLoading && (
          <div className="notifications-state">Loading...</div>
        )}
        {!error && !isLoading && items.length === 0 && (
          <div className="notifications-state">You&apos;re all caught up.</div>
        )}
        {!error &&
          items.map((item) => (
            <NotificationListItem
              key={item.id}
              item={item}
              onAction={onAction}
              onMarkRead={onMarkRead}
            />
          ))}
      </div>
    </aside>
  );
}
