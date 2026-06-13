import { Check, Copy, Link as LinkIcon } from "lucide-react";

interface InviteLinkSectionProps {
  copied: boolean;
  generatedLink: string;
  loading: boolean;
  onCopy: () => void;
  onGenerateLink: () => void;
  selectedWorkspaceIds: string[];
}

export function InviteLinkSection({
  copied,
  generatedLink,
  loading,
  onCopy,
  onGenerateLink,
  selectedWorkspaceIds,
}: InviteLinkSectionProps) {
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
        Share an Invite Link
      </h3>
      {!generatedLink ? (
        <button
          className="btn"
          onClick={onGenerateLink}
          disabled={loading || selectedWorkspaceIds.length === 0}
          style={{ width: "100%", justifyContent: "center" }}
        >
          <LinkIcon size={16} style={{ marginRight: 8 }} />
          Generate Link
        </button>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            readOnly
            className="input font-mono"
            style={{ width: "100%", fontSize: 12 }}
            value={generatedLink}
            onClick={(e) => e.currentTarget.select()}
          />
          <button
            className="btn btn-primary"
            onClick={onCopy}
            style={{ width: 100, justifyContent: "center" }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>
        Anyone with this link can join the selected workspaces. The link will
        open SyncArts directly.
      </p>
    </div>
  );
}
