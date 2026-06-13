import { ChevronDown } from "lucide-react";
import type { RefObject } from "react";

interface WorkspaceSaveButtonGroupProps {
  handleDirectSave: () => void;
  saveBtnRef: RefObject<HTMLButtonElement | null>;
  setShowSaveDialog: (value: boolean | ((current: boolean) => boolean)) => void;
}

export function WorkspaceSaveButtonGroup({
  handleDirectSave,
  saveBtnRef,
  setShowSaveDialog,
}: WorkspaceSaveButtonGroupProps) {
  return (
    <div
      style={{
        display: "flex",
        borderRadius: 6,
        background: "var(--bg-tertiary)",
        overflow: "hidden",
        height: 28,
        border: "1px solid var(--border-color)",
      }}
    >
      <button
        ref={saveBtnRef}
        className="btn"
        style={{
          fontSize: 12,
          padding: "0 16px",
          height: "100%",
          fontWeight: 600,
          border: "none",
          borderRadius: 0,
          background: "transparent",
        }}
        onClick={handleDirectSave}
      >
        Save
      </button>
      <div
        style={{
          width: 1,
          background: "var(--border-color)",
          margin: "4px 0",
        }}
      />
      <button
        className="btn"
        style={{
          padding: "0 8px",
          height: "100%",
          border: "none",
          borderRadius: 0,
          background: "transparent",
        }}
        onClick={() => setShowSaveDialog((current) => !current)}
      >
        <ChevronDown size={14} />
      </button>
    </div>
  );
}
