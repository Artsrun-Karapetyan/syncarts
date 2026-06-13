import { Edit2 } from "lucide-react";

import type { TabData } from "../../../contexts/WorkspaceContext";

interface WorkspaceRequestNameInputProps {
  activeTab: TabData;
  updateActiveTab: (data: Partial<TabData>) => void;
}

export function WorkspaceRequestNameInput({
  activeTab,
  updateActiveTab,
}: WorkspaceRequestNameInputProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          maxWidth: 400,
          width: "100%",
        }}
      >
        <input
          style={{
            fontSize: 15,
            fontWeight: 600,
            background: "transparent",
            border: "1px solid transparent",
            borderRadius: 6,
            padding: "6px 32px 6px 10px",
            color: "var(--text-primary)",
            outline: "none",
            width: "100%",
            fontFamily: "inherit",
            transition: "all 0.2s",
          }}
          value={activeTab.name || ""}
          placeholder="Untitled Request"
          onChange={(e) => updateActiveTab({ name: e.target.value })}
          onFocus={(e) => {
            e.currentTarget.style.background = "var(--bg-tertiary)";
            e.currentTarget.style.border = "1px solid var(--border-color)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.border = "1px solid transparent";
          }}
          onMouseEnter={(e) => {
            if (document.activeElement !== e.currentTarget) {
              e.currentTarget.style.background = "var(--bg-secondary)";
            }
          }}
          onMouseLeave={(e) => {
            if (document.activeElement !== e.currentTarget) {
              e.currentTarget.style.background = "transparent";
            }
          }}
        />
        <Edit2
          size={12}
          style={{
            position: "absolute",
            right: 12,
            color: "var(--text-tertiary)",
            pointerEvents: "none",
            opacity: activeTab.name ? 0.5 : 0.8,
          }}
        />
      </div>
    </div>
  );
}
