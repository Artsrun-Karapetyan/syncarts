import type { CSSProperties } from "react";

import type {
  SidebarMoveEntity,
  SidebarMoveTarget,
} from "@/contexts/WorkspaceContext";

interface DragRowStyleParams {
  base: CSSProperties;
  entity: SidebarMoveEntity;
  draggingEntity: SidebarMoveEntity | null;
  dropTarget: SidebarMoveTarget | null;
}

export function dragRowStyle(params: DragRowStyleParams): CSSProperties {
  const isDragging = isSameEntity(params.entity, params.draggingEntity);
  const isDropTarget = isSameEntity(params.entity, params.dropTarget);

  if (!isDragging && !isDropTarget) return params.base;

  return {
    ...params.base,
    opacity: isDragging ? 0.45 : params.base.opacity,
    boxShadow: isDropTarget
      ? dropShadow(params.dropTarget?.position)
      : params.base.boxShadow,
  };
}

function dropShadow(position?: string) {
  if (position === "before") return "inset 0 2px 0 var(--accent-primary)";
  if (position === "after") return "inset 0 -2px 0 var(--accent-primary)";
  return "inset 0 0 0 1px var(--accent-primary)";
}

function isSameEntity(
  a: SidebarMoveEntity | null,
  b: SidebarMoveEntity | null,
) {
  if (!a || !b) return false;
  return (
    a.type === b.type &&
    a.collectionId === b.collectionId &&
    a.itemId === b.itemId
  );
}
