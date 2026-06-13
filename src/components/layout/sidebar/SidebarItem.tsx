import type { Dispatch, SetStateAction } from 'react';

import type { Folder as IFolder, SavedRequest } from '../../../contexts/WorkspaceContext';
import { FolderSidebarItem } from './FolderSidebarItem';
import { RequestSidebarItem } from './RequestSidebarItem';
import type { SidebarItemContextMenuHandler } from './types';

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
  highlightedRequestId: string | null;
  highlightedFolderId: string | null;
  searchQuery?: string;
}

export function SidebarItem(props: SidebarItemProps) {
  if (props.item.type === 'request') return <RequestSidebarItem {...props} item={props.item} />;
  return <FolderSidebarItem {...props} item={props.item} />;
}
