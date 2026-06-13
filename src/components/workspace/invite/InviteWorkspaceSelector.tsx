import type { Workspace } from "../../../contexts/WorkspaceContext";
import { InviteWorkspaceSelectorLabel } from "./InviteWorkspaceSelectorLabel";

interface InviteWorkspaceSelectorProps {
  activeWorkspaceId: string;
  selectedWorkspaceIds: string[];
  setSelectedWorkspaceIds: (
    value: string[] | ((current: string[]) => string[]),
  ) => void;
  visibleWorkspaces: Workspace[];
}

export function InviteWorkspaceSelector({
  activeWorkspaceId,
  selectedWorkspaceIds,
  setSelectedWorkspaceIds,
  visibleWorkspaces,
}: InviteWorkspaceSelectorProps) {
  return (
    <div>
      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-secondary)",
          marginBottom: 12,
        }}
      >
        Choose Workspaces
      </h3>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxHeight: 180,
          overflowY: "auto",
        }}
      >
        {visibleWorkspaces.map((workspace) => {
          const checked = selectedWorkspaceIds.includes(workspace.id);

          return (
            <label
              key={workspace.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                border: "1px solid var(--border-color)",
                borderRadius: 10,
                background: checked ? "var(--bg-secondary)" : "transparent",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  setSelectedWorkspaceIds((current) =>
                    current.includes(workspace.id)
                      ? current.filter((id) => id !== workspace.id)
                      : [...current, workspace.id],
                  );
                }}
              />
              <InviteWorkspaceSelectorLabel
                activeWorkspaceId={activeWorkspaceId}
                workspace={workspace}
              />
            </label>
          );
        })}
        {visibleWorkspaces.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            No workspaces available.
          </div>
        )}
      </div>
    </div>
  );
}
