import { Check } from "lucide-react";

import {
  formatNotificationTime,
  getActorInitial,
} from "@/components/notifications/helpers/notificationHelpers";
import { NotificationTypeIcon } from "@/components/notifications/NotificationTypeIcon";
import type { NotificationItem } from "@/components/notifications/types/notificationTypes";

type NotificationListItemProps = {
  item: NotificationItem;
  onAction: (item: NotificationItem) => void;
  onMarkRead: (id: string) => void;
};

export function NotificationListItem({
  item,
  onAction,
  onMarkRead,
}: NotificationListItemProps) {
  return (
    <div className={`notification-item ${item.isRead ? "" : "is-unread"}`}>
      <div className="notification-avatar">
        {item.actorAvatarUrl ? (
          <img src={item.actorAvatarUrl} alt="" />
        ) : (
          getActorInitial(item)
        )}
      </div>

      <div className="notification-body">
        <div className="notification-title-row">
          <span className="notification-type-icon">
            <NotificationTypeIcon type={item.type} />
          </span>
          <strong>{item.title}</strong>
          <time>{formatNotificationTime(item.createdAt)}</time>
        </div>
        <p>{item.message}</p>
        <div className="notification-actions">
          {item.actionUrl && (
            <button onClick={() => onAction(item)}>
              {item.actionLabel || "Open"}
            </button>
          )}
          {!item.isRead && (
            <button onClick={() => onMarkRead(item.id)}>
              <Check size={13} />
              Read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
