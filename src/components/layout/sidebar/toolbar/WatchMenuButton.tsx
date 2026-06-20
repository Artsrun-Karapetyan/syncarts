import { Bell, BellOff } from "lucide-react";

import { MenuButton } from "@/components/layout/sidebar/context-menu/MenuButton";

type WatchMenuButtonProps = {
  entityType: "collection" | "request";
  entityId: string;
  isWatched: boolean;
  onDone: (message: string) => void;
  onToggle: (
    entityType: "collection" | "request",
    entityId: string,
  ) => Promise<boolean>;
};

export function WatchMenuButton({
  entityType,
  entityId,
  isWatched,
  onDone,
  onToggle,
}: WatchMenuButtonProps) {
  return (
    <MenuButton
      icon={isWatched ? BellOff : Bell}
      label={`${isWatched ? "Unwatch" : "Watch"} ${entityType}`}
      iconColor={isWatched ? "var(--status-put)" : "var(--accent-primary)"}
      onClick={() => {
        void onToggle(entityType, entityId)
          .then((enabled) =>
            onDone(`${enabled ? "Watching" : "Unwatched"} ${entityType}`),
          )
          .catch((error) => onDone(error.message || "Watch update failed"));
      }}
    />
  );
}
