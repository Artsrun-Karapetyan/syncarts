import type { Dispatch, DragEvent, SetStateAction } from "react";
import { useState } from "react";

import {
  canDropSidebarEntity,
  getSidebarDropPosition,
  readSidebarDragData,
  writeSidebarDragData,
} from "@/components/layout/sidebar/drag-drop/sidebarDragHelpers";
import type {
  CtxMenuState,
  SidebarDragHandlers,
} from "@/components/layout/sidebar/types";
import type {
  SidebarMoveEntity,
  SidebarMoveTarget,
} from "@/contexts/WorkspaceContext";

interface UseSidebarDragHandlersArgs {
  collectionSearch: string;
  moveSidebarItem: (
    source: SidebarMoveEntity,
    target: SidebarMoveTarget,
  ) => void;
  setCtxMenu: (value: CtxMenuState | null) => void;
  setExpandedCollections: Dispatch<SetStateAction<Record<string, boolean>>>;
  setExpandedFolders: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function useSidebarDragHandlers(
  args: UseSidebarDragHandlersArgs,
): SidebarDragHandlers {
  const [draggingEntity, setDraggingEntity] =
    useState<SidebarMoveEntity | null>(null);
  const [dropTarget, setDropTarget] = useState<SidebarMoveTarget | null>(null);
  const canDrag = !args.collectionSearch.trim();

  const onDragStart = (
    entity: SidebarMoveEntity,
    event: DragEvent<HTMLElement>,
  ) => {
    if (!canDrag) return;
    args.setCtxMenu(null);
    setDraggingEntity(entity);
    writeSidebarDragData(event, entity);
  };

  const onDragOver = (
    target: SidebarMoveEntity,
    event: DragEvent<HTMLElement>,
  ) => {
    if (!canDrag || !draggingEntity) return;
    const nextTarget = {
      ...target,
      position: getSidebarDropPosition(event, draggingEntity, target),
    };
    if (!canDropSidebarEntity(draggingEntity, nextTarget)) return;

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setDropTarget(nextTarget);
    expandInsideTarget(nextTarget, args);
  };

  const clearDrag = () => {
    setDraggingEntity(null);
    setDropTarget(null);
  };

  const onDrop = (target: SidebarMoveEntity, event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const source = draggingEntity || readSidebarDragData(event);
    if (!canDrag || !source) return;

    const nextTarget = {
      ...target,
      position: getSidebarDropPosition(event, source, target),
    };
    if (canDropSidebarEntity(source, nextTarget)) {
      args.moveSidebarItem(source, nextTarget);
    }
    clearDrag();
  };

  return {
    canDrag,
    draggingEntity,
    dropTarget,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd: clearDrag,
  };
}

function expandInsideTarget(
  target: SidebarMoveTarget,
  args: UseSidebarDragHandlersArgs,
) {
  if (target.position !== "inside") return;
  if (target.type === "collection") {
    args.setExpandedCollections((prev) => ({
      ...prev,
      [target.collectionId]: true,
    }));
  }
  if (target.type === "folder" && target.itemId) {
    args.setExpandedFolders((prev) => ({ ...prev, [target.itemId!]: true }));
  }
}
