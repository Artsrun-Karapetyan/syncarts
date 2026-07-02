import type { CSSProperties, DragEvent } from "react";

import type { RowDropPosition } from "@/components/request/rowReorder";

export interface RowDropTarget {
  id: string;
  position: RowDropPosition;
}

export const REQUEST_ROW_DRAG_DATA_TYPE = "application/x-syncarts-request-row";

export function writeRowDragData(
  event: DragEvent<HTMLElement>,
  id: string,
  dragImage?: HTMLElement | null,
) {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(REQUEST_ROW_DRAG_DATA_TYPE, id);
  if (dragImage) {
    event.dataTransfer.setDragImage(dragImage, 24, dragImage.offsetHeight / 2);
  }
}

export function readRowDragData(event: DragEvent<HTMLElement>) {
  return event.dataTransfer.getData(REQUEST_ROW_DRAG_DATA_TYPE) || null;
}

export function getRowDropPosition(
  event: DragEvent<HTMLElement>,
): RowDropPosition {
  const rect = event.currentTarget.getBoundingClientRect();
  return event.clientY - rect.top > rect.height / 2 ? "after" : "before";
}

export function rowDropShadow(position: RowDropPosition) {
  return position === "after"
    ? "0 2px 0 0 var(--accent-primary)"
    : "0 -2px 0 0 var(--accent-primary)";
}

export function rowDropBackground(isDropTarget: boolean) {
  return isDropTarget ? "rgba(139, 92, 246, 0.08)" : "transparent";
}

export const ROW_DRAG_HANDLE_STYLE: CSSProperties = {
  width: 20,
  height: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--text-tertiary)",
  cursor: "grab",
  flexShrink: 0,
};
