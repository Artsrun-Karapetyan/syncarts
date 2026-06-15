import {
  ChevronDown,
  ChevronRight,
  Folder,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

import type { Collection } from "../../../contexts/WorkspaceContext";
import { CollectionName } from "./CollectionName";
import { HoverIcon } from "./HoverIcon";
import type { SidebarCollectionsProps } from "./SidebarCollections";
import { SidebarItem } from "./SidebarItem";
import { countItems } from "./utils";

export function CollectionRow({
  collection,
  ...props
}: SidebarCollectionsProps & { collection: Collection }) {
  const expanded = props.expandedCollections[collection.id];

  return (
    <div style={{ display: "flex", flexDirection: "column", marginBottom: 8 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "var(--text-primary)",
          fontWeight: 600,
          padding: "6px 10px",
          background: "var(--bg-tertiary)",
          boxShadow:
            props.highlightedCollectionId === collection.id
              ? "inset 0 0 0 1px var(--accent-primary)"
              : "none",
          borderRadius: 6,
          cursor: "pointer",
          transition: "all var(--transition-fast)",
        }}
        onClick={() => {
          if (!expanded)
            props.setExpandedCollections((prev) => ({
              ...prev,
              [collection.id]: true,
            }));
          props.openCollectionTab(collection.id);
        }}
        onContextMenu={(event) =>
          props.handleContextMenu({
            event,
            collectionId: collection.id,
            itemId: null,
            itemType: "collection",
            itemName: collection.name,
          })
        }
      >
        <button
          type="button"
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-tertiary)",
            flexShrink: 0,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            transition: "color var(--transition-fast)",
          }}
          onClick={(e) => {
            e.stopPropagation();
            props.setExpandedCollections((prev) => ({
              ...prev,
              [collection.id]: !prev[collection.id],
            }));
          }}
          aria-label={expanded ? "Collapse collection" : "Expand collection"}
        >
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        <Folder
          size={13}
          style={{ color: "var(--accent-primary)", flexShrink: 0 }}
        />
        <CollectionName
          collection={collection}
          renamingId={props.renamingId}
          renameValue={props.renameValue}
          setRenameValue={props.setRenameValue}
          handleRenameSubmit={props.handleRenameSubmit}
          setRenamingId={props.setRenamingId}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "var(--text-tertiary)",
            background: "var(--bg-secondary)",
            borderRadius: 8,
            padding: "1px 7px",
            flexShrink: 0,
          }}
        >
          {countItems(collection.items)}
        </span>
        <HoverIcon
          color="var(--status-delete)"
          title="Delete Collection"
          onClick={() =>
            props.setDeleteTarget({ id: collection.id, type: "collection" })
          }
        >
          <Trash2 size={13} />
        </HoverIcon>
        <HoverIcon
          onClick={(event) =>
            props.handleContextMenu({
              event,
              collectionId: collection.id,
              itemId: collection.id,
              itemType: "collection",
              itemName: collection.name,
            })
          }
        >
          <MoreHorizontal size={13} />
        </HoverIcon>
      </div>
      {expanded && (
        <div
          style={{
            borderLeft: "1px solid var(--border-color)",
            marginLeft: 22,
            marginTop: 2,
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {collection.items.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              collectionId={collection.id}
              parentFolderId={null}
              onContextMenu={(request) =>
                props.handleContextMenu({
                  event: request.event,
                  collectionId: collection.id,
                  itemId: request.itemId,
                  itemType: request.type,
                  itemName: request.itemName,
                  requestId: request.requestId,
                })
              }
              renamingId={props.renamingId}
              setRenamingId={props.setRenamingId}
              renameValue={props.renameValue}
              setRenameValue={props.setRenameValue}
              handleRenameSubmit={props.handleRenameSubmit}
              expandedFolders={props.expandedFolders}
              setExpandedFolders={props.setExpandedFolders}
              highlightedExampleId={props.highlightedExampleId}
              highlightedRequestId={props.highlightedRequestId}
              highlightedFolderId={props.highlightedFolderId}
              searchQuery={props.collectionSearch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
