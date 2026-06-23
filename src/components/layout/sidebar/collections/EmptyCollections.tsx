import { FolderPlus } from "lucide-react";

interface EmptyCollectionsProps {
  onClick: () => void;
}

export function EmptyCollections({ onClick }: EmptyCollectionsProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        marginTop: 32,
        color: "var(--text-tertiary)",
        cursor: "pointer",
        transition: "all var(--transition-fast)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--text-tertiary)";
      }}
    >
      <FolderPlus size={28} style={{ opacity: 0.8 }} />
      <div style={{ fontSize: 12, textAlign: "center", lineHeight: 1.5 }}>
        No collections yet.
        <br />
        Click here to create one.
      </div>
    </div>
  );
}
