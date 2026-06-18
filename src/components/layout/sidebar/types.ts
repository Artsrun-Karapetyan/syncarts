import type { RefObject } from "react";
import type { DragEvent } from "react";

import type {
  SidebarMoveEntity,
  SidebarMoveTarget,
} from "../../../contexts/WorkspaceContext";

export type SidebarItemType = "collection" | "folder" | "request" | "example";

export interface CtxMenuState {
  x: number;
  y: number;
  collectionId: string;
  itemId: string | null;
  itemType: SidebarItemType;
  itemName?: string;
  requestId?: string;
}

export interface DeleteTarget {
  id: string;
  type: "collection" | "item" | "example";
  collectionId?: string;
  requestId?: string;
}

export interface MergeRequestTarget {
  sourceCollectionId: string;
  targetWorkspaceId: string;
  targetCollectionId: string;
}

export interface ContextMenuRequest {
  event: React.MouseEvent;
  collectionId: string;
  itemId: string | null;
  itemType: SidebarItemType;
  itemName?: string;
  requestId?: string;
}

export interface SidebarItemContextMenuRequest {
  event: React.MouseEvent;
  itemId: string;
  type: "folder" | "request" | "example";
  itemName: string;
  requestId?: string;
}

export type SidebarItemContextMenuHandler = (
  request: SidebarItemContextMenuRequest,
) => void;

export type MenuRef = RefObject<HTMLDivElement | null>;

export interface SidebarDragHandlers {
  canDrag: boolean;
  draggingEntity: SidebarMoveEntity | null;
  dropTarget: SidebarMoveTarget | null;
  onDragStart: (
    entity: SidebarMoveEntity,
    event: DragEvent<HTMLElement>,
  ) => void;
  onDragOver: (
    target: SidebarMoveEntity,
    event: DragEvent<HTMLElement>,
  ) => void;
  onDrop: (target: SidebarMoveEntity, event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}
