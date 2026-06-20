import type { RefObject } from "react";

import { WorkspaceSaveButtonGroup } from "@/components/layout/workspace/WorkspaceSaveButtonGroup";
import type { TabData } from "@/contexts/WorkspaceContext";

interface WorkspaceHeaderActionsProps {
  activeTab: TabData;
  handleDirectSave: () => void;
  saveBtnRef: RefObject<HTMLButtonElement | null>;
  setShowSaveDialog: (value: boolean | ((current: boolean) => boolean)) => void;
  splitDirection: "horizontal" | "vertical";
  toggleSplitDirection: () => void;
}

export function WorkspaceHeaderActions({
  activeTab,
  handleDirectSave,
  saveBtnRef,
  setShowSaveDialog,
  splitDirection,
  toggleSplitDirection,
}: WorkspaceHeaderActionsProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button
        className="btn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontSize: 12,
          padding: "0 12px",
          borderRadius: 6,
          height: 28,
          fontWeight: 600,
          background: "transparent",
          border: "1px solid var(--border-color)",
        }}
        onClick={toggleSplitDirection}
        title={
          splitDirection === "horizontal"
            ? "Stack request and response"
            : "Show request and response side by side"
        }
      >
        {splitDirection === "horizontal" ? "Stack Layout" : "Split Layout"}
      </button>
      {activeTab.type !== "example" && (
        <WorkspaceSaveButtonGroup
          handleDirectSave={handleDirectSave}
          saveBtnRef={saveBtnRef}
          setShowSaveDialog={setShowSaveDialog}
        />
      )}
    </div>
  );
}
