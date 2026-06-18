import type { DragEvent } from "react";

import type {
  SidebarDropPosition,
  SidebarMoveEntity,
  SidebarMoveTarget,
} from "../../../contexts/WorkspaceContext";

export const SIDEBAR_DRAG_DATA_TYPE = "application/x-syncarts-sidebar";

export function writeSidebarDragData(
  event: DragEvent<HTMLElement>,
  entity: SidebarMoveEntity,
) {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(SIDEBAR_DRAG_DATA_TYPE, JSON.stringify(entity));
}

export function readSidebarDragData(
  event: DragEvent<HTMLElement>,
): SidebarMoveEntity | null {
  const payload = event.dataTransfer.getData(SIDEBAR_DRAG_DATA_TYPE);
  if (!payload) return null;

  try {
    return JSON.parse(payload) as SidebarMoveEntity;
  } catch {
    return null;
  }
}

export function getSidebarDropPosition(
  event: DragEvent<HTMLElement>,
  source: SidebarMoveEntity,
  target: SidebarMoveEntity,
): SidebarDropPosition {
  if (target.type === "collection")
    return source.type === "collection"
      ? getVerticalEdgePosition(event)
      : "inside";

  if (target.type === "request")
    return source.type === "example"
      ? "inside"
      : getVerticalEdgePosition(event);
  if (target.type === "example") return getVerticalEdgePosition(event);

  const rect = event.currentTarget.getBoundingClientRect();
  const y = event.clientY - rect.top;
  if (y < rect.height * 0.25) return "before";
  if (y > rect.height * 0.75) return "after";
  return "inside";
}

export function canDropSidebarEntity(
  source: SidebarMoveEntity,
  target: SidebarMoveTarget,
) {
  if (isSameSidebarEntity(source, target)) return false;
  if (source.type === "collection") return target.type === "collection";
  if (source.type === "example")
    return target.type === "request" || target.type === "example";
  if (target.type === "example") return false;
  return true;
}

function getVerticalEdgePosition(
  event: DragEvent<HTMLElement>,
): SidebarDropPosition {
  const rect = event.currentTarget.getBoundingClientRect();
  return event.clientY - rect.top > rect.height / 2 ? "after" : "before";
}

function isSameSidebarEntity(
  source: SidebarMoveEntity,
  target: SidebarMoveEntity,
) {
  return (
    source.type === target.type &&
    source.collectionId === target.collectionId &&
    source.itemId === target.itemId
  );
}
