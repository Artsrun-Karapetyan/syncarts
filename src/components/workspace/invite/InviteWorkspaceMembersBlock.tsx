import type { Workspace } from "../../../contexts/WorkspaceContext";
import { InviteMemberActions } from "./InviteMemberActions";
import { InviteWorkspaceMembersHeader } from "./InviteWorkspaceMembersHeader";

interface InviteWorkspaceMembersBlockProps {
  activeWorkspaceId: string;
  loading: boolean;
  memberWorkspace: Workspace;
  onChangeRole: (
    targetWorkspaceId: string,
    memberUserId: string,
    newRole: string,
  ) => void;
  onRemoveMember: (targetWorkspaceId: string, memberUserId: string) => void;
  userId?: string;
}

export function InviteWorkspaceMembersBlock({
  activeWorkspaceId,
  loading,
  memberWorkspace,
  onChangeRole,
  onRemoveMember,
  userId,
}: InviteWorkspaceMembersBlockProps) {
  const members = memberWorkspace.members || [];
  const canManageMembers =
    !!memberWorkspace.ownerId && memberWorkspace.ownerId === userId;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <InviteWorkspaceMembersHeader
        activeWorkspaceId={activeWorkspaceId}
        memberCount={members.length || 1}
        workspace={memberWorkspace}
      />
      {members.length > 0 ? (
        members.map((member) => {
          const isOwner = member.userId === memberWorkspace.ownerId;
          return (
            <div
              key={`${memberWorkspace.id}-${member.userId}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "9px 10px",
                border: "1px solid var(--border-color)",
                borderRadius: 10,
                background: "var(--bg-secondary)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {member.user?.name || member.user?.email || member.userId}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-tertiary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {member.user?.email || member.role}
                </div>
              </div>
              <InviteMemberActions
                canManageMembers={canManageMembers}
                isOwner={isOwner}
                loading={loading}
                memberRole={member.role}
                onChangeRole={(role) =>
                  onChangeRole(memberWorkspace.id, member.userId, role)
                }
                onRemove={() =>
                  onRemoveMember(memberWorkspace.id, member.userId)
                }
              />
            </div>
          );
        })
      ) : (
        <div
          style={{
            fontSize: 12,
            color: "var(--text-tertiary)",
            padding: "9px 10px",
            border: "1px dashed var(--border-color)",
            borderRadius: 10,
          }}
        >
          Only you are in this workspace.
        </div>
      )}
    </div>
  );
}
