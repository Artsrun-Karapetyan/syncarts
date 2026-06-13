import { Loader2, Mail } from "lucide-react";
import type React from "react";

interface InviteEmailFormProps {
  email: string;
  loading: boolean;
  onSubmit: (event: React.FormEvent) => void;
  selectedWorkspaceIds: string[];
  setEmail: (value: string) => void;
}

export function InviteEmailForm({
  email,
  loading,
  onSubmit,
  selectedWorkspaceIds,
  setEmail,
}: InviteEmailFormProps) {
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
        Add Member by Email
      </h3>
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Mail
            size={16}
            style={{
              position: "absolute",
              left: 12,
              top: 10,
              color: "var(--text-tertiary)",
            }}
          />
          <input
            type="email"
            className="input"
            style={{ width: "100%", paddingLeft: 36 }}
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !email || selectedWorkspaceIds.length === 0}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            "Add Member"
          )}
        </button>
      </form>
      <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>
        The selected user will be added to every checked workspace.
      </p>
    </div>
  );
}
