/* eslint-disable react/no-multi-comp */
import { Copy, FilePlus, X, XCircle, XSquare } from "lucide-react";

interface TabsBarContextMenuProps {
  ctxMenu: { x: number; y: number; tabToDuplicate: any } | null;
  setCtxMenu: (v: null) => void;
  menuRef: React.RefObject<HTMLDivElement>;
  addTab: (data?: any) => void;
  closeTab: (id: string) => void;
  onRequestCloseTab: (id: string) => void;
  tabs: any[];
}

const CtxMenuItem = ({ icon: Icon, label, shortcut, onClick, danger }: any) => (
  <div
    style={{
      padding: "6px 10px",
      fontSize: 13,
      color: danger ? "var(--status-delete)" : "var(--text-secondary)",
      cursor: "pointer",
      borderRadius: "4px",
      transition: "background var(--transition-fast)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    }}
    onClick={onClick}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = danger
        ? "var(--status-delete-bg)"
        : "var(--bg-secondary)";
      e.currentTarget.style.color = danger
        ? "var(--status-delete)"
        : "var(--text-primary)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.color = danger
        ? "var(--status-delete)"
        : "var(--text-secondary)";
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {Icon && <Icon size={14} />}
      <span>{label}</span>
    </div>
    {shortcut && (
      <span
        style={{
          fontSize: 11,
          color: "var(--text-tertiary)",
          letterSpacing: "0.05em",
          fontFamily: "var(--font-mono)",
        }}
      >
        {shortcut}
      </span>
    )}
  </div>
);

const Divider = () => (
  <div
    style={{ height: 1, background: "var(--border-color)", margin: "4px 0" }}
  />
);

export function TabsBarContextMenu({
  ctxMenu,
  setCtxMenu,
  menuRef,
  addTab,
  closeTab,
  onRequestCloseTab,
  tabs,
}: TabsBarContextMenuProps) {
  if (!ctxMenu) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: ctxMenu.y,
        left: ctxMenu.x,
        zIndex: 1000,
        background: "var(--bg-primary)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-lg)",
        padding: "4px",
        minWidth: 220,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <CtxMenuItem
        icon={FilePlus}
        label="New Request"
        shortcut="⌘ T"
        onClick={() => {
          addTab();
          setCtxMenu(null);
        }}
      />
      <CtxMenuItem
        icon={Copy}
        label="Duplicate Tab"
        onClick={() => {
          const cloneData = { ...ctxMenu.tabToDuplicate };
          delete cloneData.id;
          delete cloneData.savedRequestId;
          delete cloneData.collectionId;
          delete cloneData.folderId;
          delete cloneData.exampleId;
          addTab({
            ...cloneData,
            name: `${cloneData.name || "Untitled Request"} (Copy)`,
          });
          setCtxMenu(null);
        }}
      />
      <Divider />
      <CtxMenuItem
        icon={X}
        label="Close Tab"
        shortcut="⌘ W"
        onClick={() => {
          onRequestCloseTab(ctxMenu.tabToDuplicate.id);
          setCtxMenu(null);
        }}
      />
      <CtxMenuItem
        icon={XCircle}
        label="Force Close Tab"
        shortcut="⌥ ⌘ W"
        onClick={() => {
          closeTab(ctxMenu.tabToDuplicate.id);
          setCtxMenu(null);
        }}
      />
      <Divider />
      <CtxMenuItem
        icon={XSquare}
        label="Close Other Tabs"
        onClick={() => {
          tabs.forEach((t) => {
            if (t.id !== ctxMenu.tabToDuplicate.id) {
              closeTab(t.id);
            }
          });
          setCtxMenu(null);
        }}
      />
      <CtxMenuItem
        icon={XSquare}
        label="Close All Tabs"
        onClick={() => {
          tabs.forEach((t) => {
            onRequestCloseTab(t.id);
          });
          setCtxMenu(null);
        }}
      />
      <CtxMenuItem
        icon={XCircle}
        label="Force Close All Tabs"
        danger
        onClick={() => {
          tabs.forEach((t) => {
            closeTab(t.id);
          });
          setCtxMenu(null);
        }}
      />
    </div>
  );
}
