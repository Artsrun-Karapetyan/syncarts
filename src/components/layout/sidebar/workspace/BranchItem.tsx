import { GitBranch } from "lucide-react";

export function BranchItem({
  branch,
  isActive,
  onClick,
}: {
  branch: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "8px 14px",
        fontSize: 13,
        color: isActive ? "var(--accent-primary)" : "var(--text-primary)",
        background: isActive ? "var(--bg-tertiary)" : "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 10,
        transition: "background var(--transition-fast)",
      }}
      onMouseEnter={(e) => {
        if (!isActive)
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      <GitBranch size={14} style={{ opacity: isActive ? 1 : 0.4 }} />
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
        }}
      >
        {branch}
      </span>
      {isActive && (
        <span
          style={{
            fontSize: 10,
            background: "var(--accent-primary)",
            color: "#fff",
            padding: "2px 6px",
            borderRadius: 4,
            fontWeight: 600,
          }}
        >
          ACTIVE
        </span>
      )}
    </div>
  );
}
