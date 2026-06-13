import { UserMinus } from "lucide-react";

import { Select } from "../../ui/Select";

interface InviteMemberActionsProps {
  canManageMembers: boolean;
  isOwner: boolean;
  loading: boolean;
  memberRole: string;
  onChangeRole: (role: string) => void;
  onRemove: () => void;
}

export function InviteMemberActions({
  canManageMembers,
  isOwner,
  loading,
  memberRole,
  onChangeRole,
  onRemove,
}: InviteMemberActionsProps) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
    >
      {canManageMembers && !isOwner ? (
        <Select
          value={memberRole}
          disabled={loading}
          onChange={onChangeRole}
          options={[
            { value: "MEMBER", label: "Editor" },
            { value: "VIEWER", label: "Viewer" },
          ]}
          variant="ghost"
          style={{
            width: 100,
            color:
              memberRole === "VIEWER"
                ? "var(--status-put)"
                : "var(--status-get)",
            background:
              memberRole === "VIEWER"
                ? "var(--status-put-bg)"
                : "var(--status-get-bg)",
          }}
        />
      ) : (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
          }}
        >
          {isOwner ? "Owner" : memberRole === "VIEWER" ? "Viewer" : "Editor"}
        </span>
      )}
      {canManageMembers && !isOwner && (
        <button
          className="btn"
          disabled={loading}
          onClick={onRemove}
          style={{
            height: 26,
            width: 30,
            padding: 0,
            justifyContent: "center",
            color: "var(--status-delete)",
          }}
        >
          <UserMinus size={14} />
        </button>
      )}
    </div>
  );
}
