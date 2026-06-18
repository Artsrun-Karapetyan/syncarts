import type { DragEvent } from "react";

export const TAB_DRAG_DATA_TYPE = "application/x-syncarts-tab";

export type TabDropPosition = "before" | "after";

export interface TabDropTarget {
  tabId: string;
  position: TabDropPosition;
}

export function writeTabDragData(event: DragEvent<HTMLElement>, tabId: string) {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(TAB_DRAG_DATA_TYPE, tabId);
}

export function readTabDragData(event: DragEvent<HTMLElement>) {
  return event.dataTransfer.getData(TAB_DRAG_DATA_TYPE) || null;
}

export function getTabDropPosition(
  event: DragEvent<HTMLElement>,
): TabDropPosition {
  const rect = event.currentTarget.getBoundingClientRect();
  return event.clientX - rect.left > rect.width / 2 ? "after" : "before";
}

export function tabDropShadow(position: TabDropPosition) {
  return position === "after"
    ? "inset -2px 0 0 var(--accent-primary)"
    : "inset 2px 0 0 var(--accent-primary)";
}
