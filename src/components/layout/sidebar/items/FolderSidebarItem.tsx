import { ChevronDown, ChevronRight, Folder } from "lucide-react";

import { dragRowStyle } from "@/components/layout/sidebar/drag-drop/sidebarDragStyles";
import { RenameableName } from "@/components/layout/sidebar/items/RenameableName";
import {
  SidebarItem,
  type SidebarItemProps,
} from "@/components/layout/sidebar/items/SidebarItem";
import { SidebarItemMoreButton } from "@/components/layout/sidebar/items/SidebarItemMoreButton";
import { itemRowStyle } from "@/components/layout/sidebar/sidebarItemStyles";
import {
  type Folder as IFolder,
  useWorkspace,
} from "@/contexts/WorkspaceContext";

export function FolderSidebarItem({
  item,
  collectionId,
  onContextMenu,
  renamingId,
  setRenamingId,
  renameValue,
  setRenameValue,
  handleRenameSubmit,
  expandedFolders,
  setExpandedFolders,
  highlightedExampleId,
  highlightedRequestId,
  highlightedFolderId,
  searchQuery = "",
  dragHandlers,
  isViewer,
}: SidebarItemProps & { item: IFolder }) {
  const { openFolderTab } = useWorkspace();
  const isHighlighted = highlightedFolderId === item.id;
  const isExpanded = expandedFolders[item.id] || !!searchQuery;
  const entity = { type: "folder" as const, collectionId, itemId: item.id };

  return (
    <div>
      <div
        className="sidebar-row"
        data-sidebar-id={item.id}
        data-sidebar-kind="folder"
        draggable={dragHandlers.canDrag && renamingId !== item.id}
        style={dragRowStyle({
          base: itemRowStyle(isHighlighted),
          entity,
          draggingEntity: dragHandlers.draggingEntity,
          dropTarget: dragHandlers.dropTarget,
        })}
        onDragStart={(event) => dragHandlers.onDragStart(entity, event)}
        onDragOver={(event) => dragHandlers.onDragOver(entity, event)}
        onDrop={(event) => dragHandlers.onDrop(entity, event)}
        onDragEnd={dragHandlers.onDragEnd}
        onClick={() => {
          if (!expandedFolders[item.id])
            setExpandedFolders((prev) => ({ ...prev, [item.id]: true }));
          openFolderTab(collectionId, item.id);
        }}
        onContextMenu={(event) => {
          if (isViewer) return;
          onContextMenu({
            event,
            itemId: item.id,
            type: "folder",
            itemName: item.name,
          });
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg-tertiary)";
          e.currentTarget.style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isHighlighted
            ? "var(--bg-tertiary)"
            : "transparent";
          e.currentTarget.style.color = isHighlighted
            ? "var(--text-primary)"
            : "var(--text-secondary)";
        }}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            setExpandedFolders((prev) => ({
              ...prev,
              [item.id]: !prev[item.id],
            }));
          }}
          style={{
            display: "flex",
            alignItems: "center",
            padding: 2,
            margin: -2,
            borderRadius: 4,
          }}
          className="hover-bg-secondary"
        >
          {isExpanded ? (
            <ChevronDown size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
          ) : (
            <ChevronRight size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
          )}
        </div>
        <Folder
          size={14}
          style={{ color: "var(--accent-primary)", flexShrink: 0 }}
        />
        <RenameableName
          isRenaming={renamingId === item.id}
          value={renameValue}
          setValue={setRenameValue}
          onSubmit={handleRenameSubmit}
          onCancel={() => setRenamingId(null)}
          name={item.name}
        />
        {!isViewer && (
          <SidebarItemMoreButton
            onClick={(event) =>
              onContextMenu({
                event,
                itemId: item.id,
                type: "folder",
                itemName: item.name,
              })
            }
          />
        )}
      </div>
      {isExpanded && (
        <div
          style={{
            borderLeft: "1px solid var(--border-color)",
            marginLeft: 14,
            marginTop: 2,
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {item.items.map((subItem) => (
            <SidebarItem
              key={subItem.id}
              item={subItem}
              collectionId={collectionId}
              parentFolderId={item.id}
              onContextMenu={onContextMenu}
              renamingId={renamingId}
              setRenamingId={setRenamingId}
              renameValue={renameValue}
              setRenameValue={setRenameValue}
              handleRenameSubmit={handleRenameSubmit}
              expandedFolders={expandedFolders}
              setExpandedFolders={setExpandedFolders}
              highlightedExampleId={highlightedExampleId}
              highlightedRequestId={highlightedRequestId}
              highlightedFolderId={highlightedFolderId}
              searchQuery={searchQuery}
              dragHandlers={dragHandlers}
              isViewer={isViewer}
            />
          ))}
        </div>
      )}
    </div>
  );
}
