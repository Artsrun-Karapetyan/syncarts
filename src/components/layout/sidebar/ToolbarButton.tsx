import type { LucideIcon } from "lucide-react";

interface ToolbarButtonProps {
  tooltip: string;
  tooltipPos?: "left" | "right" | "center";
  icon: LucideIcon;
  onClick: () => void;
  children?: React.ReactNode;
  color?: string;
  background?: string;
  hoverColor?: string;
  hoverBackground?: string;
}

export function ToolbarButton({
  tooltip,
  tooltipPos,
  icon: Icon,
  onClick,
  children,
  color = "var(--text-tertiary)",
  background = "transparent",
  hoverColor = "var(--text-primary)",
  hoverBackground = "var(--bg-tertiary)",
}: ToolbarButtonProps) {
  return (
    <div
      className="tooltip-trigger"
      data-tooltip={tooltip}
      data-tooltip-pos={tooltipPos}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        background,
        cursor: "pointer",
        transition: "all var(--transition-fast)",
        position: "relative",
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = hoverBackground;
        e.currentTarget.style.color = hoverColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = background;
        e.currentTarget.style.color = color;
      }}
    >
      <Icon size={14} />
      {children}
    </div>
  );
}
