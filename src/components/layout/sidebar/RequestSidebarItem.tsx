import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { useEffect, useState } from "react";

import {
  type SavedRequest,
  useWorkspace,
} from "../../../contexts/WorkspaceContext";
import { RenameableName } from "./RenameableName";
import { dragRowStyle } from "./sidebarDragStyles";
import type { SidebarItemProps } from "./SidebarItem";
import { SidebarItemMoreButton } from "./SidebarItemMoreButton";
import { itemRowStyle, toggleStyle } from "./sidebarItemStyles";

export function RequestSidebarItem({
  item,
  collectionId,
  parentFolderId,
  onContextMenu,
  renamingId,
  setRenamingId,
  renameValue,
  setRenameValue,
  handleRenameSubmit,
  highlightedExampleId,
  highlightedRequestId,
  dragHandlers,
  isViewer,
}: SidebarItemProps & { item: SavedRequest }) {
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);
  const { openExampleTab, openRequestTab } = useWorkspace();
  const isHighlighted = highlightedRequestId === item.id;
  const entity = { type: "request" as const, collectionId, itemId: item.id };

  useEffect(() => {
    if (item.examples?.some((example) => example.id === highlightedExampleId))
      setIsExamplesOpen(true);
  }, [highlightedExampleId, item.examples]);

  return (
    <>
      <div
        className="sidebar-row"
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
        onClick={() => openRequestTab(collectionId, parentFolderId, item.id)}
        onContextMenu={(event) => {
          if (isViewer) return;
          onContextMenu({
            event,
            itemId: item.id,
            type: "request",
            itemName: item.name,
          });
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg-tertiary)";
          e.currentTarget.style.color = "var(--text-primary)";
          e.currentTarget.style.transform = "translateX(2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isHighlighted
            ? "var(--bg-tertiary)"
            : "transparent";
          e.currentTarget.style.color = isHighlighted
            ? "var(--text-primary)"
            : "var(--text-secondary)";
          e.currentTarget.style.transform = "translateX(0)";
        }}
      >
        <div
          onClick={(e) => {
            if (!item.examples?.length) return;
            e.stopPropagation();
            setIsExamplesOpen(!isExamplesOpen);
          }}
          style={toggleStyle(item.examples?.length ? "pointer" : "default")}
        >
          {item.examples?.length ? (
            isExamplesOpen ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : null}
        </div>
        <span
          className="font-mono"
          style={{
            fontSize: 10,
            fontWeight: 700,
            flexShrink: 0,
            width: 40,
            color: `var(--status-${item.method.toLowerCase()})`,
          }}
        >
          {item.method}
        </span>
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
                type: "request",
                itemName: item.name,
              })
            }
          />
        )}
      </div>
      {isExamplesOpen && item.examples?.length ? (
        <div>
          {item.examples.map((example) => {
            const isExampleHighlighted = highlightedExampleId === example.id;
            const exampleEntity = {
              type: "example" as const,
              collectionId,
              itemId: example.id,
              requestId: item.id,
            };
            return (
              <div
                key={example.id}
                className="sidebar-row"
                draggable={dragHandlers.canDrag && renamingId !== example.id}
                style={dragRowStyle({
                  base: {
                    ...itemRowStyle(isExampleHighlighted),
                    fontSize: 12,
                    color: isExampleHighlighted
                      ? "var(--text-primary)"
                      : "var(--text-tertiary)",
                    paddingLeft: 28,
                  },
                  entity: exampleEntity,
                  draggingEntity: dragHandlers.draggingEntity,
                  dropTarget: dragHandlers.dropTarget,
                })}
                onDragStart={(event) =>
                  dragHandlers.onDragStart(exampleEntity, event)
                }
                onDragOver={(event) =>
                  dragHandlers.onDragOver(exampleEntity, event)
                }
                onDrop={(event) => dragHandlers.onDrop(exampleEntity, event)}
                onDragEnd={dragHandlers.onDragEnd}
                onClick={() => openExampleTab(collectionId, example.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isViewer) return;
                  onContextMenu({
                    event: e,
                    itemId: example.id,
                    type: "example",
                    itemName: example.name,
                    requestId: item.id,
                  });
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-tertiary)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.transform = "translateX(2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isExampleHighlighted
                    ? "var(--bg-tertiary)"
                    : "transparent";
                  e.currentTarget.style.color = isExampleHighlighted
                    ? "var(--text-primary)"
                    : "var(--text-tertiary)";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                <FileText size={13} style={{ opacity: 0.3 }} />
                <RenameableName
                  isRenaming={renamingId === example.id}
                  value={renameValue}
                  setValue={setRenameValue}
                  onSubmit={handleRenameSubmit}
                  onCancel={() => setRenamingId(null)}
                  name={example.name}
                />
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
