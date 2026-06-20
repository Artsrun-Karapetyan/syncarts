import { type Dispatch, type SetStateAction, useRef } from "react";

import { CollectionRow } from "@/components/layout/sidebar/collections/CollectionRow";
import { CollectionSearchInput } from "@/components/layout/sidebar/collections/CollectionSearchInput";
import { EmptyCollections } from "@/components/layout/sidebar/collections/EmptyCollections";
import { NewCollectionInput } from "@/components/layout/sidebar/collections/NewCollectionInput";
import { useScrollHighlightedSidebarItem } from "@/components/layout/sidebar/hooks/useScrollHighlightedSidebarItem";
import type {
  ContextMenuRequest,
  DeleteTarget,
  SidebarDragHandlers,
} from "@/components/layout/sidebar/types";
import type { Collection } from "@/contexts/WorkspaceContext";

export interface SidebarCollectionsProps {
  collections: Collection[];
  filteredCollections: Collection[];
  isAdding: boolean;
  newColName: string;
  collectionSearch: string;
  expandedCollections: Record<string, boolean>;
  expandedFolders: Record<string, boolean>;
  renamingId: string | null;
  renameValue: string;
  highlightedCollectionId: string | null;
  highlightedExampleId: string | null;
  highlightedRequestId: string | null;
  highlightedFolderId: string | null;
  setIsAdding: (value: boolean) => void;
  setNewColName: (value: string) => void;
  setCollectionSearch: (value: string) => void;
  setExpandedCollections: Dispatch<SetStateAction<Record<string, boolean>>>;
  setExpandedFolders: Dispatch<SetStateAction<Record<string, boolean>>>;
  setRenamingId: (value: string | null) => void;
  setRenameValue: (value: string) => void;
  setDeleteTarget: (value: DeleteTarget | null) => void;
  handleAddCollection: () => void;
  handleRenameSubmit: () => void;
  handleContextMenu: (request: ContextMenuRequest) => void;
  openCollectionTab: (collectionId: string) => void;
  dragHandlers: SidebarDragHandlers;
  isViewer?: boolean;
}

export function SidebarCollections(props: SidebarCollectionsProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useScrollHighlightedSidebarItem({
    highlightedCollectionId: props.highlightedCollectionId,
    highlightedExampleId: props.highlightedExampleId,
    highlightedFolderId: props.highlightedFolderId,
    highlightedRequestId: props.highlightedRequestId,
    scrollContainerRef,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}
    >
      <CollectionSearchInput
        value={props.collectionSearch}
        onChange={props.setCollectionSearch}
      />
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflow: "auto",
          minHeight: 0,
          paddingRight: 4,
          paddingBottom: 8,
        }}
      >
        <div style={{ minWidth: "max-content" }}>
          {props.isAdding && (
            <NewCollectionInput
              newColName={props.newColName}
              setNewColName={props.setNewColName}
              handleAddCollection={props.handleAddCollection}
              setIsAdding={props.setIsAdding}
            />
          )}
          {props.filteredCollections.map((collection) => (
            <CollectionRow
              key={collection.id}
              collection={collection}
              {...props}
            />
          ))}
          {props.collections.length === 0 && !props.isAdding && (
            <EmptyCollections onClick={() => props.setIsAdding(true)} />
          )}
        </div>
      </div>
    </div>
  );
}
