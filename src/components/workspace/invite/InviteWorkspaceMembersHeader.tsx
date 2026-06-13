import type { Workspace } from "../../../contexts/WorkspaceContext";

interface InviteWorkspaceMembersHeaderProps {
  activeWorkspaceId: string;
  memberCount: number;
  workspace: Workspace;
}

export function InviteWorkspaceMembersHeader({
  activeWorkspaceId,
  memberCount,
  workspace,
}: InviteWorkspaceMembersHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {workspace.name}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
          {memberCount} member{memberCount === 1 ? "" : "s"}
        </div>
      </div>
      {workspace.id === activeWorkspaceId && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--accent-primary)",
            textTransform: "uppercase",
          }}
        >
          Current
        </span>
      )}
    </div>
  );
}
