import { GitFork } from "lucide-react";

import type { Collection } from "../../../contexts/WorkspaceContext";

interface CollectionNameProps {
  collection: Collection;
  renamingId: string | null;
  renameValue: string;
  setRenameValue: (value: string) => void;
  handleRenameSubmit: () => void;
  setRenamingId: (value: string | null) => void;
}

export function CollectionName({
  collection,
  renamingId,
  renameValue,
  setRenameValue,
  handleRenameSubmit,
  setRenamingId,
}: CollectionNameProps) {
  if (renamingId === collection.id) {
    return (
      <input
        autoFocus
        className="input"
        style={{
          fontSize: 13,
          flex: 1,
          padding: "2px 6px",
          margin: "-2px -6px",
        }}
        value={renameValue}
        onChange={(e) => setRenameValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleRenameSubmit();
          if (e.key === "Escape") setRenamingId(null);
        }}
        onBlur={handleRenameSubmit}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        flex: 1,
        overflow: "hidden",
      }}
    >
      <span
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {collection.name}
      </span>
      {collection.fork && (
        <span
          style={{
            alignItems: "center",
            color: "var(--accent-primary)",
            display: "inline-flex",
            flexShrink: 0,
          }}
          title="This is a forked collection"
          aria-label="Forked collection"
        >
          <GitFork size={13} />
        </span>
      )}
    </div>
  );
}
