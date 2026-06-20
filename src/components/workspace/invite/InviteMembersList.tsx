import { Users } from "lucide-react";

import { InviteWorkspaceMembersBlock } from "@/components/workspace/invite/InviteWorkspaceMembersBlock";
import type { Workspace } from "@/contexts/WorkspaceContext";

interface InviteMembersListProps {
  activeWorkspaceId: string;
  loading: boolean;
  memberWorkspaces: Workspace[];
  onChangeRole: (
    targetWorkspaceId: string,
    memberUserId: string,
    newRole: string,
  ) => void;
  onRemoveMember: (targetWorkspaceId: string, memberUserId: string) => void;
  userId?: string;
}

export function InviteMembersList({
  activeWorkspaceId,
  loading,
  memberWorkspaces,
  onChangeRole,
  onRemoveMember,
  userId,
}: InviteMembersListProps) {
  if (memberWorkspaces.length === 0) return null;

  return (
    <div>
      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-secondary)",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Users size={15} />
        Workspace Members
      </h3>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxHeight: 220,
          overflowY: "auto",
        }}
      >
        {memberWorkspaces.map((memberWorkspace) => (
          <InviteWorkspaceMembersBlock
            key={memberWorkspace.id}
            activeWorkspaceId={activeWorkspaceId}
            loading={loading}
            memberWorkspace={memberWorkspace}
            onChangeRole={onChangeRole}
            onRemoveMember={onRemoveMember}
            userId={userId}
          />
        ))}
      </div>
    </div>
  );
}
