import { useEffect, useState } from "react";

import { useWorkspace } from "../../../contexts/WorkspaceContext";
import type { NotificationItem } from "../types/notificationTypes";

type PendingTarget = {
  workspaceId: string;
  entityType: "workspace" | "collection" | "request";
  collectionId?: string;
  requestId?: string;
};

export function useNotificationAction() {
  const {
    activeWorkspaceId,
    openCollectionTab,
    openRequestTab,
    switchWorkspace,
  } = useWorkspace();
  const [pendingTarget, setPendingTarget] = useState<PendingTarget | null>(
    null,
  );

  useEffect(() => {
    if (!pendingTarget || activeWorkspaceId !== pendingTarget.workspaceId) {
      return;
    }

    openPendingTarget(pendingTarget, openCollectionTab, openRequestTab);
    setPendingTarget(null);
  }, [activeWorkspaceId, openCollectionTab, openRequestTab, pendingTarget]);

  const openNotificationTarget = (item: NotificationItem) => {
    const target = getNotificationTarget(item);
    if (!target) return false;

    if (activeWorkspaceId !== target.workspaceId) {
      setPendingTarget(target);
      switchWorkspace(target.workspaceId);
      return true;
    }

    openPendingTarget(target, openCollectionTab, openRequestTab);
    return true;
  };

  return { openNotificationTarget };
}

function openPendingTarget(
  target: PendingTarget,
  openCollectionTab: (collectionId: string) => void,
  openRequestTab: (
    collectionId: string,
    folderId: string | null,
    requestId: string,
  ) => void,
) {
  if (
    target.entityType === "request" &&
    target.collectionId &&
    target.requestId
  ) {
    openRequestTab(target.collectionId, null, target.requestId);
    return;
  }

  if (target.entityType === "collection" && target.collectionId) {
    openCollectionTab(target.collectionId);
  }
}

function getNotificationTarget(item: NotificationItem): PendingTarget | null {
  const workspaceId = getString(item.metadata?.workspaceId) || item.workspaceId;
  if (!workspaceId) return null;

  if (item.entityType === "request") {
    const requestId = getString(item.metadata?.requestId) || item.entityId;
    const collectionId = getString(item.metadata?.collectionId);
    if (!requestId || !collectionId) return null;
    return { workspaceId, entityType: "request", collectionId, requestId };
  }

  if (item.entityType === "collection") {
    const collectionId =
      getString(item.metadata?.collectionId) || item.entityId;
    if (!collectionId) return null;
    return { workspaceId, entityType: "collection", collectionId };
  }

  if (item.entityType === "workspace") {
    return { workspaceId, entityType: "workspace" };
  }

  return null;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}
