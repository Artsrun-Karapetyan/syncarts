import { isSharedWorkspace } from "@/contexts/workspace/sync/sharing";
import type { Workspace } from "@/contexts/WorkspaceContext";

interface InviteWorkspaceSelectorLabelProps {
  activeWorkspaceId: string;
  workspace: Workspace;
}

export function InviteWorkspaceSelectorLabel({
  activeWorkspaceId,
  workspace,
}: InviteWorkspaceSelectorLabelProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minWidth: 0,
        flex: 1,
      }}
    >
      <span
        style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {workspace.name}
        </span>
        {isSharedWorkspace(workspace) && (
          <span
            style={{
              flexShrink: 0,
              border: "1px solid rgba(99, 102, 241, 0.34)",
              borderRadius: 999,
              padding: "2px 7px",
              background: "rgba(99, 102, 241, 0.12)",
              color: "var(--text-secondary)",
              fontSize: 10,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            Shared
          </span>
        )}
      </span>
      <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
        {workspace.id === activeWorkspaceId
          ? "Current workspace"
          : "Available workspace"}
      </span>
    </div>
  );
}
