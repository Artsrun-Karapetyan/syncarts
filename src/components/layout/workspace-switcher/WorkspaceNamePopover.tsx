import { createPortal } from "react-dom";

const popoverStyle: React.CSSProperties = {
  padding: 12,
  zIndex: 1000000,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  boxShadow: "var(--shadow-lg)",
  background: "var(--bg-primary)",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const popoverTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--text-primary)",
};

const popoverInputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 12,
  padding: "7px 10px",
};

const popoverButtonStyle: React.CSSProperties = {
  padding: "5px 9px",
  fontSize: 11,
};

const popoverPrimaryButtonStyle: React.CSSProperties = {
  padding: "5px 9px",
  fontSize: 11,
  borderRadius: "var(--radius-sm)",
};

interface WorkspaceNamePopoverProps {
  actionLabel: string;
  inputRef: React.RefObject<HTMLDivElement | null>;
  mode: "sidebar" | "topbar";
  position: { top: number; left: number; width: number } | null;
  title: string;
  value: string;
  onCancel: () => void;
  onSubmit: () => void;
  onValueChange: (value: string) => void;
  workspaceType?: "cloud" | "local";
  onWorkspaceTypeChange?: (type: "cloud" | "local") => void;
  localPath?: string;
  onSelectLocalPath?: () => void;
  isAuthenticated?: boolean;
}

export function WorkspaceNamePopover(props: WorkspaceNamePopoverProps) {
  const {
    actionLabel,
    inputRef,
    mode,
    position,
    title,
    value,
    onCancel,
    onSubmit,
    onValueChange,
    workspaceType,
    onWorkspaceTypeChange,
    localPath,
    onSelectLocalPath,
    isAuthenticated = true,
  } = props;

  return createPortal(
    <div
      ref={inputRef}
      className="glass-panel animate-fade-in"
      style={{
        ...popoverStyle,
        position: "fixed",
        top: `${position?.top ?? 0}px`,
        left: `${position?.left ?? 0}px`,
        width: `${position?.width ?? (mode === "topbar" ? 300 : 280)}px`,
      }}
    >
      <div style={popoverTitleStyle}>{title}</div>
      <input
        autoFocus
        className="input"
        style={popoverInputStyle}
        placeholder="Workspace Name"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
          if (e.key === "Escape") onCancel();
        }}
      />
      {workspaceType && onWorkspaceTypeChange && (
        <div
          style={{ display: "flex", gap: 12, marginTop: 4, marginBottom: 4 }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: isAuthenticated
                ? "var(--text-secondary)"
                : "var(--text-tertiary)",
              cursor: isAuthenticated ? "pointer" : "not-allowed",
            }}
          >
            <input
              type="radio"
              checked={workspaceType === "cloud"}
              onChange={() => onWorkspaceTypeChange("cloud")}
              disabled={!isAuthenticated}
            />
            Team Sync (Cloud){" "}
            {!isAuthenticated && (
              <span style={{ fontSize: 9, opacity: 0.7 }}>
                (Sign in required)
              </span>
            )}
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              checked={workspaceType === "local"}
              onChange={() => onWorkspaceTypeChange("local")}
            />
            Local Folder
          </label>
        </div>
      )}
      {workspaceType === "local" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            className="btn"
            style={{ fontSize: 11, padding: "4px 8px" }}
            onClick={async () => {
              try {
                if (onSelectLocalPath) await onSelectLocalPath();
              } catch (err) {
                console.error("Failed to select folder:", err);
              }
            }}
          >
            {localPath ? "Change Folder" : "Select Folder"}
          </button>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-tertiary)",
              flex: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {localPath || "No folder selected"}
          </div>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button className="btn" style={popoverButtonStyle} onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          style={popoverPrimaryButtonStyle}
          onClick={onSubmit}
        >
          {actionLabel}
        </button>
      </div>
    </div>,
    document.body,
  );
}
