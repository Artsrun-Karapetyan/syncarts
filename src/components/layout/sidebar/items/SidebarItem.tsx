import type { Dispatch, SetStateAction } from "react";

import { FolderSidebarItem } from "@/components/layout/sidebar/items/FolderSidebarItem";
import { RequestSidebarItem } from "@/components/layout/sidebar/items/RequestSidebarItem";
import type {
  SidebarDragHandlers,
  SidebarItemContextMenuHandler,
} from "@/components/layout/sidebar/types";
import type {
  Folder as IFolder,
  SavedRequest,
} from "@/contexts/WorkspaceContext";

export interface SidebarItemProps {
  item: IFolder | SavedRequest;
  collectionId: string;
  parentFolderId: string | null;
  onContextMenu: SidebarItemContextMenuHandler;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
  renameValue: string;
  setRenameValue: (val: string) => void;
  handleRenameSubmit: () => void;
  expandedFolders: Record<string, boolean>;
  setExpandedFolders: Dispatch<SetStateAction<Record<string, boolean>>>;
  highlightedExampleId: string | null;
  highlightedRequestId: string | null;
  highlightedFolderId: string | null;
  searchQuery?: string;
  dragHandlers: SidebarDragHandlers;
  isViewer?: boolean;
}

export function SidebarItem(props: SidebarItemProps) {
  if (props.item.type === "request")
    return <RequestSidebarItem {...props} item={props.item} />;
  return <FolderSidebarItem {...props} item={props.item} />;
}
