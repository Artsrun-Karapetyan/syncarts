import { Plus } from "lucide-react";
import { createPortal } from "react-dom";

import type { HoveredVariable } from "@/components/request/auth/AuthTokenInput";

interface AuthVariablePopoverProps {
  activeCollectionId?: string;
  hideTimeout: React.MutableRefObject<any>;
  hoveredVar: HoveredVariable;
  onAddVar: (varName: string, value: string) => void;
  onMouseLeave: () => void;
  onOpenCollectionVariables: () => void;
}

export function AuthVariablePopover(props: AuthVariablePopoverProps) {
  const {
    activeCollectionId,
    hideTimeout,
    hoveredVar,
    onAddVar,
    onMouseLeave,
    onOpenCollectionVariables,
  } = props;
  const inputId = `auth-env-var-input-${hoveredVar.name}`;

  return createPortal(
    <div
      style={{
        position: "fixed",
        left: hoveredVar.x,
        top: hoveredVar.y,
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-sm)",
        padding: 0,
        zIndex: 999999,
        boxShadow: "var(--shadow-lg)",
        minWidth: 340,
        overflow: "hidden",
        fontSize: 13,
        color: "var(--text-primary)",
      }}
      onMouseEnter={() => clearTimeout(hideTimeout.current)}
      onMouseLeave={onMouseLeave}
    >
      <div
        style={{
          padding: "14px 16px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <input
          id={inputId}
          className="input"
          style={{ fontSize: 13, padding: "8px 10px", height: 36 }}
          defaultValue={hoveredVar.value || ""}
          placeholder="Enter value"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter")
              onAddVar(hoveredVar.name, e.currentTarget.value);
          }}
        />
        <button
          className="btn"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={() => {
            const input = document.getElementById(inputId) as HTMLInputElement;
            onAddVar(hoveredVar.name, input?.value || "");
          }}
        >
          <Plus size={14} /> {hoveredVar.exists ? "Update" : "Add"}{" "}
          {activeCollectionId ? "Collection" : "Environment"} Variable
        </button>
      </div>
      <button
        type="button"
        onClick={onOpenCollectionVariables}
        disabled={!activeCollectionId}
        style={{
          width: "100%",
          border: 0,
          borderTop: "1px solid var(--border-color)",
          background: "transparent",
          color: activeCollectionId
            ? "var(--text-secondary)"
            : "var(--text-tertiary)",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: activeCollectionId ? "pointer" : "default",
          fontSize: 13,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 5,
              background: "#9b7200",
              color: "#fff0a8",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}
          >
            C
          </span>
          Collection
        </span>
        <span>Variables in request -&gt;</span>
      </button>
    </div>,
    document.body,
  );
}
