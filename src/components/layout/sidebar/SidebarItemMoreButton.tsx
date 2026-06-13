import { MoreHorizontal } from "lucide-react";

export function SidebarItemMoreButton({
  onClick,
}: {
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      style={{
        opacity: 0,
        width: 22,
        height: 22,
        borderRadius: 5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-tertiary)",
        transition: "all var(--transition-fast)",
        flexShrink: 0,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.background = "var(--bg-secondary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "0";
        e.currentTarget.style.background = "transparent";
      }}
    >
      <MoreHorizontal size={13} />
    </div>
  );
}
