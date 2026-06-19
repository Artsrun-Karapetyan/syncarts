import { Pin, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useWorkspace } from "../../contexts/WorkspaceContext";
import { TabsBarContextMenu } from "./TabsBarContextMenu";
import {
  getTabDropPosition,
  readTabDragData,
  tabDropShadow,
  type TabDropTarget,
  writeTabDragData,
} from "./tabsDragHelpers";
import { useActiveTabSidebarHighlight } from "./useActiveTabSidebarHighlight";

interface TabsBarProps {
  onRequestCloseTab: (tabId: string) => void;
}

export function TabsBar({ onRequestCloseTab }: TabsBarProps) {
  const {
    tabs,
    activeTabId,
    activeTab,
    setActiveTabId,
    addTab,
    closeTab,
    moveTab,
    pinTab,
    isTabDirty,
    resolveTabSavedRequestId,
  } = useWorkspace();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    tabToDuplicate: any;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<TabDropTarget | null>(null);

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setCtxMenu(null);
    };

    if (ctxMenu) document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, [ctxMenu]);

  useEffect(() => {
    if (!scrollRef.current || !activeTabId) return;

    const activeTabEl = scrollRef.current.querySelector<HTMLElement>(
      `[data-tab-id="${activeTabId}"]`,
    );
    activeTabEl?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  }, [activeTabId]);

  useActiveTabSidebarHighlight({
    activeTab,
    activeTabId,
    resolveTabSavedRequestId,
  });

  const clearDragState = () => {
    setDraggingTabId(null);
    setDropTarget(null);
  };

  return (
    <div
      style={{
        flexShrink: 0,
        width: "100%",
        minWidth: 0,
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      <div style={{ display: "flex", alignItems: "stretch", minWidth: 0 }}>
        <div
          ref={scrollRef}
          style={{
            display: "flex",
            alignItems: "stretch",
            flex: 1,
            minWidth: 0,
            overflowX: "auto",
            overflowY: "hidden",
            minHeight: 32,
          }}
          onWheel={(event) => {
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
            event.currentTarget.scrollLeft += event.deltaY;
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              minWidth: "max-content",
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              const isDirty = isTabDirty(tab);
              const isDragging = draggingTabId === tab.id;
              const isDropTarget = dropTarget?.tabId === tab.id;
              return (
                <div
                  key={tab.id}
                  data-tab-id={tab.id}
                  draggable
                  onDragStart={(event) => {
                    setCtxMenu(null);
                    setDraggingTabId(tab.id);
                    writeTabDragData(event, tab.id);
                  }}
                  onDragOver={(event) => {
                    if (!draggingTabId || draggingTabId === tab.id) return;
                    event.preventDefault();
                    event.stopPropagation();
                    event.dataTransfer.dropEffect = "move";
                    setDropTarget({
                      tabId: tab.id,
                      position: getTabDropPosition(event),
                    });
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const sourceId = draggingTabId || readTabDragData(event);
                    if (sourceId && sourceId !== tab.id) {
                      moveTab(sourceId, tab.id, getTabDropPosition(event));
                    }
                    clearDragState();
                  }}
                  onDragEnd={clearDragState}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setCtxMenu({
                      x: e.clientX,
                      y: e.clientY,
                      tabToDuplicate: tab,
                    });
                  }}
                  onAuxClick={(e) => {
                    if (e.button === 1 && !tab.pinned) {
                      e.preventDefault();
                      onRequestCloseTab(tab.id);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    whiteSpace: "nowrap",
                    borderRight: "1px solid var(--border-color)",
                    width: tab.pinned ? 112 : 140,
                    padding: "0 10px",
                    fontSize: 12,
                    borderTop: isActive
                      ? "2px solid var(--accent-primary)"
                      : "2px solid transparent",
                    background: isActive ? "var(--bg-primary)" : "transparent",
                    color: isActive
                      ? "var(--text-primary)"
                      : "var(--text-tertiary)",
                    opacity: isDragging ? 0.45 : 1,
                    boxShadow: isDropTarget
                      ? tabDropShadow(dropTarget.position)
                      : "none",
                  }}
                  onClick={() => {
                    const wasActive = activeTabId === tab.id;
                    const savedRequestId = resolveTabSavedRequestId(tab);
                    const exampleId =
                      tab.type === "example" ? tab.exampleId : undefined;
                    setActiveTabId(tab.id);
                    if (wasActive && (savedRequestId || exampleId)) {
                      window.dispatchEvent(
                        new CustomEvent("highlight-sidebar", {
                          detail: { exampleId, savedRequestId },
                        }),
                      );
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "var(--bg-tertiary)";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }
                    const closeBtn = e.currentTarget.querySelector(
                      ".tab-close-btn",
                    ) as HTMLElement;
                    if (closeBtn) closeBtn.style.opacity = "1";
                    const dirtyDot = e.currentTarget.querySelector(
                      ".tab-dirty-dot",
                    ) as HTMLElement;
                    if (dirtyDot) dirtyDot.style.opacity = "0";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--text-tertiary)";
                    }
                    const closeBtn = e.currentTarget.querySelector(
                      ".tab-close-btn",
                    ) as HTMLElement;
                    if (closeBtn)
                      closeBtn.style.opacity = isActive ? "0.5" : "0";
                    const dirtyDot = e.currentTarget.querySelector(
                      ".tab-dirty-dot",
                    ) as HTMLElement;
                    if (dirtyDot) dirtyDot.style.opacity = "1";
                  }}
                >
                  {tab.pinned ? (
                    <Pin
                      size={12}
                      style={{ color: "var(--accent-primary)", flexShrink: 0 }}
                    />
                  ) : (
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 10,
                        color: `var(--status-${tab.method?.toLowerCase() || "get"})`,
                        flexShrink: 0,
                      }}
                    >
                      {tab.method}
                    </span>
                  )}
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                      fontWeight: 500,
                    }}
                  >
                    {tab.name || "Untitled Request"}
                  </span>
                  <div
                    style={{
                      position: "relative",
                      width: 20,
                      height: 20,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isDirty && (
                      <div
                        className="tab-dirty-dot"
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "var(--status-put)", // Orange dot
                          position: "absolute",
                          transition: "opacity 0.15s",
                        }}
                      />
                    )}
                    {!tab.pinned && (
                      <div
                        className="tab-close-btn"
                        style={{
                          padding: 4,
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: isActive && !isDirty ? 0.5 : 0,
                          transition: "all var(--transition-fast)",
                          position: "absolute",
                          background: "transparent",
                          color: "inherit",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestCloseTab(tab.id);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "var(--status-delete-bg)";
                          e.currentTarget.style.color = "var(--status-delete)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "inherit";
                        }}
                      >
                        <X size={13} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 16px",
                color: "var(--text-tertiary)",
                cursor: "pointer",
                flexShrink: 0,
                transition: "all var(--transition-fast)",
              }}
              onClick={() => addTab()}
              title="New Tab"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.background = "var(--bg-tertiary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-tertiary)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Plus size={15} />
            </div>
          </div>
        </div>
      </div>
      <TabsBarContextMenu
        ctxMenu={ctxMenu}
        setCtxMenu={setCtxMenu}
        menuRef={menuRef}
        addTab={addTab}
        closeTab={closeTab}
        pinTab={pinTab}
        onRequestCloseTab={onRequestCloseTab}
        tabs={tabs}
      />
    </div>
  );
}
