import { ExternalLink } from "lucide-react";

import type { DuplicateRequestGroup } from "@/components/request/duplicates/requestDuplicateTypes";

interface Props {
  collectionId: string;
  group: DuplicateRequestGroup;
  onOpenRequest: (
    collectionId: string,
    folderId: string | null,
    requestId: string,
  ) => void;
}

export function DuplicateRequestGroupCard(props: Props) {
  const { collectionId, group, onOpenRequest } = props;

  return (
    <div
      style={{
        background: "var(--bg-primary)",
        border: "1px solid var(--border-color)",
        borderRadius: 6,
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          color: "var(--text-secondary)",
          fontFamily: "monospace",
          fontSize: 12,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            color: group.kind === "exact" ? "#ef4444" : "#eab308",
            fontFamily: "inherit",
            fontWeight: 700,
            marginRight: 8,
            textTransform: "uppercase",
          }}
        >
          {group.kind}
        </span>
        {group.key}
      </div>
      {group.requests.map((match) => (
        <button
          key={match.request.id}
          type="button"
          className="btn"
          onClick={() =>
            onOpenRequest(collectionId, match.folderId, match.request.id)
          }
          style={{
            alignItems: "center",
            display: "flex",
            gap: 8,
            justifyContent: "space-between",
            marginTop: 4,
            padding: "6px 8px",
            width: "100%",
          }}
        >
          <span
            style={{
              minWidth: 0,
              overflow: "hidden",
              textAlign: "left",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {match.folderPath ? `${match.folderPath} / ` : ""}
            {match.request.name}
          </span>
          <ExternalLink size={12} style={{ flexShrink: 0 }} />
        </button>
      ))}
    </div>
  );
}
